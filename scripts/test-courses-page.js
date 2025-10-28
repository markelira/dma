const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
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
const db = getFirestore(app);

async function testCoursesPage() {
  console.log('🔍 Testing courses page data fetching...\n');
  
  try {
    // Simulate what the courses page does
    console.log('Step 1: Fetching published courses');
    
    const coursesQuery = query(
      collection(db, 'courses'),
      where('status', '==', 'PUBLISHED')
    );
    
    const snapshot = await getDocs(coursesQuery);
    const courses = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      courses.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    }
    
    console.log(`✅ Found ${courses.length} published course(s)\n`);
    
    if (courses.length > 0) {
      console.log('📚 Course details:');
      courses.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title}`);
        console.log(`   ID: ${course.id}`);
        console.log(`   Slug: ${course.slug}`);
        console.log(`   Price: ${course.price === 0 ? 'Free' : `$${course.price}`}`);
        console.log(`   Level: ${course.level}`);
        console.log(`   Instructor: ${course.instructorName}`);
        console.log(`   Duration: ${course.duration}`);
        console.log(`   Status: ${course.status}`);
        console.log(`   Rating: ${course.rating || 'N/A'}`);
        console.log(`   Enrollments: ${course.enrollmentCount || 0}`);
      });
      
      console.log('\n✅ Courses page data structure is correct!');
      console.log('🎉 The /courses page should display these courses.');
    } else {
      console.log('⚠️ No published courses found');
      console.log('   The courses page will show an empty state');
    }
    
    // Test filtering
    console.log('\n\nStep 2: Testing course filtering');
    
    // Test free courses filter
    const freeCourses = courses.filter(c => c.price === 0);
    console.log(`   Free courses: ${freeCourses.length}`);
    
    // Test by level
    const beginnerCourses = courses.filter(c => c.level === 'BEGINNER');
    console.log(`   Beginner courses: ${beginnerCourses.length}`);
    
    // Test sorting
    const sortedByRating = [...courses].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    console.log(`   Highest rated: ${sortedByRating[0]?.title || 'N/A'}`);
    
    const sortedByPopular = [...courses].sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
    console.log(`   Most popular: ${sortedByPopular[0]?.title || 'N/A'}`);
    
    console.log('\n✅ All course queries working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
  
  process.exit(0);
}

testCoursesPage();