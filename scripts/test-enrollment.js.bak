const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../secure/elira-67ab7-firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'elira-67ab7'
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    admin.initializeApp({
      projectId: 'elira-67ab7'
    });
  }
}

const db = admin.firestore();

async function testEnrollment() {
  console.log('🔧 Testing enrollment creation...\n');
  
  try {
    // Test enrollment data
    const testEnrollment = {
      userId: 'KFbtkBd2joWp6vuoUOx96MBCnMa2', // admin@elira.hu user ID
      courseId: 'TRfv3TEqlIbXEdalMvEq',
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      completedLessons: 0,
      progress: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const enrollmentId = `${testEnrollment.userId}_${testEnrollment.courseId}`;
    
    console.log('📝 Creating enrollment with ID:', enrollmentId);
    console.log('📊 Enrollment data:', testEnrollment);
    
    // Create enrollment
    await db.collection('enrollments').doc(enrollmentId).set(testEnrollment);
    
    console.log('✅ Enrollment created successfully!');
    
    // Verify enrollment
    const enrollmentDoc = await db.collection('enrollments').doc(enrollmentId).get();
    
    if (enrollmentDoc.exists) {
      console.log('✅ Enrollment verified in Firestore');
      console.log('📊 Stored data:', enrollmentDoc.data());
    } else {
      console.log('❌ Enrollment not found after creation');
    }
    
    // Check course exists
    const courseDoc = await db.collection('courses').doc(testEnrollment.courseId).get();
    
    if (courseDoc.exists) {
      console.log('✅ Course exists:', courseDoc.data().title);
    } else {
      console.log('⚠️ Course not found, creating mock course...');
      
      // Create mock course
      await db.collection('courses').doc(testEnrollment.courseId).set({
        id: testEnrollment.courseId,
        title: 'React Fejlesztés Alapjai',
        description: 'Tanulj meg React alkalmazásokat fejleszteni a kezdetektől.',
        price: 0,
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
        instructorName: 'Kiss János',
        duration: '8 óra',
        level: 'BEGINNER',
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Mock course created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testEnrollment();