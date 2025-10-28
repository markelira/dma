const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp({
    projectId: 'dma-67ab7',
  });
}

const db = getFirestore();

// Set Firestore to use emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Test data
const testCategories = [
  {
    name: 'Webfejlesztés',
    description: 'Modern webalkalmazások fejlesztése és karbantartása',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Digitális Marketing',
    description: 'Online marketing stratégiák és eszközök',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'AI és Gépi Tanulás',
    description: 'Mesterséges intelligencia és gépi tanulás alapjai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Adatelemzés',
    description: 'Adatok elemzése és vizualizálása',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Mobilfejlesztés',
    description: 'iOS és Android alkalmazások fejlesztése',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const testUniversities = [
  {
    name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem',
    description: 'Magyarország vezető műszaki egyeteme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Eötvös Loránd Tudományegyetem',
    description: 'Magyarország legnagyobb egyeteme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Corvinus Egyetem',
    description: 'Gazdaságtudományi és társadalomtudományi képzés',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const testCourses = [
  {
    title: 'React.js Alapok',
    description: 'Modern webalkalmazások fejlesztése React.js-szel. Megtanulod a komponens-alapú fejlesztést, a state kezelést és a legfrissebb React hook-okat.',
    priceHUF: 29900,
    duration: '8 óra',
    difficulty: 'BEGINNER',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: false,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: 'Python Adatelemzés',
    description: 'Adatelemzés Python-ban pandas, numpy és matplotlib használatával. Valós adatokkal dolgozunk és megtanuljuk az adatok vizualizálását.',
    priceHUF: 39900,
    duration: '12 óra',
    difficulty: 'INTERMEDIATE',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: true,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: 'Digitális Marketing Alapok',
    description: 'A digitális marketing világának bemutatása. Megtanuljuk a SEO, PPC, közösségi média marketing és email marketing alapjait.',
    priceHUF: 24900,
    duration: '6 óra',
    difficulty: 'BEGINNER',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: false,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: 'Machine Learning Alapok',
    description: 'Gépi tanulás alapelvei és gyakorlati alkalmazások. Megtanuljuk a különböző algoritmusokat és valós problémákat oldunk meg.',
    priceHUF: 49900,
    duration: '15 óra',
    difficulty: 'ADVANCED',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: true,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: 'iOS Fejlesztés Swift-tel',
    description: 'iPhone és iPad alkalmazások fejlesztése Swift programozási nyelvvel. Megtanuljuk az iOS SDK használatát és az App Store-ra való feltöltést.',
    priceHUF: 44900,
    duration: '10 óra',
    difficulty: 'INTERMEDIATE',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: true,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const testReviews = [
  {
    userId: 'dev-admin-user',
    rating: 5,
    comment: 'Kiváló kurzus! A React.js alapok nagyon jól elmagyarázva, gyakorlati példákkal. Mindenképpen ajánlom!',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'dev-admin-user',
    rating: 4,
    comment: 'A Python adatelemzés kurzus segített megérteni a pandas és numpy használatát. Valós projektekkel dolgoztunk.',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'dev-admin-user',
    rating: 5,
    comment: 'A digitális marketing kurzus alapvetően megváltoztatta a gondolkodásom a marketingről. Nagyon hasznos!',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'dev-admin-user',
    rating: 4,
    comment: 'A Machine Learning kurzus kihívás volt, de nagyon informatív. Az algoritmusok gyakorlati alkalmazását jól mutatta be.',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'dev-admin-user',
    rating: 5,
    comment: 'Az iOS fejlesztés kurzus segített létrehozni az első alkalmazásomat. A Swift nyelv nagyon jól elmagyarázva.',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    
    const categoriesSnapshot = await db.collection('categories').get();
    const categoryBatch = db.batch();
    categoriesSnapshot.docs.forEach(doc => {
      categoryBatch.delete(doc.ref);
    });
    await categoryBatch.commit();

    const universitiesSnapshot = await db.collection('universities').get();
    const universityBatch = db.batch();
    universitiesSnapshot.docs.forEach(doc => {
      universityBatch.delete(doc.ref);
    });
    await universityBatch.commit();

    const coursesSnapshot = await db.collection('courses').get();
    const courseBatch = db.batch();
    coursesSnapshot.docs.forEach(doc => {
      courseBatch.delete(doc.ref);
    });
    await courseBatch.commit();

    const reviewsSnapshot = await db.collection('reviews').get();
    const reviewBatch = db.batch();
    reviewsSnapshot.docs.forEach(doc => {
      reviewBatch.delete(doc.ref);
    });
    await reviewBatch.commit();

    console.log('✅ Existing data cleared');

    // Create categories
    console.log('📚 Creating categories...');
    const categoryRefs = [];
    for (const category of testCategories) {
      const docRef = db.collection('categories').doc();
      categoryRefs.push(docRef);
      await docRef.set(category);
    }
    console.log(`✅ Created ${testCategories.length} categories`);

    // Create universities
    console.log('🏛️ Creating universities...');
    const universityRefs = [];
    for (const university of testUniversities) {
      const docRef = db.collection('universities').doc();
      universityRefs.push(docRef);
      await docRef.set(university);
    }
    console.log(`✅ Created ${testUniversities.length} universities`);

    // Create courses with proper references
    console.log('📖 Creating courses...');
    const courseRefs = [];
    for (let i = 0; i < testCourses.length; i++) {
      const course = { ...testCourses[i] };
      
      // Assign category (cycle through categories)
      course.categoryId = categoryRefs[i % categoryRefs.length].id;
      
      // Assign university (cycle through universities)
      course.universityId = universityRefs[i % universityRefs.length].id;
      
      const courseRef = await db.collection('courses').add(course);
      courseRefs.push(courseRef);
    }
    console.log(`✅ Created ${testCourses.length} courses`);

    // Create reviews with proper references
    console.log('⭐ Creating reviews...');
    for (let i = 0; i < testReviews.length; i++) {
      const review = { ...testReviews[i] };
      
      // Assign course (cycle through courses)
      review.courseId = courseRefs[i % courseRefs.length].id;
      
      await db.collection('reviews').add(review);
    }
    console.log(`✅ Created ${testReviews.length} reviews`);

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ seedDatabase error:', error);
  }
}

seedDatabase(); 