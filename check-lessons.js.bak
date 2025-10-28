const admin = require('firebase-admin');

// Set emulator host
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';

// Initialize admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'elira-67ab7',
  });
}

const db = admin.firestore();

async function checkLessons() {
  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    
    console.log('\n📚 Kurzusok és leckék ellenőrzése:\n');
    console.log('=' .repeat(80));
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      console.log(`\n📖 Kurzus: ${courseData.title}`);
      console.log(`   ID: ${courseDoc.id}`);
      console.log(`   Slug: ${courseData.slug || 'nincs'}`);
      
      // Check modules subcollection
      const modulesSnapshot = await db.collection('courses').doc(courseDoc.id).collection('modules').get();
      
      if (!modulesSnapshot.empty) {
        console.log(`   Modulok száma: ${modulesSnapshot.size}`);
        
        for (const moduleDoc of modulesSnapshot.docs) {
          const moduleData = moduleDoc.data();
          console.log(`\n   📦 Modul: ${moduleData.title}`);
          console.log(`      Modul ID: ${moduleDoc.id}`);
          
          // Check lessons in module subcollection
          const lessonsSnapshot = await db.collection('courses')
            .doc(courseDoc.id)
            .collection('modules')
            .doc(moduleDoc.id)
            .collection('lessons')
            .get();
            
          if (!lessonsSnapshot.empty) {
            console.log(`      Leckék száma: ${lessonsSnapshot.size}`);
            lessonsSnapshot.docs.forEach((lessonDoc, index) => {
              const lessonData = lessonDoc.data();
              console.log(`      📝 Lecke ${index + 1}:`);
              console.log(`         ID: ${lessonDoc.id}`);
              console.log(`         Cím: ${lessonData.title}`);
            });
          } else {
            console.log(`      ❌ Nincsenek leckék a modulban`);
          }
        }
      } else {
        console.log(`   ❌ Nincsenek modulok`);
      }
      
      // Check direct lessons subcollection
      const directLessonsSnapshot = await db.collection('courses').doc(courseDoc.id).collection('lessons').get();
      if (!directLessonsSnapshot.empty) {
        console.log(`\n   📝 Közvetlen leckék (lessons subcollection):`);
        directLessonsSnapshot.docs.forEach((lessonDoc, index) => {
          const lessonData = lessonDoc.data();
          console.log(`      Lecke ${index + 1}: ID=${lessonDoc.id}, Cím=${lessonData.title}`);
        });
      }
      
      console.log('-'.repeat(80));
    }
    
    // Suggest navigation URL for first course
    if (coursesSnapshot.size > 0) {
      const firstCourse = coursesSnapshot.docs[0];
      const firstCourseId = firstCourse.id;
      const modulesSnapshot = await db.collection('courses').doc(firstCourseId).collection('modules').get();
      
      if (!modulesSnapshot.empty) {
        const firstModule = modulesSnapshot.docs[0];
        const lessonsSnapshot = await db.collection('courses')
          .doc(firstCourseId)
          .collection('modules')
          .doc(firstModule.id)
          .collection('lessons')
          .get();
          
        if (!lessonsSnapshot.empty) {
          const firstLesson = lessonsSnapshot.docs[0];
          console.log(`\n\n🎯 Használd ezt az URL-t a teszteléshez:`);
          console.log(`   http://localhost:3000/courses/${firstCourseId}/lessons/${firstLesson.id}\n`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

checkLessons();