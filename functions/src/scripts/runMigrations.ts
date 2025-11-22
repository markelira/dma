/**
 * Migration Runner Script
 *
 * Run from functions directory:
 * npx ts-node src/scripts/runMigrations.ts
 */
import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '../../service-account.json');

// Check if service account exists, otherwise use default credentials
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'dmaapp-477d4',
  });
} catch {
  // Use application default credentials (for local development with gcloud auth)
  admin.initializeApp({
    projectId: 'dmaapp-477d4',
  });
}

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

async function getMigrationStatus() {
  console.log('\n========================================');
  console.log('📊 MIGRATION STATUS');
  console.log('========================================\n');

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

  console.log('COURSES:');
  console.log(`  Total: ${totalCourses}`);
  console.log(`  With modules only: ${coursesWithModules}`);
  console.log(`  With flat lessons only: ${coursesWithFlatLessons}`);
  console.log(`  With both: ${coursesWithBoth}`);
  console.log(`  With neither: ${coursesWithNeither}`);
  console.log(`  Already migrated: ${migratedCourses}`);
  console.log(`  Needs migration: ${coursesWithModules + coursesWithBoth}`);

  console.log('\nINSTRUCTORS:');
  console.log(`  Total: ${instructorsSnapshot.size}`);
  console.log(`  With role: ${instructorsWithRole}`);
  console.log(`  Without role (needs migration): ${instructorsWithoutRole}`);

  console.log('\nTARGET AUDIENCES:');
  console.log(`  Total: ${targetAudiencesSnapshot.size}`);

  console.log('\nCOURSE DETAILS:');
  courseDetails.forEach(c => {
    const status = c.migratedAt ? '✅' : (c.hasModules ? '⚠️' : '➖');
    console.log(`  ${status} ${c.title}`);
    console.log(`     ID: ${c.id}`);
    console.log(`     Modules: ${c.moduleCount}, Flat Lessons: ${c.lessonCount}`);
    if (c.migratedAt) console.log(`     Migrated: ${c.migratedAt}`);
  });

  return {
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
  };
}

async function seedDefaultTargetAudiences() {
  console.log('\n========================================');
  console.log('🎯 SEEDING TARGET AUDIENCES');
  console.log('========================================\n');

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

  for (const audience of defaultTargetAudiences) {
    // Check if already exists
    const existingQuery = await firestore
      .collection('targetAudiences')
      .where('name', '==', audience.name)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      console.log(`⏭️  Skipped: ${audience.name} (already exists)`);
      skippedCount++;
      continue;
    }

    // Add new target audience
    await firestore.collection('targetAudiences').add({
      name: audience.name,
      description: audience.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Added: ${audience.name}`);
    addedCount++;
  }

  console.log(`\nSummary: Added ${addedCount}, Skipped ${skippedCount}`);
  return { addedCount, skippedCount };
}

async function addDefaultInstructorRoles() {
  console.log('\n========================================');
  console.log('👤 ADDING INSTRUCTOR ROLES');
  console.log('========================================\n');

  const instructorsSnapshot = await firestore.collection('instructors').get();

  let updatedCount = 0;
  let skippedCount = 0;

  const batch = firestore.batch();

  for (const doc of instructorsSnapshot.docs) {
    const instructor = doc.data();

    if (instructor.role) {
      console.log(`⏭️  Skipped: ${instructor.name} (already has role: ${instructor.role})`);
      skippedCount++;
      continue;
    }

    batch.update(doc.ref, {
      role: 'MENTOR',
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Will update: ${instructor.name} → MENTOR`);
    updatedCount++;
  }

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`\n✅ Committed ${updatedCount} instructor updates`);
  }

  console.log(`\nSummary: Updated ${updatedCount}, Skipped ${skippedCount}`);
  return { updatedCount, skippedCount };
}

async function migrateCoursesToFlatLessons(dryRun: boolean = true) {
  console.log('\n========================================');
  console.log(`📚 MIGRATING COURSES TO FLAT LESSONS ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('========================================\n');

  const coursesSnapshot = await firestore.collection('courses').get();

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const courseDoc of coursesSnapshot.docs) {
    const course = courseDoc.data();
    const courseId = courseDoc.id;

    try {
      // Check if course has modules to migrate
      if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
        // Check if already has lessons array
        if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
          console.log(`⏭️  Skipped: ${course.title} (already has flat lessons)`);
          skippedCount++;
          continue;
        }

        console.log(`⏭️  Skipped: ${course.title} (no modules to migrate)`);
        skippedCount++;
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
        console.log(`⏭️  Skipped: ${course.title} (no lessons in modules)`);
        skippedCount++;
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
        console.log(`✅ Migrated: ${course.title} (${flatLessons.length} lessons)`);
      } else {
        console.log(`🔍 Would migrate: ${course.title} (${flatLessons.length} lessons)`);
        flatLessons.forEach((l, i) => {
          console.log(`   ${i + 1}. ${l.title} (from: ${l.originalModuleTitle})`);
        });
      }

      migratedCount++;

    } catch (courseError: unknown) {
      errorCount++;
      const errorMessage = courseError instanceof Error ? courseError.message : 'Unknown error';
      console.log(`❌ Error: ${course.title} - ${errorMessage}`);
    }
  }

  console.log(`\nSummary: ${dryRun ? 'Would migrate' : 'Migrated'} ${migratedCount}, Skipped ${skippedCount}, Errors ${errorCount}`);
  return { migratedCount, skippedCount, errorCount, dryRun };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n🚀 DMA Migration Runner\n');

  try {
    switch (command) {
      case 'status':
        await getMigrationStatus();
        break;

      case 'seed-audiences':
        await seedDefaultTargetAudiences();
        break;

      case 'instructor-roles':
        await addDefaultInstructorRoles();
        break;

      case 'flatten-courses-dry':
        await migrateCoursesToFlatLessons(true);
        break;

      case 'flatten-courses':
        await migrateCoursesToFlatLessons(false);
        break;

      case 'all':
        console.log('Running all migrations...\n');
        await getMigrationStatus();
        await seedDefaultTargetAudiences();
        await addDefaultInstructorRoles();
        await migrateCoursesToFlatLessons(true); // Dry run first
        console.log('\n⚠️  To actually run the course migration, run: npm run migrate -- flatten-courses');
        break;

      default:
        console.log('Available commands:');
        console.log('  status              - Check migration status');
        console.log('  seed-audiences      - Seed default target audiences');
        console.log('  instructor-roles    - Add MENTOR role to instructors');
        console.log('  flatten-courses-dry - Preview course flattening (dry run)');
        console.log('  flatten-courses     - Execute course flattening');
        console.log('  all                 - Run all migrations (courses in dry-run mode)');
        console.log('\nUsage: npx ts-node src/scripts/runMigrations.ts <command>');
    }
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  }

  console.log('\n✅ Done!\n');
  process.exit(0);
}

main();
