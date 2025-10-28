import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/v1/https';
import { RoleManager, UserRole, UserContext } from './roleManager';
import { z } from 'zod';

export interface AuthenticatedRequest extends CallableContext {
  user: UserContext;
}

export interface AuthOptions {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  allowSelf?: boolean; // Allow user to access their own resources
  universityScope?: boolean; // Restrict to same university
}

/**
 * Authentication middleware for Cloud Functions
 */
export class AuthMiddleware {
  /**
   * Verify authentication and extract user context
   */
  static async verifyAuth(context: CallableContext): Promise<UserContext> {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to perform this action'
      );
    }

    const userContext = await RoleManager.getUserContext(context.auth.uid);
    if (!userContext) {
      throw new functions.https.HttpsError(
        'not-found',
        'User context not found'
      );
    }

    return userContext;
  }

  /**
   * Check if user meets authentication requirements
   */
  static async checkAuth(
    context: CallableContext,
    options: AuthOptions = {},
    resourceContext?: { userId?: string; universityId?: string; courseId?: string }
  ): Promise<UserContext> {
    const userContext = await this.verifyAuth(context);

    // Check role requirements
    if (options.requiredRole) {
      const requiredRoles = Array.isArray(options.requiredRole) 
        ? options.requiredRole 
        : [options.requiredRole];
      
      if (!requiredRoles.includes(userContext.role)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          `Required role: ${requiredRoles.join(' or ')}, current role: ${userContext.role}`
        );
      }
    }

    // Check permission requirements
    if (options.requiredPermission) {
      const hasPermission = RoleManager.hasPermission(
        userContext.role,
        options.requiredPermission.resource,
        options.requiredPermission.action,
        resourceContext
      );

      if (!hasPermission) {
        throw new functions.https.HttpsError(
          'permission-denied',
          `Insufficient permissions for ${options.requiredPermission.action} on ${options.requiredPermission.resource}`
        );
      }
    }

    // Check self-access (user accessing their own resources)
    if (options.allowSelf && resourceContext?.userId) {
      if (userContext.uid !== resourceContext.userId) {
        // If not self-access, still check permissions
        if (options.requiredPermission) {
          const hasPermission = RoleManager.hasPermission(
            userContext.role,
            options.requiredPermission.resource,
            options.requiredPermission.action,
            resourceContext
          );

          if (!hasPermission) {
            throw new functions.https.HttpsError(
              'permission-denied',
              'Can only access own resources or require appropriate permissions'
            );
          }
        }
      }
    }

    // Check university scope restrictions
    if (options.universityScope && resourceContext?.universityId) {
      if (userContext.role === UserRole.UNIVERSITY_ADMIN || 
          userContext.role === UserRole.INSTRUCTOR) {
        if (userContext.universityId !== resourceContext.universityId) {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Access restricted to your university scope'
          );
        }
      }
    }

    return userContext;
  }

  /**
   * Middleware wrapper for Cloud Functions
   */
  static withAuth<T = any>(
    options: AuthOptions = {}
  ) {
    return (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) => {
      const method = descriptor.value;

      descriptor.value = async function(data: T, context: CallableContext) {
        try {
          // Extract resource context from data if available
          const resourceContext = {
            userId: (data as any)?.userId,
            universityId: (data as any)?.universityId,
            courseId: (data as any)?.courseId
          };

          // Perform authentication check
          const userContext = await AuthMiddleware.checkAuth(
            context,
            options,
            resourceContext
          );

          // Add user context to the function context
          const enhancedContext = {
            ...context,
            user: userContext
          } as AuthenticatedRequest;

          // Call the original method with enhanced context
          return await method.call(this, data, enhancedContext);
        } catch (error) {
          // Log authentication failures for security monitoring
          console.error('Authentication error:', {
            uid: context.auth?.uid,
            error: error.message,
            function: propertyName,
            data: JSON.stringify(data, null, 2)
          });
          throw error;
        }
      };
    };
  }

  /**
   * Rate limiting middleware (basic implementation)
   */
  static async checkRateLimit(
    uid: string,
    action: string,
    limit: number = 100,
    windowMs: number = 60000
  ): Promise<void> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      const rateLimitDoc = admin.firestore()
        .collection('rateLimits')
        .doc(`${uid}_${action}`);

      await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitDoc);
        
        if (doc.exists) {
          const data = doc.data()!;
          const requests = data.requests.filter((timestamp: number) => timestamp > windowStart);
          
          if (requests.length >= limit) {
            throw new functions.https.HttpsError(
              'resource-exhausted',
              `Rate limit exceeded. Maximum ${limit} requests per minute.`
            );
          }
          
          requests.push(now);
          transaction.update(rateLimitDoc, {
            requests,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          transaction.set(rateLimitDoc, {
            requests: [now],
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error('Rate limiting error:', error);
      // Don't block requests if rate limiting fails
    }
  }

  /**
   * IP-based access control
   */
  static checkIPAccess(context: CallableContext, allowedIPs?: string[]): void {
    if (!allowedIPs || allowedIPs.length === 0) return;

    const clientIP = context.rawRequest.ip || 
                    context.rawRequest.connection.remoteAddress ||
                    context.rawRequest.headers['x-forwarded-for'];

    if (!clientIP) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Unable to verify client IP'
      );
    }

    const normalizedIP = Array.isArray(clientIP) ? clientIP[0] : clientIP;
    
    if (!allowedIPs.includes(normalizedIP)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Access denied from this IP address'
      );
    }
  }

  /**
   * Time-based access control
   */
  static checkTimeAccess(
    allowedHours?: { start: number; end: number },
    timezone: string = 'UTC'
  ): void {
    if (!allowedHours) return;

    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < allowedHours.start || currentHour > allowedHours.end) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Access allowed only between ${allowedHours.start}:00 and ${allowedHours.end}:00`
      );
    }
  }

  /**
   * Validate request data against schema
   */
  static validateData<T>(data: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid request data',
          {
            errors: error.errors,
            received: data
          }
        );
      }
      throw error;
    }
  }

  /**
   * Log security events for monitoring
   */
  static async logSecurityEvent(
    event: string,
    context: CallableContext,
    details?: any
  ): Promise<void> {
    try {
      await admin.firestore().collection('securityLogs').add({
        event,
        uid: context.auth?.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: context.rawRequest.ip,
        userAgent: context.rawRequest.headers['user-agent'],
        details: details || {}
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error for logging failure
    }
  }
}

/**
 * Enhanced decorator for functions requiring specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return AuthMiddleware.withAuth({ requiredRole: roles });
}

/**
 * Enhanced decorator for functions requiring specific permissions
 */
export function requirePermission(resource: string, action: string) {
  return AuthMiddleware.withAuth({
    requiredPermission: { resource, action }
  });
}

/**
 * Decorator for admin-only functions
 */
export function adminOnly() {
  return requireRole(UserRole.ADMIN);
}

/**
 * Decorator for university admin functions
 */
export function universityAdminOnly() {
  return requireRole(UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN);
}

/**
 * Decorator for instructor functions
 */
export function instructorOnly() {
  return requireRole(UserRole.ADMIN, UserRole.INSTRUCTOR);
}

/**
 * Decorator allowing self-access or admin access
 */
export function selfOrAdmin() {
  return AuthMiddleware.withAuth({
    allowSelf: true,
    requiredRole: [UserRole.ADMIN]
  });
}

/**
 * University-scoped access decorator
 */
export function universityScoped() {
  return AuthMiddleware.withAuth({
    universityScope: true
  });
}

/**
 * Combined authentication decorator with multiple options
 */
export function authenticate(options: AuthOptions) {
  return AuthMiddleware.withAuth(options);
}

// Validation schemas for common auth operations
export const AuthValidationSchemas = {
  UserIdSchema: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),

  CourseAccessSchema: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    action: z.enum(['read', 'update', 'delete', 'enroll']).optional().default('read')
  }),

  UniversityContextSchema: z.object({
    universityId: z.string().min(1, 'University ID is required'),
    userId: z.string().optional(),
    courseId: z.string().optional()
  }),

  RoleChangeSchema: z.object({
    targetUserId: z.string().min(1, 'Target user ID is required'),
    newRole: z.nativeEnum(UserRole),
    universityId: z.string().optional(),
    departmentId: z.string().optional()
  })
};

/**
 * Helper function to check if user can access resource
 */
export async function canUserAccess(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  try {
    const userContext = await RoleManager.getUserContext(userId);
    if (!userContext) return false;

    // Basic permission check
    if (!RoleManager.hasPermission(userContext.role, resource, action)) {
      return false;
    }

    // Additional resource-specific checks can be added here
    if (resource === 'courses' && resourceId) {
      return await RoleManager.canAccessCourse(userId, resourceId, action as any);
    }

    return true;
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/**
 * Helper function to get user permissions
 */
export async function getUserPermissions(userId: string): Promise<{
  role: UserRole;
  permissions: Array<{ resource: string; actions: string[] }>;
  context: UserContext | null;
}> {
  try {
    const userContext = await RoleManager.getUserContext(userId);
    if (!userContext) {
      return {
        role: UserRole.STUDENT,
        permissions: [],
        context: null
      };
    }

    const permissions = RoleManager.getRolePermissions(userContext.role);
    
    return {
      role: userContext.role,
      permissions,
      context: userContext
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      role: UserRole.STUDENT,
      permissions: [],
      context: null
    };
  }
}