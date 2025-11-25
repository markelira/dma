/**
 * Script to export courses from production Firestore
 * Run with: node scripts/export-production-courses.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccountPath = path.join(__dirname, '../dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ Service account key not found!');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'dmaapp-477d4',
});

const db = getFirestore();

async function exportCourses() {
  try {
    console.log('📚 Fetching courses from production...');

    const coursesSnapshot = await db.collection('courses').get();
    const courses = [];

    for (const doc of coursesSnapshot.docs) {
      const courseData = doc.data();
      console.log(`  - ${courseData.title} (${courseData.courseType || 'NO_TYPE'})`);

      // Get modules subcollection
      const modulesSnapshot = await db.collection(`courses/${doc.id}/modules`).get();
      const modules = [];

      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleData = moduleDoc.data();

        // Get lessons subcollection
        const lessonsSnapshot = await db.collection(`courses/${doc.id}/modules/${moduleDoc.id}/lessons`).get();
        const lessons = lessonsSnapshot.docs.map(lessonDoc => ({
          id: lessonDoc.id,
          ...lessonDoc.data(),
        }));

        modules.push({
          id: moduleDoc.id,
          ...moduleData,
          lessons,
        });
      }

      courses.push({
        id: doc.id,
        ...courseData,
        modules,
      });
    }

    console.log(`\n✅ Found ${courses.length} courses`);

    // Output as JavaScript for the seed file
    const output = `// Exported from production Firestore on ${new Date().toISOString()}
const productionCourses = ${JSON.stringify(courses, null, 2)};

module.exports = { productionCourses };
`;

    const outputPath = path.join(__dirname, 'production-courses-export.js');
    fs.writeFileSync(outputPath, output);
    console.log(`\n📝 Saved to ${outputPath}`);

    // Also output a summary
    console.log('\n📊 Summary by courseType:');
    const byType = {};
    courses.forEach(c => {
      const type = c.courseType || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

exportCourses();
