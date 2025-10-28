const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../secure/dmaapp-477d4-firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'dmaapp-477d4'
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    admin.initializeApp({
      projectId: 'dmaapp-477d4'
    });
  }
}

const db = admin.firestore();

async function checkCourse() {
  try {
    // The actual course ID that was created
    const courseId = 'TRfv3TEqlIbXEdalMvEq';
    
    // Check main course
    const courseDoc = await db.collection('courses').doc(courseId).get();
    
    if (courseDoc.exists) {
      console.log('✅ Course found!');
      console.log('  ID:', courseDoc.id);
      console.log('  Title:', courseDoc.data().title);
      console.log('  Slug:', courseDoc.data().slug);
      console.log('  Status:', courseDoc.data().status);
    } else {
      console.log('❌ Course NOT found with ID:', courseId);
    }
    
    // Check lessons
    const lessonsSnapshot = await db.collection('courses')
      .doc(courseId)
      .collection('lessons')
      .get();
      
    console.log('\n📚 Lessons found:', lessonsSnapshot.size);
    
    lessonsSnapshot.forEach(doc => {
      console.log(`  - ${doc.id}: ${doc.data().title}`);
    });
    
    // Also check if we can find course by slug
    console.log('\n🔍 Searching for course by slug...');
    const coursesBySlug = await db.collection('courses')
      .where('slug', '==', 'react-fejlesztes-alapjai')
      .get();
      
    if (!coursesBySlug.empty) {
      console.log('✅ Found course by slug!');
      coursesBySlug.forEach(doc => {
        console.log('  ID:', doc.id);
        console.log('  Title:', doc.data().title);
      });
    } else {
      console.log('❌ No course found with slug: react-fejlesztes-alapjai');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkCourse();