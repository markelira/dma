/**
 * Migration Script: Add learningOutcomes, concepts, and tags to existing lessons
 *
 * This script updates all existing lessons in Firestore to include the new fields:
 * - learningOutcomes: array of learning objectives
 * - concepts: array of key concepts covered
 * - tags: array of searchable tags
 *
 * Usage:
 *   node migrate-lessons.js
 *
 * Prerequisites:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 *   - Or run from Firebase Cloud Functions environment
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

async function migrateLessons() {
  console.log('🚀 Starting lesson migration...\n');

  try {
    // Get all courses
    const coursesSnapshot = await firestore.collection('courses').get();
    console.log(`📚 Found ${coursesSnapshot.size} courses to process\n`);

    let totalLessonsProcessed = 0;
    let totalLessonsUpdated = 0;
    let totalLessonsSkipped = 0;

    // Process each course
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📖 Processing course: ${courseData.title} (${courseId})`);

      // Get all lessons in this course
      const lessonsSnapshot = await courseDoc.ref
        .collection('lessons')
        .get();

      console.log(`   Found ${lessonsSnapshot.size} lessons`);

      // Use batched writes for efficiency (max 500 per batch)
      let batch = firestore.batch();
      let batchCount = 0;
      let courseUpdated = 0;
      let courseSkipped = 0;

      for (const lessonDoc of lessonsSnapshot.docs) {
        const lessonData = lessonDoc.data();
        totalLessonsProcessed++;

        // Check if lesson already has the new fields
        if (lessonData.learningOutcomes !== undefined) {
          console.log(`   ⏩ Skipping: ${lessonData.title} (already migrated)`);
          courseSkipped++;
          totalLessonsSkipped++;
          continue;
        }

        // Add default empty arrays for new fields
        const updateData = {
          learningOutcomes: lessonData.learningOutcomes || [],
          concepts: lessonData.concepts || [],
          tags: lessonData.tags || []
        };

        batch.update(lessonDoc.ref, updateData);
        batchCount++;
        courseUpdated++;
        totalLessonsUpdated++;

        console.log(`   ✅ Queued: ${lessonData.title}`);

        // Commit batch if we reach 500 operations
        if (batchCount >= 500) {
          console.log(`   💾 Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = firestore.batch();
          batchCount = 0;
        }
      }

      // Commit remaining updates for this course
      if (batchCount > 0) {
        console.log(`   💾 Committing final batch of ${batchCount} updates...`);
        await batch.commit();
      }

      console.log(`   ✨ Course complete: ${courseUpdated} updated, ${courseSkipped} skipped`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total courses: ${coursesSnapshot.size}`);
    console.log(`   Total lessons processed: ${totalLessonsProcessed}`);
    console.log(`   Lessons updated: ${totalLessonsUpdated}`);
    console.log(`   Lessons skipped: ${totalLessonsSkipped}`);
    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      coursesProcessed: coursesSnapshot.size,
      lessonsProcessed: totalLessonsProcessed,
      lessonsUpdated: totalLessonsUpdated,
      lessonsSkipped: totalLessonsSkipped
    };

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateLessons()
    .then((result) => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateLessons };
