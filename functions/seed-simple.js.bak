const admin = require('firebase-admin');

// Initialize Firebase Admin with emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'elira-67ab7',
  });
}

// Set Firestore to use emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const db = admin.firestore();

// Test data
const categories = [
  { name: 'Webfejlesztés', description: 'Modern webalkalmazások fejlesztése' },
  { name: 'Digitális Marketing', description: 'Online marketing stratégiák' },
  { name: 'AI és Gépi Tanulás', description: 'Mesterséges intelligencia alapjai' },
  { name: 'Adatelemzés', description: 'Adatok elemzése és vizualizálása' },
  { name: 'Mobilfejlesztés', description: 'iOS és Android alkalmazások' },
];

const universities = [
  { name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem', description: 'Magyarország vezető műszaki egyeteme' },
  { name: 'Eötvös Loránd Tudományegyetem', description: 'Magyarország legnagyobb egyeteme' },
  { name: 'Corvinus Egyetem', description: 'Gazdaságtudományi képzés' },
];

const courses = [
  {
    title: 'React.js Alapok',
    description: 'Modern webalkalmazások fejlesztése React.js-szel',
    priceHUF: 29900,
    duration: '8 óra',
    difficulty: 'BEGINNER',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: false,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
  },
  {
    title: 'Python Adatelemzés',
    description: 'Adatelemzés Python-ban pandas és numpy használatával',
    priceHUF: 39900,
    duration: '12 óra',
    difficulty: 'INTERMEDIATE',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: true,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
  },
  {
    title: 'Digitális Marketing Alapok',
    description: 'A digitális marketing világának bemutatása',
    priceHUF: 24900,
    duration: '6 óra',
    difficulty: 'BEGINNER',
    language: 'hu',
    status: 'PUBLISHED',
    isPlus: false,
    certificateEnabled: true,
    instructorId: 'dev-admin-user',
  },
];

const reviews = [
  {
    userId: 'dev-admin-user',
    rating: 5,
    comment: 'Kiváló kurzus! A React.js alapok nagyon jól elmagyarázva.',
    isApproved: true,
  },
  {
    userId: 'dev-admin-user',
    rating: 4,
    comment: 'A Python adatelemzés kurzus segített megérteni a pandas használatát.',
    isApproved: true,
  },
  {
    userId: 'dev-admin-user',
    rating: 5,
    comment: 'A digitális marketing kurzus alapvetően megváltoztatta a gondolkodásom.',
    isApproved: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    
    const collections = ['categories', 'universities', 'courses', 'reviews'];
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    console.log('✅ Existing data cleared');

    // Create categories
    console.log('📚 Creating categories...');
    const categoryRefs = [];
    for (const category of categories) {
      const docRef = db.collection('categories').doc();
      categoryRefs.push(docRef);
      await docRef.set({
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${categories.length} categories`);

    // Create universities
    console.log('🏛️ Creating universities...');
    const universityRefs = [];
    for (const university of universities) {
      const docRef = db.collection('universities').doc();
      universityRefs.push(docRef);
      await docRef.set({
        ...university,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${universities.length} universities`);

    // Create courses
    console.log('📖 Creating courses...');
    const courseRefs = [];
    for (let i = 0; i < courses.length; i++) {
      const course = { ...courses[i] };
      course.categoryId = categoryRefs[i % categoryRefs.length].id;
      course.universityId = universityRefs[i % universityRefs.length].id;
      
      const courseRef = await db.collection('courses').add({
        ...course,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      courseRefs.push(courseRef);
    }
    console.log(`✅ Created ${courses.length} courses`);

    // Create reviews
    console.log('⭐ Creating reviews...');
    for (let i = 0; i < reviews.length; i++) {
      const review = { ...reviews[i] };
      review.courseId = courseRefs[i % courseRefs.length].id;
      
      await db.collection('reviews').add({
        ...review,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${reviews.length} reviews`);

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ seedDatabase error:', error);
  }
}

seed(); 