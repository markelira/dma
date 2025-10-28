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

async function createTestCourse() {
  console.log('🔧 Creating test course...\n');
  
  try {
    const courseId = 'TRfv3TEqlIbXEdalMvEq';
    
    const courseData = {
      id: courseId,
      title: 'React Fejlesztés Alapjai',
      description: 'Tanulj meg React alkalmazásokat fejleszteni a kezdetektől. Ez a kurzus végigvezet a React alapjain, komponenseken, state kezelésen és modern fejlesztési gyakorlatokon.',
      slug: 'react-fejlesztes-alapjai',
      price: 0,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      instructorName: 'Kiss János',
      instructorId: 'instructor123',
      duration: '8 óra',
      level: 'BEGINNER',
      status: 'PUBLISHED',
      category: {
        id: 'programming',
        name: 'Programozás'
      },
      rating: 4.8,
      reviewCount: 125,
      enrollmentCount: 342,
      language: 'hu',
      certificateEnabled: true,
      learningOutcomes: [
        'React komponensek létrehozása és használata',
        'State és props kezelése',
        'React Hooks használata',
        'Routing és navigáció implementálása',
        'API integrációk megvalósítása'
      ],
      prerequisites: [
        'JavaScript alapismeretek',
        'HTML és CSS alapok',
        'Node.js és npm használata'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📝 Creating course with ID:', courseId);
    console.log('📊 Course data:', courseData);
    
    // Create course
    await db.collection('courses').doc(courseId).set(courseData);
    
    console.log('✅ Course created successfully!');
    
    // Create some lessons for the course
    const lessons = [
      {
        id: 'lesson1',
        title: 'Bevezetés a React világába',
        description: 'Ismerkedj meg a React alapjaival és telepítsd a fejlesztői környezetet',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8',
        duration: '45 perc',
        order: 1,
        isFree: true
      },
      {
        id: 'lesson2',
        title: 'Komponensek és JSX',
        description: 'Tanulj meg komponenseket létrehozni és JSX-et használni',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8',
        duration: '60 perc',
        order: 2,
        isFree: false
      },
      {
        id: 'lesson3',
        title: 'State és Props',
        description: 'Megérteni a state és props koncepciókat',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8',
        duration: '55 perc',
        order: 3,
        isFree: false
      },
      {
        id: 'lesson4',
        title: 'React Hooks',
        description: 'useState, useEffect és egyéb hooks használata',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8',
        duration: '70 perc',
        order: 4,
        isFree: false
      },
      {
        id: 'lesson5',
        title: 'Routing és Navigáció',
        description: 'React Router használata és többoldalas alkalmazások',
        videoUrl: 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8',
        duration: '65 perc',
        order: 5,
        isFree: false
      }
    ];
    
    console.log('\n📝 Creating lessons...');
    
    const batch = db.batch();
    
    for (const lesson of lessons) {
      const lessonRef = db.collection('courses').doc(courseId).collection('lessons').doc(lesson.id);
      batch.set(lessonRef, {
        ...lesson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    await batch.commit();
    
    console.log('✅ Lessons created successfully!');
    
    // Verify course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    
    if (courseDoc.exists) {
      console.log('\n✅ Course verified in Firestore');
      console.log('📊 Title:', courseDoc.data().title);
      console.log('📊 Status:', courseDoc.data().status);
    }
    
    // Count lessons
    const lessonsSnapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
    console.log('📊 Total lessons:', lessonsSnapshot.size);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createTestCourse();