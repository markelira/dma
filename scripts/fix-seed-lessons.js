const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

admin.initializeApp({
  projectId: 'dmaapp-477d4'
});

const auth = getAuth();
const db = getFirestore();

async function fixLessons() {
  console.log('🔧 Fixing lesson structure...\n');

  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📚 Processing course: ${courseData.title} (${courseId})`);
      
      // Check if lessons exist in the old location
      const lessonsSnapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
      
      if (!lessonsSnapshot.empty) {
        console.log(`Found ${lessonsSnapshot.size} lessons in course ${courseId}`);
        
        // Ensure lessons have proper IDs and structure
        for (const lessonDoc of lessonsSnapshot.docs) {
          const lessonData = lessonDoc.data();
          const lessonId = lessonDoc.id;
          
          // Update lesson with complete data
          const updatedLessonData = {
            ...lessonData,
            id: lessonId,
            courseId: courseId,
            type: lessonData.type || 'video',
            videoUrl: lessonData.videoUrl || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            content: lessonData.content || `<h2>${lessonData.title}</h2><p>${lessonData.description}</p>`,
            resources: lessonData.resources || [],
            published: lessonData.published !== false,
            order: lessonData.order || 0,
            duration: lessonData.duration || '30 perc',
            createdAt: lessonData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          // Update the lesson document
          await db.collection('courses').doc(courseId)
            .collection('lessons').doc(lessonId)
            .set(updatedLessonData, { merge: true });
            
          console.log(`  ✅ Updated lesson: ${lessonData.title} (${lessonId})`);
        }
      } else {
        console.log(`  ⚠️ No lessons found for course ${courseId}, creating sample lessons...`);
        
        // Create sample lessons for courses without them
        const sampleLessons = [
          {
            id: `${courseId}-lesson-1`,
            title: 'Bevezető lecke',
            description: 'Ismerkedés a tananyaggal',
            order: 1,
            duration: '15 perc',
            type: 'video',
            videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            content: '<h2>Bevezető</h2><p>Üdvözöllek a kurzusban! Ebben a leckében megismerjük a főbb témaköröket.</p>',
            published: true,
            courseId: courseId
          },
          {
            id: `${courseId}-lesson-2`,
            title: 'Alapfogalmak',
            description: 'A legfontosabb alapfogalmak áttekintése',
            order: 2,
            duration: '30 perc',
            type: 'video',
            videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            content: '<h2>Alapfogalmak</h2><p>Ebben a részben áttekintjük az alapvető fogalmakat és terminológiát.</p>',
            published: true,
            courseId: courseId
          }
        ];
        
        for (const lesson of sampleLessons) {
          await db.collection('courses').doc(courseId)
            .collection('lessons').doc(lesson.id)
            .set({
              ...lesson,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          console.log(`  ✅ Created lesson: ${lesson.title} (${lesson.id})`);
        }
      }
      
      // Update course with lesson count
      const finalLessonsSnapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
      await db.collection('courses').doc(courseId).update({
        lessonCount: finalLessonsSnapshot.size,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Updated course lesson count: ${finalLessonsSnapshot.size}`);
    }
    
    console.log('\n✨ Lesson structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing lessons:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the fix
fixLessons();