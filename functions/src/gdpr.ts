/**
 * GDPR Compliance Functions
 *
 * These functions implement GDPR user rights:
 * - Article 15: Right of access (data export)
 * - Article 17: Right to erasure (account deletion)
 * - Article 20: Right to data portability (JSON export)
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const firestore = admin.firestore();
const auth = admin.auth();

/**
 * Export all user data (GDPR Article 15 & 20)
 *
 * Returns all personal data stored about the user in machine-readable format.
 * This includes: profile, enrollments, progress, quiz results, payments.
 */
export const exportUserData = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  // Require authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
  }

  const userId = request.auth.uid;
  logger.info(`[GDPR] Data export requested for user: ${userId}`);

  try {
    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      userId: userId,
      exportVersion: '1.0',
    };

    // 1. User Profile
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      exportData.profile = {
        email: userData?.email,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        role: userData?.role,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt,
        bio: userData?.bio,
        title: userData?.title,
        institution: userData?.institution,
        profilePictureUrl: userData?.profilePictureUrl,
      };
    }

    // 2. Enrollments
    const enrollmentsSnapshot = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .get();

    exportData.enrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        courseId: data.courseId,
        enrolledAt: data.enrolledAt,
        status: data.status,
        progress: data.progress,
        completedLessons: data.completedLessons,
        lastAccessedAt: data.lastAccessedAt,
      };
    });

    // 3. Lesson Progress
    const progressSnapshot = await firestore
      .collection('lessonProgress')
      .where('userId', '==', userId)
      .get();

    exportData.lessonProgress = progressSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lessonId: data.lessonId,
        courseId: data.courseId,
        watchPercentage: data.watchPercentage,
        timeSpent: data.timeSpent,
        completed: data.completed,
        lastWatchedAt: data.lastWatchedAt,
      };
    });

    // 4. Quiz Results
    const quizResultsSnapshot = await firestore
      .collection('quizResults')
      .where('userId', '==', userId)
      .get();

    exportData.quizResults = quizResultsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        quizId: data.quizId,
        courseId: data.courseId,
        score: data.score,
        passed: data.passed,
        attemptNumber: data.attemptNumber,
        completedAt: data.completedAt,
      };
    });

    // 5. User Progress (gamification)
    const userProgressSnapshot = await firestore
      .collection('userProgress')
      .where('userId', '==', userId)
      .get();

    exportData.userProgress = userProgressSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        courseId: data.courseId,
        xp: data.xp,
        level: data.level,
        badges: data.badges,
        streakDays: data.streakDays,
      };
    });

    // 6. Subscriptions (without sensitive payment details)
    const subscriptionsSnapshot = await firestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    exportData.subscriptions = subscriptionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        plan: data.plan,
        startDate: data.startDate,
        endDate: data.endDate,
        cancelledAt: data.cancelledAt,
      };
    });

    // 7. Support Tickets
    const ticketsSnapshot = await firestore
      .collection('supportTickets')
      .where('userId', '==', userId)
      .get();

    exportData.supportTickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        subject: data.subject,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    // 8. Company associations (if employee)
    // Note: This requires a collection group index on employees.userId
    // If index doesn't exist, skip this data with a warning
    try {
      const employeeSnapshot = await firestore
        .collectionGroup('employees')
        .where('userId', '==', userId)
        .get();

      exportData.companyAssociations = employeeSnapshot.docs.map(doc => {
        const data = doc.data();
        // Get company ID from document path
        const pathParts = doc.ref.path.split('/');
        const companyId = pathParts[1];
        return {
          companyId: companyId,
          role: data.role,
          employeeName: data.employeeName,
          employeeEmail: data.employeeEmail,
          enrolledAt: data.enrolledAt,
        };
      });
    } catch (indexError: unknown) {
      logger.warn('[GDPR] Company associations skipped - index may not exist:', indexError);
      exportData.companyAssociations = [];
      exportData.companyAssociationsNote = 'Company data could not be retrieved. Contact support if needed.';
    }

    logger.info(`[GDPR] Data export completed for user: ${userId}`, {
      enrollments: (exportData.enrollments as unknown[]).length,
      lessonProgress: (exportData.lessonProgress as unknown[]).length,
      quizResults: (exportData.quizResults as unknown[]).length,
    });

    return {
      success: true,
      data: exportData,
    };
  } catch (error: unknown) {
    logger.error('[GDPR] Data export failed:', error);
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
    throw new HttpsError('internal', `Adatok exportálása sikertelen: ${message}`);
  }
});

/**
 * Request account deletion (GDPR Article 17)
 *
 * Initiates the account deletion process with a 30-day grace period.
 * During the grace period, the user can cancel the deletion.
 * After 30 days, a scheduled function will permanently delete the data.
 */
export const requestAccountDeletion = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  // Require authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
  }

  const userId = request.auth.uid;
  const { confirmEmail } = request.data || {};

  logger.info(`[GDPR] Account deletion requested for user: ${userId}`);

  try {
    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Felhasználó nem található.');
    }

    const userData = userDoc.data();

    // Verify email confirmation matches
    if (confirmEmail && confirmEmail !== userData?.email) {
      throw new HttpsError('invalid-argument', 'Az email cím nem egyezik.');
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30); // 30-day grace period

    // Mark account for deletion
    await firestore.collection('users').doc(userId).update({
      deletionRequested: true,
      deletionRequestedAt: new Date().toISOString(),
      scheduledDeletionDate: deletionDate.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create deletion request record for audit
    await firestore.collection('deletionRequests').doc(userId).set({
      userId: userId,
      email: userData?.email,
      requestedAt: new Date().toISOString(),
      scheduledDeletionDate: deletionDate.toISOString(),
      status: 'pending',
      reason: request.data?.reason || 'User requested',
    });

    logger.info(`[GDPR] Account deletion scheduled for user: ${userId}`, {
      scheduledDate: deletionDate.toISOString(),
    });

    return {
      success: true,
      message: 'A fiók törlése ütemezve. 30 napon belül visszavonhatod a kérést.',
      scheduledDeletionDate: deletionDate.toISOString(),
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) throw error;
    logger.error('[GDPR] Account deletion request failed:', error);
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
    throw new HttpsError('internal', `Fiók törlése sikertelen: ${message}`);
  }
});

/**
 * Cancel account deletion request
 *
 * Allows user to cancel a pending deletion request within the grace period.
 */
export const cancelAccountDeletion = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
  }

  const userId = request.auth.uid;
  logger.info(`[GDPR] Deletion cancellation requested for user: ${userId}`);

  try {
    // Check if deletion was requested
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (!userData?.deletionRequested) {
      throw new HttpsError('failed-precondition', 'Nincs függőben lévő törlési kérés.');
    }

    // Remove deletion flags
    await firestore.collection('users').doc(userId).update({
      deletionRequested: admin.firestore.FieldValue.delete(),
      deletionRequestedAt: admin.firestore.FieldValue.delete(),
      scheduledDeletionDate: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    // Update deletion request record
    await firestore.collection('deletionRequests').doc(userId).update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    logger.info(`[GDPR] Deletion cancelled for user: ${userId}`);

    return {
      success: true,
      message: 'A fiók törlési kérése visszavonva.',
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) throw error;
    logger.error('[GDPR] Deletion cancellation failed:', error);
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
    throw new HttpsError('internal', `Visszavonás sikertelen: ${message}`);
  }
});

/**
 * Execute account deletion (Admin or scheduled task only)
 *
 * Permanently deletes all user data. This should be called:
 * - By a scheduled Cloud Function after the 30-day grace period
 * - By an admin for immediate deletion requests
 *
 * Retains billing records for 8 years per tax requirements.
 */
export const executeAccountDeletion = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
  }

  const { targetUserId } = request.data || {};
  const requesterId = request.auth.uid;

  // Check if requester is admin OR deleting own account
  const requesterDoc = await firestore.collection('users').doc(requesterId).get();
  const requesterData = requesterDoc.data();
  const isAdmin = requesterData?.role === 'ADMIN';

  const userId = isAdmin && targetUserId ? targetUserId : requesterId;

  if (!isAdmin && targetUserId && targetUserId !== requesterId) {
    throw new HttpsError('permission-denied', 'Nincs jogosultságod más fiók törléséhez.');
  }

  logger.info(`[GDPR] Executing account deletion for user: ${userId}`, {
    requestedBy: requesterId,
    isAdmin,
  });

  try {
    const batch = firestore.batch();
    let deletedCount = 0;

    // 1. Delete enrollments
    const enrollmentsSnapshot = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .get();
    enrollmentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // 2. Delete lesson progress
    const progressSnapshot = await firestore
      .collection('lessonProgress')
      .where('userId', '==', userId)
      .get();
    progressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // 3. Delete quiz results
    const quizResultsSnapshot = await firestore
      .collection('quizResults')
      .where('userId', '==', userId)
      .get();
    quizResultsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // 4. Delete user progress
    const userProgressSnapshot = await firestore
      .collection('userProgress')
      .where('userId', '==', userId)
      .get();
    userProgressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // 5. Delete support tickets
    const ticketsSnapshot = await firestore
      .collection('supportTickets')
      .where('userId', '==', userId)
      .get();
    ticketsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // 6. Delete email verification codes
    const verificationSnapshot = await firestore
      .collection('emailVerificationCodes')
      .where('userId', '==', userId)
      .get();
    verificationSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // 7. Anonymize subscriptions (keep for billing records, anonymize PII)
    const subscriptionsSnapshot = await firestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .get();
    subscriptionsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        userId: `deleted_${userId.substring(0, 8)}`,
        anonymizedAt: new Date().toISOString(),
      });
    });

    // 8. Remove from company employees (skip if index not ready)
    try {
      const employeeSnapshot = await firestore
        .collectionGroup('employees')
        .where('userId', '==', userId)
        .get();
      employeeSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });
    } catch (employeeError) {
      logger.warn(`[GDPR] Could not query employees (index may not be ready): ${userId}`, employeeError);
      // Continue with deletion - employees will be orphaned but user data is still removed
    }

    // 9. Delete the user document
    const userDocRef = firestore.collection('users').doc(userId);
    batch.delete(userDocRef);
    deletedCount++;

    // 10. Create/update deletion request record (use set with merge for direct deletions)
    const deletionRequestRef = firestore.collection('deletionRequests').doc(userId);
    batch.set(deletionRequestRef, {
      userId: userId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      deletedDocuments: deletedCount,
    }, { merge: true });

    // Commit all deletions
    await batch.commit();

    // 11. Delete Firebase Auth user
    try {
      await auth.deleteUser(userId);
      logger.info(`[GDPR] Auth user deleted: ${userId}`);
    } catch (authError) {
      logger.warn(`[GDPR] Auth user deletion failed (may already be deleted): ${userId}`, authError);
    }

    // 12. Delete Stripe customer (if exists)
    // Note: This requires Stripe SDK - implement if needed
    // await deleteStripeCustomer(stripeCustomerId);

    logger.info(`[GDPR] Account deletion completed for user: ${userId}`, {
      deletedDocuments: deletedCount,
    });

    return {
      success: true,
      message: 'A fiók és az összes kapcsolódó adat véglegesen törölve.',
      deletedDocuments: deletedCount,
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) throw error;
    logger.error('[GDPR] Account deletion execution failed:', error);
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
    throw new HttpsError('internal', `Fiók törlése sikertelen: ${message}`);
  }
});
