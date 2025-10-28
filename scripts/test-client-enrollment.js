const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, collection } = require('firebase/firestore');
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

async function testClientEnrollment() {
  console.log('🔧 Testing client-side enrollment...\n');
  
  try {
    // Sign in as a test user
    console.log('📝 Signing in as admin@elira.hu...');
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@elira.hu', 'admin123');
    const user = userCredential.user;
    console.log('✅ Signed in successfully!');
    console.log('👤 User ID:', user.uid);
    console.log('📧 Email:', user.email);
    
    // Test enrollment data
    const courseId = 'TRfv3TEqlIbXEdalMvEq';
    const enrollmentId = `${user.uid}_${courseId}`;
    
    const enrollmentData = {
      userId: user.uid,
      courseId: courseId,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      completedLessons: 0,
      progress: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('\n📝 Creating enrollment with ID:', enrollmentId);
    console.log('📊 Enrollment data:', enrollmentData);
    
    // Try to create enrollment
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    await setDoc(enrollmentRef, enrollmentData);
    
    console.log('✅ Enrollment created successfully!');
    
    // Verify enrollment
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    if (enrollmentDoc.exists()) {
      console.log('✅ Enrollment verified in Firestore');
      console.log('📊 Stored data:', enrollmentDoc.data());
    } else {
      console.log('❌ Enrollment not found after creation');
    }
    
    // Check if course exists
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (courseDoc.exists()) {
      console.log('✅ Course exists:', courseDoc.data().title);
    } else {
      console.log('⚠️ Course not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('❌ Error code:', error.code);
    }
  }
  
  process.exit(0);
}

testClientEnrollment();