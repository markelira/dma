import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { z } from 'zod';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  UNIVERSITY_ADMIN = 'university_admin'
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface UserContext {
  uid: string;
  role: UserRole;
  universityId?: string;
  departmentId?: string;
  email?: string;
}

export class RoleManager {
  private static permissions: Record<UserRole, Permission[]> = {
    [UserRole.STUDENT]: [
      { resource: 'courses', actions: ['read', 'enroll'] },
      { resource: 'lessons', actions: ['read'] },
      { resource: 'quizzes', actions: ['read', 'submit'] },
      { resource: 'profile', actions: ['read', 'update'] },
      { resource: 'certificates', actions: ['read'] },
      { resource: 'progress', actions: ['read', 'update'] },
      { resource: 'enrollments', actions: ['read', 'create'] },
      { resource: 'reviews', actions: ['read', 'create'] },
      { resource: 'wishlist', actions: ['read', 'create', 'delete'] }
    ],
    [UserRole.INSTRUCTOR]: [
      { resource: 'courses', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'lessons', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'quizzes', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'students', actions: ['read'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'profile', actions: ['read', 'update'] },
      { resource: 'enrollments', actions: ['read'] },
      { resource: 'progress', actions: ['read'] },
      { resource: 'certificates', actions: ['read', 'create'] },
      { resource: 'reviews', actions: ['read'] },
      { resource: 'modules', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'objectives', actions: ['read', 'create', 'update', 'delete'] }
    ],
    [UserRole.ADMIN]: [
      { resource: '*', actions: ['*'] } // Full access to everything
    ],
    [UserRole.UNIVERSITY_ADMIN]: [
      { resource: 'university', actions: ['read', 'update'] },
      { resource: 'departments', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'instructors', actions: ['read', 'create', 'update'] },
      { resource: 'courses', actions: ['read', 'approve', 'update'] },
      { resource: 'students', actions: ['read', 'create', 'update'] },
      { resource: 'reports', actions: ['read', 'create'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'enrollments', actions: ['read', 'create', 'update'] },
      { resource: 'certificates', actions: ['read'] },
      { resource: 'categories', actions: ['read', 'create', 'update'] },
      { resource: 'profile', actions: ['read', 'update'] }
    ]
  };

  /**
   * Check if user has permission for specific action on resource
   */
  static hasPermission(
    userRole: UserRole,
    resource: string,
    action: string,
    context?: { universityId?: string; courseId?: string; userId?: string }
  ): boolean {
    const rolePermissions = this.permissions[userRole];
    
    if (!rolePermissions) return false;
    
    // Check for explicit permission
    const hasExplicitPermission = rolePermissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });

    if (hasExplicitPermission) {
      // Additional context-based checks for university admins
      if (userRole === UserRole.UNIVERSITY_ADMIN && context?.universityId) {
        // University admins can only access resources within their university
        return this.isWithinUniversityScope(context);
      }
      return true;
    }

    return false;
  }

  /**
   * Check if action is within university scope for university admins
   */
  private static isWithinUniversityScope(context: { universityId?: string; courseId?: string; userId?: string }): boolean {
    // This would be enhanced with actual university context validation
    // For now, we assume the context is valid if universityId is provided
    return !!context.universityId;
  }

  /**
   * Set user role with custom claims and database update
   */
  static async setUserRole(
    userId: string,
    role: UserRole,
    additionalClaims?: { universityId?: string; departmentId?: string }
  ): Promise<void> {
    try {
      // Prepare custom claims
      const customClaims: any = { role };
      if (additionalClaims?.universityId) {
        customClaims.universityId = additionalClaims.universityId;
      }
      if (additionalClaims?.departmentId) {
        customClaims.departmentId = additionalClaims.departmentId;
      }

      // Set custom claims in Firebase Auth
      await admin.auth().setCustomUserClaims(userId, customClaims);
      
      // Update user document in Firestore
      const updateData: any = {
        role,
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        roleUpdatedBy: 'system' // This should be replaced with actual admin user ID
      };

      if (additionalClaims?.universityId) {
        updateData.universityId = additionalClaims.universityId;
      }
      if (additionalClaims?.departmentId) {
        updateData.departmentId = additionalClaims.departmentId;
      }

      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update(updateData);
      
      console.log(`Role ${role} set for user ${userId}`);
      
      // Log role change for audit trail
      await this.logRoleChange(userId, role, additionalClaims);
      
    } catch (error) {
      console.error('Error setting user role:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to set user role',
        error
      );
    }
  }

  /**
   * Get user role from claims or database with fallback
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      // First check custom claims (faster)
      const user = await admin.auth().getUser(userId);
      if (user.customClaims?.role) {
        return user.customClaims.role as UserRole;
      }
      
      // Fallback to database lookup
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData?.role || UserRole.STUDENT;
      }
      
      // Default to student if no role found
      return UserRole.STUDENT;
      
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get full user context including role and organizational info
   */
  static async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      const [user, userDoc] = await Promise.all([
        admin.auth().getUser(userId),
        admin.firestore().collection('users').doc(userId).get()
      ]);

      const userData = userDoc.exists ? userDoc.data() : {};
      const role = user.customClaims?.role || userData?.role || UserRole.STUDENT;

      return {
        uid: userId,
        role: role as UserRole,
        universityId: user.customClaims?.universityId || userData?.universityId,
        departmentId: user.customClaims?.departmentId || userData?.departmentId,
        email: user.email
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Validate if requestor can change target user's role
   */
  static canChangeRole(
    requestorRole: UserRole,
    targetRole: UserRole,
    context?: { 
      requestorUniversityId?: string; 
      targetUniversityId?: string;
      isSameUniversity?: boolean;
    }
  ): boolean {
    // Super admin can change any role
    if (requestorRole === UserRole.ADMIN) {
      return true;
    }
    
    // University admins have limited role change permissions
    if (requestorRole === UserRole.UNIVERSITY_ADMIN) {
      // Can only assign student or instructor roles
      const allowedTargetRoles = [UserRole.STUDENT, UserRole.INSTRUCTOR];
      if (!allowedTargetRoles.includes(targetRole)) {
        return false;
      }
      
      // Must be within the same university
      if (context?.requestorUniversityId && context?.targetUniversityId) {
        return context.requestorUniversityId === context.targetUniversityId;
      }
      
      return context?.isSameUniversity || false;
    }
    
    // Instructors and students cannot change roles
    return false;
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return this.permissions[role] || [];
  }

  /**
   * Check if user can access specific course
   */
  static async canAccessCourse(
    userId: string,
    courseId: string,
    action: 'read' | 'update' | 'delete' | 'enroll' = 'read'
  ): Promise<boolean> {
    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) return false;

      // Check basic permission
      if (!this.hasPermission(userContext.role, 'courses', action)) {
        return false;
      }

      // Additional checks for specific actions
      if (action === 'update' || action === 'delete') {
        // Only course creator, instructors, or admins can modify
        const courseDoc = await admin.firestore()
          .collection('courses')
          .doc(courseId)
          .get();
        
        if (!courseDoc.exists) return false;
        
        const courseData = courseDoc.data();
        
        // Course creator can always modify
        if (courseData?.instructorId === userId) return true;
        
        // Admins can always modify
        if (userContext.role === UserRole.ADMIN) return true;
        
        // University admins can modify courses in their university
        if (userContext.role === UserRole.UNIVERSITY_ADMIN) {
          return courseData?.universityId === userContext.universityId;
        }
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking course access:', error);
      return false;
    }
  }

  /**
   * Log role changes for audit trail
   */
  private static async logRoleChange(
    userId: string,
    newRole: UserRole,
    additionalClaims?: { universityId?: string; departmentId?: string }
  ): Promise<void> {
    try {
      await admin.firestore().collection('auditLogs').add({
        action: 'role_change',
        targetUserId: userId,
        newRole,
        additionalClaims,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        performedBy: 'system', // Should be replaced with actual admin user ID
        type: 'security'
      });
    } catch (error) {
      console.error('Error logging role change:', error);
      // Don't throw error for logging failure
    }
  }

  /**
   * Validate role hierarchy for permission inheritance
   */
  static getRoleHierarchy(): Record<UserRole, number> {
    return {
      [UserRole.STUDENT]: 1,
      [UserRole.INSTRUCTOR]: 2,
      [UserRole.UNIVERSITY_ADMIN]: 3,
      [UserRole.ADMIN]: 4
    };
  }

  /**
   * Check if one role has higher privilege than another
   */
  static hasHigherPrivilege(role1: UserRole, role2: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[role1] > hierarchy[role2];
  }

  /**
   * Batch update user roles (for admin operations)
   */
  static async batchUpdateRoles(
    updates: Array<{
      userId: string;
      role: UserRole;
      universityId?: string;
      departmentId?: string;
    }>
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = { success: 0, failed: 0, errors: [] as any[] };
    
    for (const update of updates) {
      try {
        await this.setUserRole(update.userId, update.role, {
          universityId: update.universityId,
          departmentId: update.departmentId
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: update.userId,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Validate role assignment based on university context
   */
  static async validateUniversityRoleAssignment(
    targetUserId: string,
    role: UserRole,
    universityId: string,
    requestorUserId: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Get requestor context
      const requestorContext = await this.getUserContext(requestorUserId);
      if (!requestorContext) {
        return { valid: false, error: 'Requestor not found' };
      }

      // Check if requestor can assign roles
      if (!this.canChangeRole(requestorContext.role, role)) {
        return { valid: false, error: 'Insufficient permissions to assign this role' };
      }

      // For university admin requests, validate university scope
      if (requestorContext.role === UserRole.UNIVERSITY_ADMIN) {
        if (requestorContext.universityId !== universityId) {
          return { valid: false, error: 'Cannot assign roles outside your university' };
        }
      }

      // Check if target user exists
      const targetUser = await admin.auth().getUser(targetUserId);
      if (!targetUser) {
        return { valid: false, error: 'Target user not found' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// Validation schemas for role operations
export const RoleAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.nativeEnum(UserRole),
  universityId: z.string().optional(),
  departmentId: z.string().optional()
});

export const PermissionCheckSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  context: z.object({
    universityId: z.string().optional(),
    courseId: z.string().optional(),
    userId: z.string().optional()
  }).optional()
});

export const BatchRoleUpdateSchema = z.object({
  updates: z.array(RoleAssignmentSchema)
});

// Helper functions for common role checks
export const isAdmin = (role: UserRole): boolean => role === UserRole.ADMIN;
export const isUniversityAdmin = (role: UserRole): boolean => role === UserRole.UNIVERSITY_ADMIN;
export const isInstructor = (role: UserRole): boolean => role === UserRole.INSTRUCTOR;
export const isStudent = (role: UserRole): boolean => role === UserRole.STUDENT;

export const hasAdminPrivileges = (role: UserRole): boolean => 
  role === UserRole.ADMIN || role === UserRole.UNIVERSITY_ADMIN;

export const canCreateCourses = (role: UserRole): boolean =>
  role === UserRole.ADMIN || role === UserRole.INSTRUCTOR;

export const canManageUsers = (role: UserRole): boolean =>
  role === UserRole.ADMIN || role === UserRole.UNIVERSITY_ADMIN;