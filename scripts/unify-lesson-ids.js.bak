const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';

admin.initializeApp({
  projectId: 'elira-67ab7'
});

const db = getFirestore();

async function unifyLessonIds() {
  console.log('🔧 Unifying lesson IDs...\n');

  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📚 Processing course: ${courseData.title} (ID: ${courseId})`);
      
      // Get lessons in subcollection
      const lessonsSnapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
      
      if (!lessonsSnapshot.empty) {
        const lessons = [];
        lessonsSnapshot.docs.forEach(doc => {
          lessons.push({ id: doc.id, data: doc.data() });
        });
        
        // Sort lessons by order or by existing ID pattern
        lessons.sort((a, b) => {
          const orderA = a.data.order || parseInt(a.id.match(/\d+$/)?.[0] || '0');
          const orderB = b.data.order || parseInt(b.id.match(/\d+$/)?.[0] || '0');
          return orderA - orderB;
        });
        
        console.log(`  Found ${lessons.length} lessons to process`);
        
        // Delete old lessons and create with unified IDs
        const batch = db.batch();
        
        // Delete old documents
        for (const lesson of lessons) {
          if (lesson.id !== `lesson-${lesson.data.order || lessons.indexOf(lesson) + 1}`) {
            console.log(`  Deleting old lesson: ${lesson.id}`);
            batch.delete(db.collection('courses').doc(courseId).collection('lessons').doc(lesson.id));
          }
        }
        
        // Commit deletions first
        await batch.commit();
        
        // Create new documents with unified IDs
        const newBatch = db.batch();
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const newId = `lesson-${i + 1}`;
          const newData = {
            ...lesson.data,
            id: newId,
            order: i + 1,
            courseId: courseId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          console.log(`  ✅ Creating lesson with unified ID: ${newId} (${lesson.data.title})`);
          newBatch.set(
            db.collection('courses').doc(courseId).collection('lessons').doc(newId),
            newData
          );
        }
        
        // Commit new documents
        await newBatch.commit();
        
        // Update course with correct lesson count
        await db.collection('courses').doc(courseId).update({
          lessonCount: lessons.length,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`  ✅ Unified ${lessons.length} lessons for course ${courseId}`);
      }
    }
    
    console.log('\n✨ Lesson IDs unified successfully!');
    
  } catch (error) {
    console.error('❌ Error unifying lesson IDs:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the unification
unifyLessonIds();