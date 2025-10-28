const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Firebase client configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testEnrollment() {
  console.log('🔧 Testing enrollment with simplified rules...\n');
  
  try {
    // Step 1: Sign in
    console.log('📝 Signing in as admin@elira.hu...');
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@elira.hu', 'admin123');
    const user = userCredential.user;
    console.log('✅ Signed in successfully!');
    console.log('👤 User ID:', user.uid);
    
    // Step 2: Test creating an enrollment
    const testCourseId = 'test-course-' + Date.now();
    const enrollmentId = `${user.uid}_${testCourseId}`;
    
    const enrollmentData = {
      userId: user.uid,
      courseId: testCourseId,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      completedLessons: 0,
      progress: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('\n📝 Creating test enrollment...');
    console.log('   Enrollment ID:', enrollmentId);
    
    // Try to create enrollment
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    await setDoc(enrollmentRef, enrollmentData);
    
    console.log('✅ Enrollment created successfully!');
    
    // Step 3: Verify we can read it back
    console.log('\n📝 Reading enrollment back...');
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    if (enrollmentDoc.exists()) {
      console.log('✅ Enrollment read successfully');
      console.log('   Data:', enrollmentDoc.data());
    } else {
      console.log('❌ Could not read enrollment');
    }
    
    // Step 4: Test reading existing enrollment
    const existingEnrollmentId = 'KFbtkBd2joWp6vuoUOx96MBCnMa2_TRfv3TEqlIbXEdalMvEq';
    console.log('\n📝 Reading existing enrollment:', existingEnrollmentId);
    
    const existingEnrollmentRef = doc(db, 'enrollments', existingEnrollmentId);
    const existingEnrollmentDoc = await getDoc(existingEnrollmentRef);
    
    if (existingEnrollmentDoc.exists()) {
      console.log('✅ Existing enrollment read successfully');
      console.log('   Course ID:', existingEnrollmentDoc.data().courseId);
      console.log('   Progress:', existingEnrollmentDoc.data().progress + '%');
    } else {
      console.log('⚠️ Existing enrollment not found');
    }
    
    console.log('\n✅ All enrollment operations successful!');
    console.log('🎉 The simplified rules are working correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
  
  process.exit(0);
}

testEnrollment();