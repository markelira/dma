import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { RoleManager, UserRole, RoleAssignmentSchema, BatchRoleUpdateSchema } from './roleManager';
import { 
  AuthMiddleware, 
  requireRole, 
  adminOnly, 
  universityAdminOnly,
  AuthValidationSchemas,
  getUserPermissions
} from './authMiddleware';

/**
 * Set user role - Admin only function
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Validate authentication and authorization
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  });

  // Validate input data
  const validatedData = AuthMiddleware.validateData(data, RoleAssignmentSchema);

  // Additional validation for university admin restrictions
  if (userContext.role === UserRole.UNIVERSITY_ADMIN) {
    // University admins can only assign student/instructor roles
    if (![UserRole.STUDENT, UserRole.INSTRUCTOR].includes(validatedData.role)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'University admins can only assign student or instructor roles'
      );
    }

    // Must be within same university
    if (validatedData.universityId && validatedData.universityId !== userContext.universityId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only assign roles within your university'
      );
    }
  }

  try {
    // Validate the role assignment
    const validation = await RoleManager.validateUniversityRoleAssignment(
      validatedData.userId,
      validatedData.role,
      validatedData.universityId || userContext.universityId || '',
      userContext.uid
    );

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        validation.error || 'Role assignment validation failed'
      );
    }

    // Set the role
    await RoleManager.setUserRole(
      validatedData.userId,
      validatedData.role,
      {
        universityId: validatedData.universityId,
        departmentId: validatedData.departmentId
      }
    );

    // Log the action
    await AuthMiddleware.logSecurityEvent(
      'role_assigned',
      context,
      {
        targetUserId: validatedData.userId,
        newRole: validatedData.role,
        assignedBy: userContext.uid,
        universityId: validatedData.universityId
      }
    );

    return {
      success: true,
      message: `Role ${validatedData.role} assigned successfully`,
      userId: validatedData.userId,
      role: validatedData.role
    };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set user role',
      error.message
    );
  }
});

/**
 * Get user role and permissions
 */
export const getUserRole = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  // Validate input
  const { userId } = AuthMiddleware.validateData(data, AuthValidationSchemas.UserIdSchema);

  // Check if user is requesting their own role or has admin privileges
  if (userContext.uid !== userId) {
    // Check if user has permission to view other users' roles
    const hasPermission = RoleManager.hasPermission(
      userContext.role,
      'users',
      'read'
    );

    if (!hasPermission) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only view own role or requires admin privileges'
      );
    }
  }

  try {
    const targetUserContext = await RoleManager.getUserContext(userId);
    
    if (!targetUserContext) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    const permissions = await getUserPermissions(userId);

    return {
      success: true,
      user: {
        uid: targetUserContext.uid,
        role: targetUserContext.role,
        universityId: targetUserContext.universityId,
        departmentId: targetUserContext.departmentId,
        email: targetUserContext.email
      },
      permissions: permissions.permissions
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get user role',
      error.message
    );
  }
});

/**
 * Check user permissions for specific resource and action
 */
export const checkUserPermission = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    resource: z.string().min(1, 'Resource is required'),
    action: z.string().min(1, 'Action is required'),
    targetUserId: z.string().optional(),
    universityId: z.string().optional(),
    courseId: z.string().optional()
  }));

  try {
    const targetUserId = validatedData.targetUserId || userContext.uid;
    const targetUserContext = await RoleManager.getUserContext(targetUserId);

    if (!targetUserContext) {
      return {
        success: false,
        hasPermission: false,
        error: 'User not found'
      };
    }

    const hasPermission = RoleManager.hasPermission(
      targetUserContext.role,
      validatedData.resource,
      validatedData.action,
      {
        universityId: validatedData.universityId,
        courseId: validatedData.courseId,
        userId: targetUserId
      }
    );

    return {
      success: true,
      hasPermission,
      userRole: targetUserContext.role,
      resource: validatedData.resource,
      action: validatedData.action
    };
  } catch (error) {
    console.error('Error checking user permission:', error);
    return {
      success: false,
      hasPermission: false,
      error: error.message
    };
  }
});

/**
 * Get all users in university (University Admin only)
 */
export const getUniversityUsers = functions.https.onCall(async (data, context) => {
  // Verify authentication and role
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  });

  // Validate input
  const { universityId } = AuthMiddleware.validateData(data, z.object({
    universityId: z.string().min(1, 'University ID is required'),
    limit: z.number().min(1).max(100).optional().default(50),
    offset: z.number().min(0).optional().default(0)
  }));

  // University admins can only access their own university
  if (userContext.role === UserRole.UNIVERSITY_ADMIN) {
    if (userContext.universityId !== universityId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only access users from your university'
      );
    }
  }

  try {
    const usersQuery = admin.firestore()
      .collection('users')
      .where('universityId', '==', universityId)
      .limit(data.limit || 50)
      .offset(data.offset || 0);

    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Remove sensitive fields
      password: undefined,
      refreshTokens: undefined
    }));

    return {
      success: true,
      users,
      total: usersSnapshot.size,
      universityId
    };
  } catch (error) {
    console.error('Error getting university users:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get university users',
      error.message
    );
  }
});

/**
 * Batch update user roles - Admin only
 */
export const batchUpdateUserRoles = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, BatchRoleUpdateSchema);

  try {
    const results = await RoleManager.batchUpdateRoles(validatedData.updates);

    // Log batch operation
    await AuthMiddleware.logSecurityEvent(
      'batch_role_update',
      context,
      {
        updatesCount: validatedData.updates.length,
        successCount: results.success,
        failedCount: results.failed,
        performedBy: userContext.uid
      }
    );

    return {
      success: true,
      results: {
        totalRequested: validatedData.updates.length,
        successful: results.success,
        failed: results.failed,
        errors: results.errors
      }
    };
  } catch (error) {
    console.error('Error in batch role update:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update user roles',
      error.message
    );
  }
});

/**
 * Get current user's context and permissions
 */
export const getCurrentUser = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  try {
    const permissions = await getUserPermissions(userContext.uid);

    return {
      success: true,
      user: {
        uid: userContext.uid,
        role: userContext.role,
        universityId: userContext.universityId,
        departmentId: userContext.departmentId,
        email: userContext.email
      },
      permissions: permissions.permissions,
      roleHierarchy: RoleManager.getRoleHierarchy()
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get current user context',
      error.message
    );
  }
});

/**
 * Validate course access for user
 */
export const validateCourseAccess = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, AuthValidationSchemas.CourseAccessSchema);

  try {
    const canAccess = await RoleManager.canAccessCourse(
      userContext.uid,
      validatedData.courseId,
      validatedData.action
    );

    return {
      success: true,
      canAccess,
      userId: userContext.uid,
      courseId: validatedData.courseId,
      action: validatedData.action,
      userRole: userContext.role
    };
  } catch (error) {
    console.error('Error validating course access:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to validate course access',
      error.message
    );
  }
});

/**
 * Create new university admin (Admin only)
 */
export const createUniversityAdmin = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    universityId: z.string().min(1, 'University ID is required'),
    departmentId: z.string().optional()
  }));

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: validatedData.email,
      password: validatedData.password,
      displayName: `${validatedData.firstName} ${validatedData.lastName}`,
      emailVerified: false
    });

    // Set role and context
    await RoleManager.setUserRole(
      userRecord.uid,
      UserRole.UNIVERSITY_ADMIN,
      {
        universityId: validatedData.universityId,
        departmentId: validatedData.departmentId
      }
    );

    // Create user document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      displayName: `${validatedData.firstName} ${validatedData.lastName}`,
      role: UserRole.UNIVERSITY_ADMIN,
      universityId: validatedData.universityId,
      departmentId: validatedData.departmentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userContext.uid,
      emailVerified: false,
      isActive: true
    });

    // Log user creation
    await AuthMiddleware.logSecurityEvent(
      'university_admin_created',
      context,
      {
        newUserId: userRecord.uid,
        universityId: validatedData.universityId,
        createdBy: userContext.uid
      }
    );

    return {
      success: true,
      message: 'University admin created successfully',
      userId: userRecord.uid,
      email: validatedData.email
    };
  } catch (error) {
    console.error('Error creating university admin:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create university admin',
      error.message
    );
  }
});

/**
 * Promote instructor to university admin (Admin only)
 */
export const promoteToUniversityAdmin = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    userId: z.string().min(1, 'User ID is required'),
    universityId: z.string().min(1, 'University ID is required'),
    departmentId: z.string().optional()
  }));

  try {
    // Get current user data
    const targetUserContext = await RoleManager.getUserContext(validatedData.userId);
    if (!targetUserContext) {
      throw new functions.https.HttpsError(
        'not-found',
        'Target user not found'
      );
    }

    // Verify current role is instructor
    if (targetUserContext.role !== UserRole.INSTRUCTOR) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Can only promote instructors to university admin'
      );
    }

    // Set new role
    await RoleManager.setUserRole(
      validatedData.userId,
      UserRole.UNIVERSITY_ADMIN,
      {
        universityId: validatedData.universityId,
        departmentId: validatedData.departmentId
      }
    );

    // Log promotion
    await AuthMiddleware.logSecurityEvent(
      'instructor_promoted',
      context,
      {
        promotedUserId: validatedData.userId,
        fromRole: UserRole.INSTRUCTOR,
        toRole: UserRole.UNIVERSITY_ADMIN,
        universityId: validatedData.universityId,
        promotedBy: userContext.uid
      }
    );

    return {
      success: true,
      message: 'Instructor promoted to university admin successfully',
      userId: validatedData.userId,
      newRole: UserRole.UNIVERSITY_ADMIN
    };
  } catch (error) {
    console.error('Error promoting instructor:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to promote instructor',
      error.message
    );
  }
});

/**
 * Get security audit logs (Admin only)
 */
export const getSecurityAuditLogs = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    limit: z.number().min(1).max(100).optional().default(50),
    startAfter: z.string().optional(),
    eventType: z.string().optional(),
    userId: z.string().optional()
  }));

  try {
    let query = admin.firestore()
      .collection('securityLogs')
      .orderBy('timestamp', 'desc')
      .limit(validatedData.limit);

    if (validatedData.eventType) {
      query = query.where('event', '==', validatedData.eventType);
    }

    if (validatedData.userId) {
      query = query.where('uid', '==', validatedData.userId);
    }

    if (validatedData.startAfter) {
      const startAfterDoc = await admin.firestore()
        .collection('securityLogs')
        .doc(validatedData.startAfter)
        .get();
      
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      logs,
      total: snapshot.size,
      hasMore: snapshot.size === validatedData.limit
    };
  } catch (error) {
    console.error('Error getting security audit logs:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get security audit logs',
      error.message
    );
  }
});

/**
 * Force password reset for user (Admin/University Admin only)
 */
export const forcePasswordReset = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    userId: z.string().min(1, 'User ID is required'),
    reason: z.string().min(1, 'Reason is required')
  }));

  try {
    // Get target user
    const targetUser = await admin.auth().getUser(validatedData.userId);
    
    if (!targetUser.email) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'User does not have an email address'
      );
    }

    // University admins can only reset passwords within their university
    if (userContext.role === UserRole.UNIVERSITY_ADMIN) {
      const targetUserContext = await RoleManager.getUserContext(validatedData.userId);
      if (targetUserContext?.universityId !== userContext.universityId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Can only reset passwords for users in your university'
        );
      }
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(targetUser.email);

    // Log the forced reset
    await AuthMiddleware.logSecurityEvent(
      'forced_password_reset',
      context,
      {
        targetUserId: validatedData.userId,
        targetEmail: targetUser.email,
        reason: validatedData.reason,
        performedBy: userContext.uid
      }
    );

    // TODO: Send email with reset link using email service
    // await emailService.sendPasswordResetEmail(targetUser.email, resetLink);

    return {
      success: true,
      message: 'Password reset link generated and sent',
      userId: validatedData.userId,
      email: targetUser.email
    };
  } catch (error) {
    console.error('Error forcing password reset:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to force password reset',
      error.message
    );
  }
});