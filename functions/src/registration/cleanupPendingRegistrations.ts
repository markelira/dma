/**
 * Cleanup Expired Pending Registrations
 *
 * Scheduled function that runs every 24 hours to:
 * 1. Delete expired pending registrations (older than 7 days)
 * 2. Optionally clean up orphan Firebase Auth users
 */
import * as admin from 'firebase-admin';
import { onSchedule, ScheduledEvent } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

const firestore = admin.firestore();
const auth = admin.auth();

/**
 * Cleanup expired pending registrations
 * Runs daily at 3:00 AM Europe/Budapest time
 */
export const cleanupPendingRegistrations = onSchedule({
  schedule: '0 3 * * *', // Every day at 3:00 AM
  timeZone: 'Europe/Budapest',
  region: 'europe-west1',
  memory: '256MiB',
  timeoutSeconds: 120,
}, async (event: ScheduledEvent): Promise<void> => {
  try {
    logger.info('🧹 [CleanupPendingRegistrations] Starting cleanup...');

    const now = admin.firestore.Timestamp.now();
    let deletedCount = 0;
    let orphanAuthDeletedCount = 0;
    let errorCount = 0;

    // Find all expired pending registrations
    const expiredDocs = await firestore
      .collection('pendingRegistrations')
      .where('expiresAt', '<', now)
      .get();

    if (expiredDocs.empty) {
      logger.info('🧹 [CleanupPendingRegistrations] No expired registrations found');
      return;
    }

    logger.info(`🧹 [CleanupPendingRegistrations] Found ${expiredDocs.size} expired registrations`);

    // Process each expired registration
    for (const doc of expiredDocs.docs) {
      try {
        const userId = doc.id;
        const pendingData = doc.data();

        logger.info(`🧹 [CleanupPendingRegistrations] Processing expired registration for user: ${userId}`);

        // Check if user has completed registration (has companyId)
        const userDoc = await firestore.collection('users').doc(userId).get();

        if (userDoc.exists && userDoc.data()?.companyId) {
          // User completed registration - just clean up pending doc
          logger.info(`🧹 [CleanupPendingRegistrations] User ${userId} completed registration, cleaning up pending doc`);
          await doc.ref.delete();
          deletedCount++;
        } else {
          // User didn't complete registration - optionally delete Firebase Auth user
          // WARNING: This is destructive! Comment out if you want to keep orphan auth users

          // Check if user has any activity (enrollments, progress, etc.)
          const hasActivity = await checkUserHasActivity(userId);

          if (!hasActivity) {
            // No activity - safe to delete auth user
            try {
              // First delete the pending registration
              await doc.ref.delete();
              deletedCount++;

              // Then try to delete the auth user
              await auth.deleteUser(userId);
              orphanAuthDeletedCount++;
              logger.info(`🧹 [CleanupPendingRegistrations] Deleted orphan auth user: ${userId}`);
            } catch (authError: any) {
              if (authError.code !== 'auth/user-not-found') {
                logger.warn(`⚠️ [CleanupPendingRegistrations] Could not delete auth user ${userId}:`, authError.message);
              }
            }
          } else {
            // User has some activity - just delete pending doc, keep auth
            await doc.ref.delete();
            deletedCount++;
            logger.info(`🧹 [CleanupPendingRegistrations] User ${userId} has activity, keeping auth user`);
          }
        }
      } catch (docError: any) {
        errorCount++;
        logger.error(`❌ [CleanupPendingRegistrations] Error processing doc ${doc.id}:`, docError.message);
      }
    }

    logger.info('✅ [CleanupPendingRegistrations] Cleanup completed', {
      totalExpired: expiredDocs.size,
      deleted: deletedCount,
      orphanAuthDeleted: orphanAuthDeletedCount,
      errors: errorCount
    });

  } catch (error: any) {
    logger.error('❌ [CleanupPendingRegistrations] Error:', error);
    throw error;
  }
});

/**
 * Check if a user has any activity in the system
 * Used to determine if it's safe to delete their auth account
 */
async function checkUserHasActivity(userId: string): Promise<boolean> {
  try {
    // Check for enrollments
    const enrollmentsQuery = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!enrollmentsQuery.empty) {
      return true;
    }

    // Check for lesson progress
    const progressQuery = await firestore
      .collection('lessonProgress')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!progressQuery.empty) {
      return true;
    }

    // Check for subscriptions
    const subscriptionsQuery = await firestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!subscriptionsQuery.empty) {
      return true;
    }

    return false;
  } catch (error) {
    // If we can't check, assume user has activity (safer)
    return true;
  }
}
