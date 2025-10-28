const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';

admin.initializeApp({
  projectId: 'dmaapp-477d4'
});

const db = getFirestore();

async function checkLessons() {
  console.log('📚 Checking all lessons in Firestore...\n');

  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📚 Course: ${courseData.title} (ID: ${courseId})`);
      console.log(`  Lesson count in course doc: ${courseData.lessonCount || 0}`);
      
      // Check lessons subcollection
      const lessonsSnapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
      
      if (!lessonsSnapshot.empty) {
        console.log(`  ✅ Found ${lessonsSnapshot.size} lessons in subcollection:`);
        lessonsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`     - ID: ${doc.id}`);
          console.log(`       Title: ${data.title}`);
          console.log(`       Type: ${data.type}`);
          console.log(`       Has videoUrl: ${!!data.videoUrl}`);
          console.log(`       Has content: ${!!data.content}`);
        });
      } else {
        console.log(`  ❌ No lessons in subcollection`);
      }
      
      // Check modules subcollection
      const modulesSnapshot = await db.collection('courses').doc(courseId).collection('modules').get();
      if (!modulesSnapshot.empty) {
        console.log(`  📦 Found ${modulesSnapshot.size} modules:`);
        for (const moduleDoc of modulesSnapshot.docs) {
          console.log(`     Module: ${moduleDoc.id}`);
          const moduleLessons = await db.collection('courses').doc(courseId)
            .collection('modules').doc(moduleDoc.id)
            .collection('lessons').get();
          if (!moduleLessons.empty) {
            console.log(`       Has ${moduleLessons.size} lessons`);
          }
        }
      }
    }
    
    console.log('\n✨ Check completed!');
    
  } catch (error) {
    console.error('❌ Error checking lessons:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the check
checkLessons();