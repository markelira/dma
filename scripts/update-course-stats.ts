/**
 * Migration Script: Update course documents with computed stats
 *
 * This script calculates and stores:
 * - totalDuration: Sum of all lesson muxDurations (in seconds)
 * - publishedLessonCount: Count of PUBLISHED lessons
 *
 * Usage:
 *   npx tsx scripts/update-course-stats.ts
 *
 * Requirements:
 *   - Firebase Admin credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath) as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

const firestore = getFirestore();

interface MigrationStats {
  totalCourses: number;
  updated: number;
  skipped: number;
  errors: number;
}

const stats: MigrationStats = {
  totalCourses: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
};

/**
 * Process a course - calculate stats from lessons and update course document
 */
async function processCourse(courseId: string, courseData: FirebaseFirestore.DocumentData): Promise<void> {
  stats.totalCourses++;

  const title = courseData.title || courseId;
  const courseType = courseData.courseType;

  let totalDuration = 0;
  let publishedLessonCount = 0;

  try {
    // 1) Check FLAT lessons (courses/{courseId}/lessons/{lessonId})
    // Used by PODCAST, WEBINAR, MASTERCLASS
    const flatLessonsSnapshot = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('lessons')
      .get();

    if (flatLessonsSnapshot.size > 0) {
      for (const lessonDoc of flatLessonsSnapshot.docs) {
        const lessonData = lessonDoc.data();
        const status = lessonData.status || 'PUBLISHED'; // Default to published for legacy

        if (status === 'PUBLISHED') {
          publishedLessonCount++;
          if (lessonData.muxDuration && lessonData.muxDuration > 0) {
            totalDuration += lessonData.muxDuration;
          }
        }
      }
    }

    // 2) Check MODULE lessons (courses/{courseId}/modules/{moduleId}/lessons/{lessonId})
    // Used by ACADEMIA
    const modulesSnapshot = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .get();

    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleLessonsSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleDoc.id)
        .collection('lessons')
        .get();

      for (const lessonDoc of moduleLessonsSnapshot.docs) {
        const lessonData = lessonDoc.data();
        const status = lessonData.status || 'PUBLISHED'; // Default to published for legacy

        if (status === 'PUBLISHED') {
          publishedLessonCount++;
          if (lessonData.muxDuration && lessonData.muxDuration > 0) {
            totalDuration += lessonData.muxDuration;
          }
        }
      }
    }

    // Skip if no lessons found
    if (publishedLessonCount === 0) {
      console.log(`  ⏭️ Skipping "${title}" - no published lessons`);
      stats.skipped++;
      return;
    }

    // Update the course document
    await firestore.collection('courses').doc(courseId).update({
      totalDuration: Math.round(totalDuration),
      publishedLessonCount,
      updatedAt: new Date().toISOString(),
    });

    const durationMin = Math.round(totalDuration / 60);
    console.log(`  ✅ Updated "${title}": ${publishedLessonCount} lessons, ${durationMin} min total`);
    stats.updated++;

  } catch (error: any) {
    console.error(`  ❌ Error processing ${courseId}:`, error.message);
    stats.errors++;
  }
}

/**
 * Main migration function
 */
async function updateCourseStats(): Promise<void> {
  console.log('🚀 Starting course stats update...\n');

  try {
    // Get all courses
    const coursesSnapshot = await firestore.collection('courses').get();
    console.log(`📚 Found ${coursesSnapshot.size} courses\n`);

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📖 Processing: "${courseData.title || courseId}" (${courseData.courseType || 'unknown'})`);
      await processCourse(courseId, courseData);
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Total courses processed: ${stats.totalCourses}`);
    console.log(`   Updated with stats:      ${stats.updated}`);
    console.log(`   Skipped (no lessons):    ${stats.skipped}`);
    console.log(`   Errors:                  ${stats.errors}`);
    console.log('='.repeat(50));
    console.log('\n✅ Course stats update complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
updateCourseStats().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
