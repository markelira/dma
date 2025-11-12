const admin = require('firebase-admin');
const path = require('path');

const projectId = 'dmaapp-477d4';
const courseId = 'q9tZIC56NPMcGHTuRYxO';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  } catch (error) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
    } catch (appDefaultError) {
      console.error('Could not initialize Firebase Admin');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function inspectCourseStructure() {
  console.log('\n🔍 INSPECTING COURSE STRUCTURE');
  console.log('='.repeat(80));
  console.log(`Course ID: ${courseId}\n`);

  try {
    // 1. Get course document
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      console.log('❌ Course document not found');
      process.exit(1);
    }

    const courseData = courseDoc.data();
    console.log('📄 Course Document:');
    console.log('   Title:', courseData.title);
    console.log('   Status:', courseData.status);
    console.log('   Created:', courseData.createdAt);
    console.log('   Has modules field?:', courseData.modules ? 'YES' : 'NO');
    if (courseData.modules) {
      console.log('   Modules in document:', JSON.stringify(courseData.modules, null, 2));
    }
    console.log('   Has lessons field?:', courseData.lessons ? 'YES' : 'NO');
    if (courseData.lessons) {
      console.log('   Lessons in document:', JSON.stringify(courseData.lessons, null, 2));
    }

    // 2. Check modules subcollection
    console.log('\n📁 Checking modules subcollection:');
    const modulesSnapshot = await courseRef.collection('modules').get();
    console.log(`   Found ${modulesSnapshot.size} modules`);

    if (!modulesSnapshot.empty) {
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleData = moduleDoc.data();
        console.log(`\n   Module ID: ${moduleDoc.id}`);
        console.log('   Module Data:', JSON.stringify(moduleData, null, 2));

        // Check lessons in this module
        const lessonsSnapshot = await moduleDoc.ref.collection('lessons').get();
        console.log(`   Lessons in this module: ${lessonsSnapshot.size}`);

        if (!lessonsSnapshot.empty) {
          for (const lessonDoc of lessonsSnapshot.docs) {
            console.log(`\n      Lesson ID: ${lessonDoc.id}`);
            console.log('      Lesson Data:', JSON.stringify(lessonDoc.data(), null, 2));
          }
        }
      }
    }

    // 3. Check direct lessons subcollection
    console.log('\n📁 Checking direct lessons subcollection:');
    const lessonsSnapshot = await courseRef.collection('lessons').get();
    console.log(`   Found ${lessonsSnapshot.size} lessons`);

    if (!lessonsSnapshot.empty) {
      for (const lessonDoc of lessonsSnapshot.docs) {
        console.log(`\n   Lesson ID: ${lessonDoc.id}`);
        console.log('   Lesson Data:', JSON.stringify(lessonDoc.data(), null, 2));
      }
    }

    // 4. Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log('Course document has modules field?:', courseData.modules ? 'YES' : 'NO');
    console.log('Course document has lessons field?:', courseData.lessons ? 'YES' : 'NO');
    console.log('Modules subcollection size:', modulesSnapshot.size);
    console.log('Direct lessons subcollection size:', lessonsSnapshot.size);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

inspectCourseStructure()
  .then(() => {
    console.log('\n✅ Inspection complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
