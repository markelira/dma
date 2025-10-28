const admin = require('firebase-admin');

// Set emulator host
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';

// Initialize admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'dma-67ab7',
  });
}

const db = admin.firestore();

async function listCourses() {
  try {
    const coursesSnapshot = await db.collection('courses').get();
    
    console.log('\n📚 Elérhető kurzusok:\n');
    console.log('=' .repeat(80));
    
    coursesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Cím: ${data.title}`);
      console.log(`   Ár: ${data.priceHUF} Ft`);
      console.log(`   Időtartam: ${data.duration}`);
      console.log(`   Státusz: ${data.status}`);
      console.log('-'.repeat(80));
    });
    
    console.log(`\n✅ Összesen ${coursesSnapshot.size} kurzus található\n`);
    
    // Pick the first course for testing
    if (coursesSnapshot.size > 0) {
      const firstCourse = coursesSnapshot.docs[0];
      console.log(`\n🎯 Teszteléshez használd ezt az URL-t:`);
      console.log(`   http://localhost:3000/courses/${firstCourse.id}/lessons/lesson-1\n`);
    }
    
  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

listCourses();