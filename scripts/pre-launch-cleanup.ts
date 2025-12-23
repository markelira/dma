/**
 * Pre-Launch Data Cleanup Script
 *
 * This script safely clears all test user data from Firestore and Firebase Auth
 * while preserving crucial content (courses, categories, instructors) and
 * specified admin accounts.
 *
 * Usage:
 *   DRY_RUN=true npx tsx scripts/pre-launch-cleanup.ts   # Preview mode
 *   npx tsx scripts/pre-launch-cleanup.ts                 # Execute deletion
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// Configuration
const PRESERVE_EMAILS = ['admin@dma.hu'];
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 500;

// Initialize Firebase Admin
const serviceAccount = require('../dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Collections to delete (in order)
const COLLECTIONS_TO_DELETE = [
  // Phase 1: User Activity Collections
  'enrollments',
  'lessonProgress',
  'userProgress',
  'quizResults',
  'learningSessions',
  'learningStreaks',
  'learningGoals',
  'dashboardAnalytics',
  'certificates',
  'userAchievements',
  'courseRecommendations',

  // Phase 2: Payment & Billing
  'payments',
  'checkoutSessions',
  'invoices',
  'promoCodeUsages',

  // Phase 3: Auth & Verification
  'emailVerificationCodes',
  'emailVerifications',
  'passwordResets',
  'passwordResetAttempts',
  'userPreferences',

  // Phase 4: Support & Misc
  'supportTickets',
  'auditLogs',
  'deletionRequests',
  'inactivityReminders',
  'reviews',

  // Phase 5: Parent Collections (handled separately for subcollections)
  'subscriptions',
];

// Collections with subcollections
const COLLECTIONS_WITH_SUBCOLLECTIONS = {
  companies: ['admins', 'employees', 'masterclasses', 'purchases'],
  teams: ['members', 'enrolledCourses'],
};

// Stats tracking
const stats: Record<string, number> = {};

async function deleteCollection(collectionPath: string): Promise<number> {
  let deletedCount = 0;
  const collectionRef = db.collection(collectionPath);

  while (true) {
    const snapshot = await collectionRef.limit(BATCH_SIZE).get();

    if (snapshot.empty) {
      break;
    }

    if (DRY_RUN) {
      deletedCount += snapshot.size;
      console.log(`  [DRY RUN] Would delete ${snapshot.size} documents from ${collectionPath}`);
      break; // In dry run, just count first batch
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += snapshot.size;

    console.log(`  Deleted ${deletedCount} documents from ${collectionPath}...`);
  }

  return deletedCount;
}

async function deleteCollectionWithSubcollections(
  collectionName: string,
  subcollections: string[]
): Promise<number> {
  let totalDeleted = 0;
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  console.log(`\nProcessing ${collectionName} (${snapshot.size} documents)...`);

  for (const doc of snapshot.docs) {
    // Delete subcollections first
    for (const subName of subcollections) {
      const subPath = `${collectionName}/${doc.id}/${subName}`;
      const subDeleted = await deleteCollection(subPath);
      totalDeleted += subDeleted;
      if (subDeleted > 0) {
        stats[subPath] = (stats[subPath] || 0) + subDeleted;
      }
    }

    // Delete parent document
    if (!DRY_RUN) {
      await doc.ref.delete();
    }
    totalDeleted++;
  }

  stats[collectionName] = snapshot.size;
  console.log(`  ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} ${snapshot.size} ${collectionName} documents`);

  return totalDeleted;
}

async function deleteUsersExceptPreserved(): Promise<number> {
  let deletedCount = 0;
  const usersRef = db.collection('users');

  console.log('\nProcessing users collection (preserving specified emails)...');

  // Get all users
  const snapshot = await usersRef.get();
  const preservedUserIds: string[] = [];

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const email = userData.email?.toLowerCase();

    if (PRESERVE_EMAILS.map(e => e.toLowerCase()).includes(email)) {
      console.log(`  ✓ Preserving user: ${email} (${doc.id})`);
      preservedUserIds.push(doc.id);
      continue;
    }

    if (!DRY_RUN) {
      await doc.ref.delete();
    }
    deletedCount++;
  }

  console.log(`  ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} ${deletedCount} users (preserved ${preservedUserIds.length})`);
  stats['users'] = deletedCount;

  return deletedCount;
}

async function deleteFirebaseAuthUsers(): Promise<number> {
  let deletedCount = 0;
  let preservedCount = 0;

  console.log('\nProcessing Firebase Auth users...');

  try {
    let nextPageToken: string | undefined;

    do {
      const listResult = await auth.listUsers(1000, nextPageToken);

      for (const user of listResult.users) {
        const email = user.email?.toLowerCase();

        if (email && PRESERVE_EMAILS.map(e => e.toLowerCase()).includes(email)) {
          console.log(`  ✓ Preserving Auth user: ${email}`);
          preservedCount++;
          continue;
        }

        if (!DRY_RUN) {
          await auth.deleteUser(user.uid);
        }
        deletedCount++;
      }

      nextPageToken = listResult.pageToken;
    } while (nextPageToken);

  } catch (error) {
    console.error('Error deleting Auth users:', error);
  }

  console.log(`  ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} ${deletedCount} Auth users (preserved ${preservedCount})`);
  stats['firebaseAuth'] = deletedCount;

  return deletedCount;
}

async function promptConfirmation(): Promise<boolean> {
  if (DRY_RUN) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  WARNING: This will permanently delete all test data!');
    console.log('='.repeat(60));
    console.log('\nPreserved emails:', PRESERVE_EMAILS.join(', '));
    console.log('\nType "DELETE" to confirm:');

    rl.question('> ', (answer) => {
      rl.close();
      resolve(answer === 'DELETE');
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PRE-LAUNCH DATA CLEANUP SCRIPT');
  console.log('='.repeat(60));
  console.log(`\nMode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '🗑️  LIVE DELETION'}`);
  console.log(`Preserve emails: ${PRESERVE_EMAILS.join(', ')}`);

  // Confirmation
  const confirmed = await promptConfirmation();
  if (!confirmed) {
    console.log('\n❌ Aborted. No changes made.');
    process.exit(0);
  }

  console.log('\n' + '-'.repeat(60));
  console.log('Starting cleanup...');
  console.log('-'.repeat(60));

  // Phase 1: Delete collections with subcollections
  for (const [collection, subcollections] of Object.entries(COLLECTIONS_WITH_SUBCOLLECTIONS)) {
    await deleteCollectionWithSubcollections(collection, subcollections);
  }

  // Phase 2: Delete simple collections
  for (const collection of COLLECTIONS_TO_DELETE) {
    console.log(`\nProcessing ${collection}...`);
    const deleted = await deleteCollection(collection);
    if (deleted > 0) {
      stats[collection] = deleted;
    }
  }

  // Phase 3: Delete users (except preserved)
  await deleteUsersExceptPreserved();

  // Phase 4: Delete Firebase Auth users
  await deleteFirebaseAuthUsers();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  CLEANUP SUMMARY');
  console.log('='.repeat(60));

  let totalDeleted = 0;
  for (const [collection, count] of Object.entries(stats)) {
    if (count > 0) {
      console.log(`  ${collection}: ${count} documents`);
      totalDeleted += count;
    }
  }

  console.log('-'.repeat(60));
  console.log(`  TOTAL: ${totalDeleted} documents ${DRY_RUN ? 'would be deleted' : 'deleted'}`);
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without DRY_RUN=true to execute.');
  } else {
    console.log('\n✅ Cleanup completed successfully!');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
