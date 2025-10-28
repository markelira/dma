const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'dma-67ab7' });
}

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const db = admin.firestore();

async function checkData() {
  try {
    console.log('📋 Checking current data...');
    
    // Get all courses
    const coursesSnap = await db.collection('courses').get();
    console.log('📚 Courses:');
    coursesSnap.docs.forEach(doc => {
      console.log(`  - ${doc.id}: ${doc.data().title}`);
    });
    
    // Get all reviews
    const reviewsSnap = await db.collection('reviews').get();
    console.log('⭐ Reviews:');
    reviewsSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: courseId=${data.courseId}, rating=${data.rating}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData(); 