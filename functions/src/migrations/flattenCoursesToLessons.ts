/**
 * Database Migration Functions
 *
 * These functions handle the migration from module-based course structure
 * to flat lessons, add default instructor roles, and seed target audiences.
 *
 * IMPORTANT: Run these migrations carefully in a controlled environment.
 * Always backup data before running migrations in production.
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const firestore = admin.firestore();

// Lesson interface for migration
interface MigrationLesson {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  muxStatus?: string;
  quiz?: unknown;
  pdfUrl?: string;
  audioUrl?: string;
  resources?: unknown[];
  learningOutcomes?: string[];
  createdAt: string;
  updatedAt: string;
  // Migration metadata
  originalModuleId?: string;
  originalModuleTitle?: string;
}

// Module interface for migration
interface MigrationModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  lessons: MigrationLesson[];
}

/**
 * Migrate all courses from module-based structure to flat lessons
 *
 * This function:
 * 1. Reads all courses with modules
 * 2. Flattens module.lessons into a single lessons array
 * 3. Preserves lesson order across modules
 * 4. Adds metadata about original module for reference
 * 5. Removes the modules field
 *
 * Admin only - requires ADMIN role
 */
export const migrateCoursesToFlatLessons = onCall({
  cors: true,
  region: 'us-central1',
  timeoutSeconds: 540, // 9 minutes for large datasets
}, async (request) => {
  try {
    logger.info('[migrateCoursesToFlatLessons] Starting migration');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges a migráció futtatásához.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod a migráció futtatásához. Csak adminisztrátorok futtathatják.');
    }

    // Get dry run flag from request
    const dryRun = request.data?.dryRun === true;
    logger.info(`[migrateCoursesToFlatLessons] Dry run mode: ${dryRun}`);

    // Get all courses
    const coursesSnapshot = await firestore.collection('courses').get();

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const migrationResults: Array<{
      courseId: string;
      title: string;
      status: 'migrated' | 'skipped' | 'error';
      lessonsCount?: number;
      reason?: string;
    }> = [];

    for (const courseDoc of coursesSnapshot.docs) {
      const course = courseDoc.data();
      const courseId = courseDoc.id;

      try {
        // Check if course has modules to migrate
        if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
          // Check if already has lessons array
          if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
            skippedCount++;
            migrationResults.push({
              courseId,
              title: course.title || 'Unknown',
              status: 'skipped',
              reason: 'Already has flat lessons structure',
            });
            continue;
          }

          skippedCount++;
          migrationResults.push({
            courseId,
            title: course.title || 'Unknown',
            status: 'skipped',
            reason: 'No modules to migrate',
          });
          continue;
        }

        // Flatten modules to lessons
        const flatLessons: MigrationLesson[] = [];
        let globalOrder = 0;

        // Sort modules by order first
        const sortedModules = [...(course.modules as MigrationModule[])].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );

        for (const module of sortedModules) {
          if (!module.lessons || !Array.isArray(module.lessons)) {
            continue;
          }

          // Sort lessons within module by order
          const sortedLessons = [...module.lessons].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );

          for (const lesson of sortedLessons) {
            flatLessons.push({
              ...lesson,
              order: globalOrder++,
              originalModuleId: module.id,
              originalModuleTitle: module.title,
            });
          }
        }

        if (flatLessons.length === 0) {
          skippedCount++;
          migrationResults.push({
            courseId,
            title: course.title || 'Unknown',
            status: 'skipped',
            reason: 'No lessons in modules',
          });
          continue;
        }

        // Update course document (only if not dry run)
        if (!dryRun) {
          await courseDoc.ref.update({
            lessons: flatLessons,
            modules: admin.firestore.FieldValue.delete(),
            migratedAt: new Date().toISOString(),
            migrationVersion: 'v1_flat_lessons',
          });
        }

        migratedCount++;
        migrationResults.push({
          courseId,
          title: course.title || 'Unknown',
          status: 'migrated',
          lessonsCount: flatLessons.length,
        });

        logger.info(`[migrateCoursesToFlatLessons] ${dryRun ? '[DRY RUN] Would migrate' : 'Migrated'} course: ${courseId} (${flatLessons.length} lessons)`);

      } catch (courseError: unknown) {
        errorCount++;
        const errorMessage = courseError instanceof Error ? courseError.message : 'Unknown error';
        migrationResults.push({
          courseId,
          title: course.title || 'Unknown',
          status: 'error',
          reason: errorMessage,
        });
        logger.error(`[migrateCoursesToFlatLessons] Error migrating course ${courseId}:`, courseError);
      }
    }

    const summary = {
      success: true,
      dryRun,
      totalCourses: coursesSnapshot.size,
      migratedCount,
      skippedCount,
      errorCount,
      results: migrationResults,
      message: dryRun
        ? `Dry run complete. Would migrate ${migratedCount} courses.`
        : `Migration complete. Migrated ${migratedCount} courses.`,
    };

    logger.info('[migrateCoursesToFlatLessons] Migration summary:', summary);

    return summary;

  } catch (error: unknown) {
    logger.error('[migrateCoursesToFlatLessons] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt a migráció során.';
    return {
      success: false,
      error: errorMessage,
    };
  }
});

/**
 * Add default MENTOR role to all existing instructors without a role
 *
 * Admin only - requires ADMIN role
 */
export const addDefaultInstructorRoles = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[addDefaultInstructorRoles] Starting migration');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges a migráció futtatásához.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod a migráció futtatásához.');
    }

    // Get dry run flag
    const dryRun = request.data?.dryRun === true;

    // Get all instructors
    const instructorsSnapshot = await firestore.collection('instructors').get();

    let updatedCount = 0;
    let skippedCount = 0;
    const results: Array<{
      id: string;
      name: string;
      status: 'updated' | 'skipped';
      reason?: string;
    }> = [];

    const batch = firestore.batch();

    for (const doc of instructorsSnapshot.docs) {
      const instructor = doc.data();

      if (instructor.role) {
        skippedCount++;
        results.push({
          id: doc.id,
          name: instructor.name || 'Unknown',
          status: 'skipped',
          reason: `Already has role: ${instructor.role}`,
        });
        continue;
      }

      if (!dryRun) {
        batch.update(doc.ref, {
          role: 'MENTOR',
          updatedAt: new Date().toISOString(),
        });
      }

      updatedCount++;
      results.push({
        id: doc.id,
        name: instructor.name || 'Unknown',
        status: 'updated',
      });
    }

    if (!dryRun && updatedCount > 0) {
      await batch.commit();
    }

    const summary = {
      success: true,
      dryRun,
      totalInstructors: instructorsSnapshot.size,
      updatedCount,
      skippedCount,
      results,
      message: dryRun
        ? `Dry run complete. Would update ${updatedCount} instructors with MENTOR role.`
        : `Migration complete. Updated ${updatedCount} instructors with MENTOR role.`,
    };

    logger.info('[addDefaultInstructorRoles] Migration summary:', summary);

    return summary;

  } catch (error: unknown) {
    logger.error('[addDefaultInstructorRoles] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
    return {
      success: false,
      error: errorMessage,
    };
  }
});

/**
 * Seed default target audiences
 *
 * Admin only - requires ADMIN role
 */
export const seedDefaultTargetAudiences = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[seedDefaultTargetAudiences] Starting seeding');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod a funkció futtatásához.');
    }

    // Default target audiences
    const defaultTargetAudiences = [
      { name: 'Vállalkozók', description: 'Cégtulajdonosok és vállalkozók' },
      { name: 'HR szakemberek', description: 'Emberi erőforrás területen dolgozók' },
      { name: 'Vezetők', description: 'Menedzserek és csapatvezetők' },
      { name: 'Marketingesek', description: 'Marketing és kommunikáció területen dolgozók' },
      { name: 'Értékesítők', description: 'Sales és üzletfejlesztés területen dolgozók' },
      { name: 'Pályakezdők', description: 'Karrierjük elején járók' },
      { name: 'Szakemberek', description: 'Tapasztalt szakemberek továbbképzéshez' },
      { name: 'IT szakemberek', description: 'Informatikai területen dolgozók' },
      { name: 'Tanárok és oktatók', description: 'Oktatási szférában dolgozók' },
      { name: 'Egészségügyi dolgozók', description: 'Egészségügyi területen dolgozók' },
    ];

    let addedCount = 0;
    let skippedCount = 0;
    const results: Array<{
      name: string;
      status: 'added' | 'skipped';
      reason?: string;
    }> = [];

    for (const audience of defaultTargetAudiences) {
      // Check if already exists
      const existingQuery = await firestore
        .collection('targetAudiences')
        .where('name', '==', audience.name)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        skippedCount++;
        results.push({
          name: audience.name,
          status: 'skipped',
          reason: 'Already exists',
        });
        continue;
      }

      // Add new target audience
      await firestore.collection('targetAudiences').add({
        name: audience.name,
        description: audience.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      addedCount++;
      results.push({
        name: audience.name,
        status: 'added',
      });
    }

    const summary = {
      success: true,
      totalTargetAudiences: defaultTargetAudiences.length,
      addedCount,
      skippedCount,
      results,
      message: `Seeding complete. Added ${addedCount} target audiences, skipped ${skippedCount} (already existed).`,
    };

    logger.info('[seedDefaultTargetAudiences] Seeding summary:', summary);

    return summary;

  } catch (error: unknown) {
    logger.error('[seedDefaultTargetAudiences] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
    return {
      success: false,
      error: errorMessage,
    };
  }
});

/**
 * Get migration status - check which courses have been migrated
 *
 * Admin only - requires ADMIN role
 */
export const getMigrationStatus = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[getMigrationStatus] Checking migration status');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod a funkció futtatásához.');
    }

    // Get all courses
    const coursesSnapshot = await firestore.collection('courses').get();

    let totalCourses = 0;
    let coursesWithModules = 0;
    let coursesWithFlatLessons = 0;
    let coursesWithBoth = 0;
    let coursesWithNeither = 0;
    let migratedCourses = 0;

    const courseDetails: Array<{
      id: string;
      title: string;
      hasModules: boolean;
      hasLessons: boolean;
      moduleCount: number;
      lessonCount: number;
      migratedAt?: string;
    }> = [];

    for (const doc of coursesSnapshot.docs) {
      const course = doc.data();
      totalCourses++;

      const hasModules = course.modules && Array.isArray(course.modules) && course.modules.length > 0;
      const hasLessons = course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0;

      if (hasModules && hasLessons) {
        coursesWithBoth++;
      } else if (hasModules) {
        coursesWithModules++;
      } else if (hasLessons) {
        coursesWithFlatLessons++;
      } else {
        coursesWithNeither++;
      }

      if (course.migratedAt) {
        migratedCourses++;
      }

      courseDetails.push({
        id: doc.id,
        title: course.title || 'Unknown',
        hasModules,
        hasLessons,
        moduleCount: hasModules ? course.modules.length : 0,
        lessonCount: hasLessons ? course.lessons.length : 0,
        migratedAt: course.migratedAt,
      });
    }

    // Get instructor stats
    const instructorsSnapshot = await firestore.collection('instructors').get();
    let instructorsWithRole = 0;
    let instructorsWithoutRole = 0;

    for (const doc of instructorsSnapshot.docs) {
      const instructor = doc.data();
      if (instructor.role) {
        instructorsWithRole++;
      } else {
        instructorsWithoutRole++;
      }
    }

    // Get target audience count
    const targetAudiencesSnapshot = await firestore.collection('targetAudiences').get();

    return {
      success: true,
      courses: {
        total: totalCourses,
        withModulesOnly: coursesWithModules,
        withFlatLessonsOnly: coursesWithFlatLessons,
        withBoth: coursesWithBoth,
        withNeither: coursesWithNeither,
        migrated: migratedCourses,
        needsMigration: coursesWithModules + coursesWithBoth,
      },
      instructors: {
        total: instructorsSnapshot.size,
        withRole: instructorsWithRole,
        withoutRole: instructorsWithoutRole,
      },
      targetAudiences: {
        total: targetAudiencesSnapshot.size,
      },
      courseDetails,
    };

  } catch (error: unknown) {
    logger.error('[getMigrationStatus] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
    return {
      success: false,
      error: errorMessage,
    };
  }
});
