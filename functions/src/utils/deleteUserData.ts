/**
 * Shared User Data Deletion Helper
 *
 * Handles complete deletion of all user data from Firestore, Firebase Auth,
 * and Stripe. Used by both removeEmployee and GDPR executeAccountDeletion.
 *
 * Deletion order is intentional:
 * 1. Collection data (by userId query) — chunked batches of ~450
 * 2. Documents by ID (userId as doc ID)
 * 3. Anonymize billing records (tax compliance, 8-year retention)
 * 4. Employee records across all companies
 * 5. User document
 * 6. Audit record
 * 7. Firebase Auth user (LAST — so retries work if earlier steps fail)
 * 8. Stripe customer
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';

const db = admin.firestore();

const BATCH_LIMIT = 450;

let stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-10-28.acacia' as any,
    });
  }
  return stripe;
}

interface DeleteUserDataOptions {
  callerContext: 'removeEmployee' | 'gdpr';
}

interface DeleteUserDataResult {
  success: boolean;
  deletedCount: number;
}

/**
 * Helper to commit a batch if it has pending operations,
 * then return a fresh batch and reset the counter.
 */
async function flushBatch(
  batch: admin.firestore.WriteBatch,
  count: number,
  logPrefix: string,
  flushReason: string
): Promise<{ batch: admin.firestore.WriteBatch; count: number }> {
  if (count > 0) {
    logger.info(`${logPrefix} BATCH FLUSH: committing ${count} operations (reason: ${flushReason})`);
    await batch.commit();
    logger.info(`${logPrefix} BATCH FLUSH: committed successfully`);
  }
  return { batch: db.batch(), count: 0 };
}

/**
 * Delete all documents in a collection matching userId, using chunked batches.
 */
async function deleteCollectionByUserId(
  collectionName: string,
  userId: string,
  batch: admin.firestore.WriteBatch,
  batchCount: number,
  logPrefix: string
): Promise<{ batch: admin.firestore.WriteBatch; batchCount: number; deleted: number; docIds: string[] }> {
  logger.info(`${logPrefix}   Querying ${collectionName} where userId == ${userId}...`);

  const snapshot = await db
    .collection(collectionName)
    .where('userId', '==', userId)
    .get();

  logger.info(`${logPrefix}   ${collectionName}: found ${snapshot.size} documents`);

  let deleted = 0;
  let currentBatch = batch;
  let currentCount = batchCount;
  const docIds: string[] = [];

  for (const doc of snapshot.docs) {
    if (currentCount >= BATCH_LIMIT) {
      const flushed = await flushBatch(currentBatch, currentCount, logPrefix, `batch limit reached during ${collectionName}`);
      currentBatch = flushed.batch;
      currentCount = flushed.count;
    }
    currentBatch.delete(doc.ref);
    currentCount++;
    deleted++;
    docIds.push(doc.id);
  }

  if (docIds.length > 0) {
    logger.info(`${logPrefix}   ${collectionName}: queued ${deleted} for deletion — IDs: [${docIds.join(', ')}]`);
  }

  return { batch: currentBatch, batchCount: currentCount, deleted, docIds };
}

/**
 * Anonymize all documents in a collection matching userId (for billing retention).
 */
async function anonymizeCollectionByUserId(
  collectionName: string,
  userId: string,
  batch: admin.firestore.WriteBatch,
  batchCount: number,
  logPrefix: string
): Promise<{ batch: admin.firestore.WriteBatch; batchCount: number; anonymized: number; docIds: string[] }> {
  logger.info(`${logPrefix}   Querying ${collectionName} where userId == ${userId}...`);

  const snapshot = await db
    .collection(collectionName)
    .where('userId', '==', userId)
    .get();

  logger.info(`${logPrefix}   ${collectionName}: found ${snapshot.size} documents to anonymize`);

  let anonymized = 0;
  let currentBatch = batch;
  let currentCount = batchCount;
  const anonymizedId = `deleted_${userId.substring(0, 8)}`;
  const docIds: string[] = [];

  for (const doc of snapshot.docs) {
    if (currentCount >= BATCH_LIMIT) {
      const flushed = await flushBatch(currentBatch, currentCount, logPrefix, `batch limit reached during ${collectionName} anonymization`);
      currentBatch = flushed.batch;
      currentCount = flushed.count;
    }
    currentBatch.update(doc.ref, {
      userId: anonymizedId,
      anonymizedAt: new Date().toISOString(),
    });
    currentCount++;
    anonymized++;
    docIds.push(doc.id);
  }

  if (docIds.length > 0) {
    logger.info(`${logPrefix}   ${collectionName}: queued ${anonymized} for anonymization (→ ${anonymizedId}) — IDs: [${docIds.join(', ')}]`);
  }

  return { batch: currentBatch, batchCount: currentCount, anonymized, docIds };
}

/**
 * Permanently delete all user data across Firestore, Firebase Auth, and Stripe.
 */
export async function deleteUserData(
  userId: string,
  options: DeleteUserDataOptions
): Promise<DeleteUserDataResult> {
  const { callerContext } = options;
  const logPrefix = `[${callerContext}][deleteUserData]`;
  const startTime = Date.now();

  logger.info(`${logPrefix} ========================================`);
  logger.info(`${logPrefix} STARTING FULL USER DELETION`);
  logger.info(`${logPrefix} userId: ${userId}`);
  logger.info(`${logPrefix} callerContext: ${callerContext}`);
  logger.info(`${logPrefix} timestamp: ${new Date().toISOString()}`);
  logger.info(`${logPrefix} ========================================`);

  // Collect a summary of everything that happened
  const summary: Record<string, number | string | boolean | string[]> = {};

  // ──────────────────────────────────────────────────
  // STEP 1/9: Read user doc — capture data before deletion
  // ──────────────────────────────────────────────────
  const step1Start = Date.now();
  logger.info(`${logPrefix} [STEP 1/9] Reading user document: users/${userId}`);

  const userDocRef = db.collection('users').doc(userId);
  const userDoc = await userDocRef.get();
  const userData = userDoc.data();

  if (!userDoc.exists) {
    logger.warn(`${logPrefix} [STEP 1/9] User document does NOT exist! userId: ${userId}. Will continue with cleanup of other collections.`);
  } else {
    logger.info(`${logPrefix} [STEP 1/9] User document found`, {
      email: userData?.email || 'N/A',
      role: userData?.role || 'N/A',
      firstName: userData?.firstName || 'N/A',
      lastName: userData?.lastName || 'N/A',
      stripeCustomerId: userData?.stripeCustomerId || 'NONE',
      companyId: userData?.companyId || 'NONE',
      createdAt: userData?.createdAt || 'N/A',
    });
  }

  const stripeCustomerId = userData?.stripeCustomerId;
  const userEmail = userData?.email;
  summary.userExists = userDoc.exists;
  summary.userEmail = userEmail || 'N/A';
  summary.userRole = userData?.role || 'N/A';
  summary.hasStripeCustomer = !!stripeCustomerId;

  logger.info(`${logPrefix} [STEP 1/9] Complete (${Date.now() - step1Start}ms)`);

  let totalDeleted = 0;
  let batch = db.batch();
  let batchCount = 0;

  // ──────────────────────────────────────────────────
  // STEP 2/9: Delete collections by userId field query
  // ──────────────────────────────────────────────────
  const step2Start = Date.now();
  logger.info(`${logPrefix} [STEP 2/9] Deleting user data from collections (by userId query)...`);

  const collectionsToDelete = [
    'enrollments',
    'lessonProgress',
    'quizResults',
    'userProgress',
    'learningSessions',
    'userAchievements',
    'learningGoals',
    'supportTickets',
    'emailVerificationCodes',
    'inactivityReminders',
    'promoCodeUsages',
    'courseRecommendations',
  ];

  for (const collectionName of collectionsToDelete) {
    const result = await deleteCollectionByUserId(
      collectionName,
      userId,
      batch,
      batchCount,
      logPrefix
    );
    batch = result.batch;
    batchCount = result.batchCount;
    totalDeleted += result.deleted;
    summary[`deleted_${collectionName}`] = result.deleted;
  }

  logger.info(`${logPrefix} [STEP 2/9] Complete — ${totalDeleted} docs queued from ${collectionsToDelete.length} collections (${Date.now() - step2Start}ms)`);

  // ──────────────────────────────────────────────────
  // STEP 3/9: Delete documents by doc ID = userId
  // ──────────────────────────────────────────────────
  const step3Start = Date.now();
  logger.info(`${logPrefix} [STEP 3/9] Deleting documents where doc ID = userId...`);

  const docIdCollections = [
    'learningStreaks',
    'dashboardAnalytics',
    'userPreferences',
    'pendingRegistrations',
  ];

  let step3Deleted = 0;
  for (const collectionName of docIdCollections) {
    const docRef = db.collection(collectionName).doc(userId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      if (batchCount >= BATCH_LIMIT) {
        const flushed = await flushBatch(batch, batchCount, logPrefix, `batch limit reached during ${collectionName}`);
        batch = flushed.batch;
        batchCount = flushed.count;
      }
      batch.delete(docRef);
      batchCount++;
      totalDeleted++;
      step3Deleted++;
      logger.info(`${logPrefix}   ${collectionName}/${userId}: EXISTS — queued for deletion`);
      summary[`deleted_${collectionName}`] = 1;
    } else {
      logger.info(`${logPrefix}   ${collectionName}/${userId}: does not exist — skipping`);
      summary[`deleted_${collectionName}`] = 0;
    }
  }

  logger.info(`${logPrefix} [STEP 3/9] Complete — ${step3Deleted} docs queued (${Date.now() - step3Start}ms)`);

  // Flush current batch before anonymization
  if (batchCount > 0) {
    const flushed = await flushBatch(batch, batchCount, logPrefix, 'pre-anonymization flush');
    batch = flushed.batch;
    batchCount = flushed.count;
  }

  // ──────────────────────────────────────────────────
  // STEP 4/9: Anonymize billing records (tax compliance)
  // ──────────────────────────────────────────────────
  const step4Start = Date.now();
  logger.info(`${logPrefix} [STEP 4/9] Anonymizing billing records (8-year tax retention)...`);

  const collectionsToAnonymize = [
    'subscriptions',
    'payments',
    'invoices',
  ];

  let totalAnonymized = 0;
  for (const collectionName of collectionsToAnonymize) {
    const result = await anonymizeCollectionByUserId(
      collectionName,
      userId,
      batch,
      batchCount,
      logPrefix
    );
    batch = result.batch;
    batchCount = result.batchCount;
    totalAnonymized += result.anonymized;
    summary[`anonymized_${collectionName}`] = result.anonymized;
  }

  logger.info(`${logPrefix} [STEP 4/9] Complete — ${totalAnonymized} billing docs anonymized (${Date.now() - step4Start}ms)`);

  // Flush before employee records
  if (batchCount > 0) {
    const flushed = await flushBatch(batch, batchCount, logPrefix, 'pre-employee-deletion flush');
    batch = flushed.batch;
    batchCount = flushed.count;
  }

  // ──────────────────────────────────────────────────
  // STEP 5/9: Delete employee records across ALL companies
  // ──────────────────────────────────────────────────
  const step5Start = Date.now();
  logger.info(`${logPrefix} [STEP 5/9] Deleting employee records (collectionGroup query)...`);

  let employeeDocsDeleted = 0;
  try {
    const employeeSnapshot = await db
      .collectionGroup('employees')
      .where('userId', '==', userId)
      .get();

    logger.info(`${logPrefix}   collectionGroup('employees'): found ${employeeSnapshot.size} records`);

    const employeePaths: string[] = [];
    for (const doc of employeeSnapshot.docs) {
      if (batchCount >= BATCH_LIMIT) {
        const flushed = await flushBatch(batch, batchCount, logPrefix, 'batch limit reached during employee records');
        batch = flushed.batch;
        batchCount = flushed.count;
      }
      batch.delete(doc.ref);
      batchCount++;
      totalDeleted++;
      employeeDocsDeleted++;
      employeePaths.push(doc.ref.path);
    }

    if (employeePaths.length > 0) {
      logger.info(`${logPrefix}   Employee record paths: [${employeePaths.join(', ')}]`);
    }

    summary.deleted_employeeRecords = employeeDocsDeleted;
    summary.employeePaths = employeePaths;
  } catch (employeeError: any) {
    logger.error(`${logPrefix} [STEP 5/9] ERROR querying employees collectionGroup`, {
      error: employeeError.message || employeeError,
      code: employeeError.code || 'unknown',
    });
    summary.deleted_employeeRecords = 'ERROR';
  }

  logger.info(`${logPrefix} [STEP 5/9] Complete — ${employeeDocsDeleted} employee records queued (${Date.now() - step5Start}ms)`);

  // ──────────────────────────────────────────────────
  // STEP 6/9: Delete user document
  // ──────────────────────────────────────────────────
  const step6Start = Date.now();
  logger.info(`${logPrefix} [STEP 6/9] Deleting user document: users/${userId}`);

  if (userDoc.exists) {
    if (batchCount >= BATCH_LIMIT) {
      const flushed = await flushBatch(batch, batchCount, logPrefix, 'batch limit reached before user doc delete');
      batch = flushed.batch;
      batchCount = flushed.count;
    }
    batch.delete(userDocRef);
    batchCount++;
    totalDeleted++;
    logger.info(`${logPrefix}   users/${userId}: queued for deletion`);
    summary.deleted_userDoc = true;
  } else {
    logger.warn(`${logPrefix}   users/${userId}: already gone — skipping`);
    summary.deleted_userDoc = false;
  }

  logger.info(`${logPrefix} [STEP 6/9] Complete (${Date.now() - step6Start}ms)`);

  // ──────────────────────────────────────────────────
  // STEP 7/9: Create audit record
  // ──────────────────────────────────────────────────
  const step7Start = Date.now();
  logger.info(`${logPrefix} [STEP 7/9] Creating audit record: deletionRequests/${userId}`);

  const deletionRequestRef = db.collection('deletionRequests').doc(userId);
  if (batchCount >= BATCH_LIMIT) {
    const flushed = await flushBatch(batch, batchCount, logPrefix, 'batch limit reached before audit record');
    batch = flushed.batch;
    batchCount = flushed.count;
  }
  batch.set(
    deletionRequestRef,
    {
      userId,
      email: userEmail || null,
      status: 'completed',
      completedAt: new Date().toISOString(),
      deletedDocuments: totalDeleted,
      anonymizedDocuments: totalAnonymized,
      callerContext,
    },
    { merge: true }
  );
  batchCount++;

  // Commit remaining batch
  if (batchCount > 0) {
    const flushed = await flushBatch(batch, batchCount, logPrefix, 'final Firestore commit');
    batch = flushed.batch;
    batchCount = flushed.count;
  }

  logger.info(`${logPrefix} [STEP 7/9] Complete — audit record written (${Date.now() - step7Start}ms)`);

  const firestoreTime = Date.now() - startTime;
  logger.info(`${logPrefix} All Firestore operations complete in ${firestoreTime}ms. Total deleted: ${totalDeleted}, anonymized: ${totalAnonymized}`);

  // ──────────────────────────────────────────────────
  // STEP 8/9: Delete Firebase Auth user
  // ──────────────────────────────────────────────────
  const step8Start = Date.now();
  logger.info(`${logPrefix} [STEP 8/9] Deleting Firebase Auth user: ${userId}`);

  try {
    await admin.auth().deleteUser(userId);
    logger.info(`${logPrefix} [STEP 8/9] Firebase Auth user DELETED successfully (${Date.now() - step8Start}ms)`);
    summary.authDeleted = true;
  } catch (authError: any) {
    logger.error(`${logPrefix} [STEP 8/9] Firebase Auth deletion FAILED`, {
      error: authError.message || authError,
      code: authError.code || 'unknown',
      duration: `${Date.now() - step8Start}ms`,
    });
    summary.authDeleted = false;
    summary.authError = authError.message || 'unknown';
  }

  // ──────────────────────────────────────────────────
  // STEP 9/9: Delete Stripe customer
  // ──────────────────────────────────────────────────
  const step9Start = Date.now();
  if (stripeCustomerId) {
    logger.info(`${logPrefix} [STEP 9/9] Deleting Stripe customer: ${stripeCustomerId}`);
    try {
      const stripeInstance = getStripeInstance();
      await stripeInstance.customers.del(stripeCustomerId);
      logger.info(`${logPrefix} [STEP 9/9] Stripe customer DELETED successfully (${Date.now() - step9Start}ms)`);
      summary.stripeDeleted = true;
    } catch (stripeError: any) {
      logger.error(`${logPrefix} [STEP 9/9] Stripe customer deletion FAILED`, {
        stripeCustomerId,
        error: stripeError.message || stripeError,
        code: stripeError.code || 'unknown',
        duration: `${Date.now() - step9Start}ms`,
      });
      summary.stripeDeleted = false;
      summary.stripeError = stripeError.message || 'unknown';
    }
  } else {
    logger.info(`${logPrefix} [STEP 9/9] No Stripe customer ID — skipping`);
    summary.stripeDeleted = 'skipped';
  }

  // ──────────────────────────────────────────────────
  // FINAL SUMMARY
  // ──────────────────────────────────────────────────
  const totalTime = Date.now() - startTime;

  logger.info(`${logPrefix} ========================================`);
  logger.info(`${logPrefix} DELETION COMPLETE`);
  logger.info(`${logPrefix} userId: ${userId}`);
  logger.info(`${logPrefix} email: ${userEmail || 'N/A'}`);
  logger.info(`${logPrefix} totalDeleted: ${totalDeleted}`);
  logger.info(`${logPrefix} totalAnonymized: ${totalAnonymized}`);
  logger.info(`${logPrefix} authDeleted: ${summary.authDeleted}`);
  logger.info(`${logPrefix} stripeDeleted: ${summary.stripeDeleted}`);
  logger.info(`${logPrefix} totalDuration: ${totalTime}ms`);
  logger.info(`${logPrefix} summary: ${JSON.stringify(summary)}`);
  logger.info(`${logPrefix} ========================================`);

  return {
    success: true,
    deletedCount: totalDeleted,
  };
}

/**
 * Clear user progress/learning data only (lighter than full deletion).
 * Used on subscription cancellation — keeps user account, auth, stripe, billing, preferences.
 */
export async function clearUserProgressData(
  userId: string
): Promise<{ success: boolean; deletedCount: number }> {
  const logPrefix = '[clearUserProgressData]';
  const startTime = Date.now();

  logger.info(`${logPrefix} Clearing progress data for userId: ${userId}`);

  let totalDeleted = 0;
  let batch = db.batch();
  let batchCount = 0;

  // Collections to delete by userId query
  const collectionsToDelete = [
    'enrollments',
    'lessonProgress',
    'quizResults',
    'userProgress',
    'learningSessions',
    'userAchievements',
    'learningGoals',
    'courseRecommendations',
  ];

  for (const collectionName of collectionsToDelete) {
    const result = await deleteCollectionByUserId(
      collectionName,
      userId,
      batch,
      batchCount,
      logPrefix
    );
    batch = result.batch;
    batchCount = result.batchCount;
    totalDeleted += result.deleted;
  }

  // Documents by doc ID = userId
  const docIdCollections = ['learningStreaks', 'dashboardAnalytics'];

  for (const collectionName of docIdCollections) {
    const docRef = db.collection(collectionName).doc(userId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      if (batchCount >= BATCH_LIMIT) {
        const flushed = await flushBatch(batch, batchCount, logPrefix, `batch limit during ${collectionName}`);
        batch = flushed.batch;
        batchCount = flushed.count;
      }
      batch.delete(docRef);
      batchCount++;
      totalDeleted++;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await flushBatch(batch, batchCount, logPrefix, 'final commit');
  }

  logger.info(`${logPrefix} Complete — ${totalDeleted} docs deleted for userId: ${userId} (${Date.now() - startTime}ms)`);

  return { success: true, deletedCount: totalDeleted };
}
