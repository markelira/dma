import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { UserRole, RoleManager } from './roleManager';
import { AuthMiddleware } from './authMiddleware';

export interface CustomClaims {
  role: UserRole;
  universityId?: string;
  departmentId?: string;
  permissions?: string[];
  lastUpdated?: number;
}

export class ClaimsManager {
  /**
   * Set custom claims for a user
   */
  static async setCustomClaims(
    userId: string,
    claims: Partial<CustomClaims>,
    requestorUserId?: string
  ): Promise<void> {
    try {
      // Get current user data
      const user = await admin.auth().getUser(userId);
      const currentClaims = user.customClaims || {};

      // Merge with new claims
      const updatedClaims: CustomClaims = {
        ...currentClaims,
        ...claims,
        lastUpdated: Date.now()
      };

      // Add role-based permissions if role is being updated
      if (claims.role) {
        const rolePermissions = RoleManager.getRolePermissions(claims.role);
        updatedClaims.permissions = rolePermissions.map(p => `${p.resource}:${p.actions.join(',')}`);
      }

      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, updatedClaims);

      // Update user document in Firestore
      await admin.firestore().collection('users').doc(userId).update({
        customClaims: updatedClaims,
        claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimsUpdatedBy: requestorUserId || 'system'
      });

      // Log claims update
      await this.logClaimsUpdate(userId, updatedClaims, requestorUserId);

      console.log(`Custom claims updated for user ${userId}:`, updatedClaims);
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to set custom claims',
        error.message
      );
    }
  }

  /**
   * Get custom claims for a user
   */
  static async getCustomClaims(userId: string): Promise<CustomClaims | null> {
    try {
      const user = await admin.auth().getUser(userId);
      return user.customClaims as CustomClaims || null;
    } catch (error) {
      console.error('Error getting custom claims:', error);
      return null;
    }
  }

  /**
   * Remove custom claims for a user
   */
  static async removeCustomClaims(
    userId: string,
    claimsToRemove: (keyof CustomClaims)[],
    requestorUserId?: string
  ): Promise<void> {
    try {
      const user = await admin.auth().getUser(userId);
      const currentClaims = { ...user.customClaims } as CustomClaims;

      // Remove specified claims
      claimsToRemove.forEach(claim => {
        delete currentClaims[claim];
      });

      // Update timestamp
      currentClaims.lastUpdated = Date.now();

      // Set updated claims
      await admin.auth().setCustomUserClaims(userId, currentClaims);

      // Update user document
      await admin.firestore().collection('users').doc(userId).update({
        customClaims: currentClaims,
        claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimsUpdatedBy: requestorUserId || 'system'
      });

      // Log claims removal
      await this.logClaimsUpdate(userId, currentClaims, requestorUserId, 'claims_removed');

      console.log(`Custom claims removed for user ${userId}:`, claimsToRemove);
    } catch (error) {
      console.error('Error removing custom claims:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to remove custom claims',
        error.message
      );
    }
  }

  /**
   * Refresh user's custom claims based on current database state
   */
  static async refreshUserClaims(userId: string): Promise<CustomClaims> {
    try {
      // Get current user context from database
      const userContext = await RoleManager.getUserContext(userId);
      if (!userContext) {
        throw new functions.https.HttpsError(
          'not-found',
          'User context not found'
        );
      }

      // Build fresh claims
      const freshClaims: CustomClaims = {
        role: userContext.role,
        universityId: userContext.universityId,
        departmentId: userContext.departmentId,
        lastUpdated: Date.now()
      };

      // Add role-based permissions
      const rolePermissions = RoleManager.getRolePermissions(userContext.role);
      freshClaims.permissions = rolePermissions.map(p => `${p.resource}:${p.actions.join(',')}`);

      // Set refreshed claims
      await admin.auth().setCustomUserClaims(userId, freshClaims);

      // Update user document
      await admin.firestore().collection('users').doc(userId).update({
        customClaims: freshClaims,
        claimsRefreshedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return freshClaims;
    } catch (error) {
      console.error('Error refreshing user claims:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to refresh user claims',
        error.message
      );
    }
  }

  /**
   * Batch update custom claims for multiple users
   */
  static async batchUpdateClaims(
    updates: Array<{
      userId: string;
      claims: Partial<CustomClaims>;
    }>,
    requestorUserId?: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const update of updates) {
      try {
        await this.setCustomClaims(update.userId, update.claims, requestorUserId);
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
   * Validate custom claims consistency
   */
  static async validateClaimsConsistency(userId: string): Promise<{
    consistent: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const [authUser, firestoreUser] = await Promise.all([
        admin.auth().getUser(userId),
        admin.firestore().collection('users').doc(userId).get()
      ]);

      const authClaims = authUser.customClaims as CustomClaims;
      const firestoreData = firestoreUser.data();
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!authClaims) {
        issues.push('No custom claims found in Firebase Auth');
        recommendations.push('Set initial custom claims');
      }

      if (!firestoreData) {
        issues.push('No user document found in Firestore');
        recommendations.push('Create user document');
      }

      if (authClaims && firestoreData) {
        // Check role consistency
        if (authClaims.role !== firestoreData.role) {
          issues.push(`Role mismatch: Auth(${authClaims.role}) vs Firestore(${firestoreData.role})`);
          recommendations.push('Sync role between Auth and Firestore');
        }

        // Check university consistency
        if (authClaims.universityId !== firestoreData.universityId) {
          issues.push('University ID mismatch between Auth and Firestore');
          recommendations.push('Sync university ID');
        }

        // Check if claims are outdated (older than 24 hours)
        if (authClaims.lastUpdated && (Date.now() - authClaims.lastUpdated) > 24 * 60 * 60 * 1000) {
          issues.push('Custom claims are outdated (>24 hours)');
          recommendations.push('Refresh custom claims');
        }
      }

      return {
        consistent: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error validating claims consistency:', error);
      return {
        consistent: false,
        issues: ['Error validating claims consistency'],
        recommendations: ['Check user existence and permissions']
      };
    }
  }

  /**
   * Log claims updates for audit trail
   */
  private static async logClaimsUpdate(
    userId: string,
    claims: CustomClaims,
    requestorUserId?: string,
    action: string = 'claims_updated'
  ): Promise<void> {
    try {
      await admin.firestore().collection('claimsAuditLog').add({
        action,
        targetUserId: userId,
        claims,
        requestorUserId: requestorUserId || 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'claims_management'
      });
    } catch (error) {
      console.error('Error logging claims update:', error);
      // Don't throw error for logging failure
    }
  }

  /**
   * Get claims audit log for a user
   */
  static async getClaimsAuditLog(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const snapshot = await admin.firestore()
        .collection('claimsAuditLog')
        .where('targetUserId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting claims audit log:', error);
      return [];
    }
  }

  /**
   * Clean up expired claims (maintenance function)
   */
  static async cleanupExpiredClaims(maxAgeHours: number = 24 * 7): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    const results = { processed: 0, updated: 0, errors: 0 };
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    try {
      // Get users with potentially stale claims
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('claimsUpdatedAt', '<', new Date(cutoffTime))
        .limit(100)
        .get();

      for (const userDoc of usersSnapshot.docs) {
        try {
          results.processed++;
          
          const userId = userDoc.id;
          const userData = userDoc.data();
          
          // Check if claims need refresh
          const validation = await this.validateClaimsConsistency(userId);
          
          if (!validation.consistent) {
            await this.refreshUserClaims(userId);
            results.updated++;
          }
        } catch (error) {
          console.error(`Error processing user ${userDoc.id}:`, error);
          results.errors++;
        }
      }

      console.log('Claims cleanup completed:', results);
      return results;
    } catch (error) {
      console.error('Error during claims cleanup:', error);
      throw error;
    }
  }
}

// Validation schemas for claims operations
export const ClaimsUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  claims: z.object({
    role: z.nativeEnum(UserRole).optional(),
    universityId: z.string().optional(),
    departmentId: z.string().optional(),
    permissions: z.array(z.string()).optional()
  })
});

export const BatchClaimsUpdateSchema = z.object({
  updates: z.array(ClaimsUpdateSchema)
});

export const ClaimsValidationSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export const ClaimsRemovalSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  claimsToRemove: z.array(z.enum(['role', 'universityId', 'departmentId', 'permissions']))
});