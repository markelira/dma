const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'dmaapp-477d4'
});

const db = admin.firestore();

async function checkLesson() {
  const courseId = 'q9tZIC56NPMcGHTuRYxO';
  const lessonId = 'X2xb5EQpbiWFfTrNA70R';
  
  console.log('Checking lesson:', lessonId);
  
  let lessonDoc = await db.collection('courses').doc(courseId).collection('lessons').doc(lessonId).get();
  
  if (!lessonDoc.exists) {
    const modules = await db.collection('courses').doc(courseId).collection('modules').get();
    
    for (const moduleDoc of modules.docs) {
      lessonDoc = await db.collection('courses').doc(courseId).collection('modules').doc(moduleDoc.id).collection('lessons').doc(lessonId).get();
      if (lessonDoc.exists) {
        console.log('Found in module:', moduleDoc.id);
        break;
      }
    }
  }
  
  if (lessonDoc.exists) {
    const data = lessonDoc.data();
    console.log('\nLesson data:');
    console.log('- Title:', data.title);
    console.log('- Type:', data.type);
    console.log('- muxPlaybackId:', data.muxPlaybackId || 'NOT SET');
    console.log('- muxAssetId:', data.muxAssetId || 'NOT SET');
    console.log('- videoUrl:', data.videoUrl ? data.videoUrl.substring(0, 80) + '...' : 'NOT SET');
  } else {
    console.log('Lesson not found!');
  }
  
  process.exit(0);
}

checkLesson().catch(console.error);
