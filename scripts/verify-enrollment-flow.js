const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
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

async function verifyEnrollmentFlow() {
  console.log('🔍 Verifying complete enrollment flow...\n');
  
  try {
    // Step 1: Sign in
    console.log('Step 1: Sign in as admin@elira.hu');
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@elira.hu', 'admin123');
    const user = userCredential.user;
    console.log('✅ Signed in as:', user.email);
    console.log('   User ID:', user.uid);
    
    // Step 2: Check enrollments for this user
    console.log('\nStep 2: Check user enrollments');
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('userId', '==', user.uid)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    console.log(`✅ Found ${enrollmentsSnapshot.size} enrollment(s)`);
    
    if (enrollmentsSnapshot.size > 0) {
      console.log('\n📚 Enrolled courses:');
      
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        console.log(`\n   Enrollment ID: ${enrollmentDoc.id}`);
        console.log(`   Course ID: ${enrollment.courseId}`);
        console.log(`   Enrolled: ${enrollment.enrolledAt}`);
        console.log(`   Progress: ${enrollment.progress}%`);
        console.log(`   Status: ${enrollment.status}`);
        
        // Step 3: Fetch course details
        const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
        
        if (courseDoc.exists()) {
          const course = courseDoc.data();
          console.log(`   ✅ Course found: ${course.title}`);
          console.log(`      Instructor: ${course.instructorName}`);
          console.log(`      Duration: ${course.duration}`);
          console.log(`      Level: ${course.level}`);
          
          // Step 4: Check lessons
          const lessonsSnapshot = await getDocs(collection(db, 'courses', enrollment.courseId, 'lessons'));
          console.log(`      Lessons: ${lessonsSnapshot.size}`);
          
          if (lessonsSnapshot.size > 0) {
            console.log('      Lesson titles:');
            lessonsSnapshot.docs.forEach(lessonDoc => {
              const lesson = lessonDoc.data();
              console.log(`        - ${lesson.title} (${lesson.duration})`);
            });
          }
        } else {
          console.log('   ❌ Course not found in database');
        }
      }
      
      console.log('\n✅ Enrollment flow verification complete!');
      console.log('🎉 User can now:');
      console.log('   1. See enrolled courses on /dashboard/my-learning');
      console.log('   2. Click "Tanulás megkezdése" to start learning');
      console.log('   3. Navigate to /courses/[courseId]/player to watch lessons');
      
    } else {
      console.log('⚠️ No enrollments found for this user');
      console.log('   User will see: "Még nem kezdtél el egyetlen kurzust sem"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
  
  process.exit(0);
}

verifyEnrollmentFlow();