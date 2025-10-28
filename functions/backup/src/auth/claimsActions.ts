import * as functions from 'firebase-functions';
import { z } from 'zod';
import { 
  ClaimsManager, 
  ClaimsUpdateSchema, 
  BatchClaimsUpdateSchema, 
  ClaimsValidationSchema,
  ClaimsRemovalSchema 
} from './claimsManager';
import { UserRole } from './roleManager';
import { AuthMiddleware, requireRole, adminOnly } from './authMiddleware';

/**
 * Update custom claims for a user (Admin only)
 */
export const updateCustomClaims = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  });

  // Validate input data
  const validatedData = AuthMiddleware.validateData(data, ClaimsUpdateSchema);

  try {
    // Additional validation for university admin restrictions
    if (userContext.role === UserRole.UNIVERSITY_ADMIN) {
      // University admins can only update claims within their university
      if (validatedData.claims.universityId && 
          validatedData.claims.universityId !== userContext.universityId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Can only update claims within your university'
        );
      }

      // University admins cannot assign admin roles
      if (validatedData.claims.role && 
          [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN].includes(validatedData.claims.role)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Cannot assign admin roles'
        );
      }
    }

    await ClaimsManager.setCustomClaims(
      validatedData.userId,
      validatedData.claims,
      userContext.uid
    );

    // Log the action
    await AuthMiddleware.logSecurityEvent(
      'claims_updated',
      context,
      {
        targetUserId: validatedData.userId,
        updatedClaims: validatedData.claims,
        updatedBy: userContext.uid
      }
    );

    return {
      success: true,
      message: 'Custom claims updated successfully',
      userId: validatedData.userId,
      claims: validatedData.claims
    };
  } catch (error) {
    console.error('Error updating custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update custom claims',
      error.message
    );
  }
});

/**
 * Get custom claims for a user
 */
export const getCustomClaims = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  // Validate input
  const { userId } = AuthMiddleware.validateData(data, ClaimsValidationSchema);

  // Check if user is requesting their own claims or has admin privileges
  if (userContext.uid !== userId) {
    const hasPermission = userContext.role === UserRole.ADMIN || 
                         userContext.role === UserRole.UNIVERSITY_ADMIN;
    
    if (!hasPermission) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only view own claims or requires admin privileges'
      );
    }
  }

  try {
    const claims = await ClaimsManager.getCustomClaims(userId);
    
    return {
      success: true,
      userId,
      claims: claims || {},
      hasCustomClaims: !!claims
    };
  } catch (error) {
    console.error('Error getting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get custom claims',
      error.message
    );
  }
});

/**
 * Refresh user's custom claims (Admin or self)
 */
export const refreshCustomClaims = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  // Validate input
  const { userId } = AuthMiddleware.validateData(data, ClaimsValidationSchema);

  // Check if user is refreshing their own claims or has admin privileges
  if (userContext.uid !== userId) {
    const hasPermission = userContext.role === UserRole.ADMIN || 
                         userContext.role === UserRole.UNIVERSITY_ADMIN;
    
    if (!hasPermission) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only refresh own claims or requires admin privileges'
      );
    }
  }

  try {
    const refreshedClaims = await ClaimsManager.refreshUserClaims(userId);

    // Log the action
    await AuthMiddleware.logSecurityEvent(
      'claims_refreshed',
      context,
      {
        targetUserId: userId,
        refreshedBy: userContext.uid
      }
    );

    return {
      success: true,
      message: 'Custom claims refreshed successfully',
      userId,
      claims: refreshedClaims
    };
  } catch (error) {
    console.error('Error refreshing custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to refresh custom claims',
      error.message
    );
  }
});

/**
 * Remove specific custom claims (Admin only)
 */
export const removeCustomClaims = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input data
  const validatedData = AuthMiddleware.validateData(data, ClaimsRemovalSchema);

  try {
    await ClaimsManager.removeCustomClaims(
      validatedData.userId,
      validatedData.claimsToRemove,
      userContext.uid
    );

    // Log the action
    await AuthMiddleware.logSecurityEvent(
      'claims_removed',
      context,
      {
        targetUserId: validatedData.userId,
        removedClaims: validatedData.claimsToRemove,
        removedBy: userContext.uid
      }
    );

    return {
      success: true,
      message: 'Custom claims removed successfully',
      userId: validatedData.userId,
      removedClaims: validatedData.claimsToRemove
    };
  } catch (error) {
    console.error('Error removing custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to remove custom claims',
      error.message
    );
  }
});

/**
 * Batch update custom claims for multiple users (Admin only)
 */
export const batchUpdateCustomClaims = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input data
  const validatedData = AuthMiddleware.validateData(data, BatchClaimsUpdateSchema);

  try {
    const results = await ClaimsManager.batchUpdateClaims(
      validatedData.updates.map(update => ({
        userId: update.userId,
        claims: update.claims
      })),
      userContext.uid
    );

    // Log batch operation
    await AuthMiddleware.logSecurityEvent(
      'batch_claims_update',
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
    console.error('Error in batch claims update:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update custom claims',
      error.message
    );
  }
});

/**
 * Validate claims consistency for a user
 */
export const validateClaimsConsistency = functions.https.onCall(async (data, context) => {
  // Verify authentication
  const userContext = await AuthMiddleware.verifyAuth(context);

  // Validate input
  const { userId } = AuthMiddleware.validateData(data, ClaimsValidationSchema);

  // Check if user is validating their own claims or has admin privileges
  if (userContext.uid !== userId) {
    const hasPermission = userContext.role === UserRole.ADMIN || 
                         userContext.role === UserRole.UNIVERSITY_ADMIN;
    
    if (!hasPermission) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only validate own claims or requires admin privileges'
      );
    }
  }

  try {
    const validation = await ClaimsManager.validateClaimsConsistency(userId);

    return {
      success: true,
      userId,
      validation: {
        consistent: validation.consistent,
        issues: validation.issues,
        recommendations: validation.recommendations
      }
    };
  } catch (error) {
    console.error('Error validating claims consistency:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to validate claims consistency',
      error.message
    );
  }
});

/**
 * Get claims audit log for a user (Admin only)
 */
export const getClaimsAuditLog = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    userId: z.string().min(1, 'User ID is required'),
    limit: z.number().min(1).max(100).optional().default(50)
  }));

  try {
    const auditLog = await ClaimsManager.getClaimsAuditLog(
      validatedData.userId,
      validatedData.limit
    );

    return {
      success: true,
      userId: validatedData.userId,
      auditLog,
      total: auditLog.length
    };
  } catch (error) {
    console.error('Error getting claims audit log:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get claims audit log',
      error.message
    );
  }
});

/**
 * Clean up expired claims (Admin maintenance function)
 */
export const cleanupExpiredClaims = functions.https.onCall(async (data, context) => {
  // Verify admin access
  const userContext = await AuthMiddleware.checkAuth(context, {
    requiredRole: UserRole.ADMIN
  });

  // Validate input
  const validatedData = AuthMiddleware.validateData(data, z.object({
    maxAgeHours: z.number().min(1).max(24 * 30).optional().default(24 * 7)
  }));

  try {
    const results = await ClaimsManager.cleanupExpiredClaims(validatedData.maxAgeHours);

    // Log maintenance operation
    await AuthMiddleware.logSecurityEvent(
      'claims_cleanup',
      context,
      {
        ...results,
        maxAgeHours: validatedData.maxAgeHours,
        performedBy: userContext.uid
      }
    );

    return {
      success: true,
      message: 'Claims cleanup completed',
      results
    };
  } catch (error) {
    console.error('Error during claims cleanup:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to cleanup expired claims',
      error.message
    );
  }
});

/**
 * Scheduled function to automatically clean up stale claims
 */
export const scheduledClaimsCleanup = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled claims cleanup...');
      
      const results = await ClaimsManager.cleanupExpiredClaims(24 * 7); // 1 week
      
      console.log('Scheduled claims cleanup completed:', results);
      
      // Log maintenance operation
      await AuthMiddleware.logSecurityEvent(
        'scheduled_claims_cleanup',
        { auth: null, rawRequest: {} } as any,
        {
          ...results,
          scheduledExecution: true
        }
      );
      
      return results;
    } catch (error) {
      console.error('Error in scheduled claims cleanup:', error);
      throw error;
    }
  });