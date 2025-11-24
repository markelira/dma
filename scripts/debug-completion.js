const admin = require('firebase-admin');
const serviceAccount = require('../dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'dmaapp-477d4'
  });
}

const db = admin.firestore();

async function check() {
  // Check course qAigRekPAze7NvHtt0Um (where progress was saved)
  const courseDoc = await db.collection('courses').doc('qAigRekPAze7NvHtt0Um').get();
  console.log('Course with progress (qAigRekPAze7NvHtt0Um):');
  const data = courseDoc.data();
  console.log('  title:', data?.title);
  console.log('  courseType:', data?.courseType);
  console.log('  modules count:', data?.modules?.length || 0);
  console.log('  lessonCount field:', data?.lessonCount);
  console.log('  flatLessons:', data?.flatLessons?.length || 0);

  // Check for lessons subcollection
  const lessonsSubcoll = await db.collection('courses').doc('qAigRekPAze7NvHtt0Um').collection('lessons').get();
  console.log('  lessons subcollection:', lessonsSubcoll.size);

  // Total lessons from modules
  let totalLessons = 0;
  if (data?.modules) {
    data.modules.forEach(m => {
      totalLessons += m.lessons?.length || 0;
    });
  }
  console.log('  total lessons from modules:', totalLessons);

  console.log('\n--- This explains why progress update failed ---');
  console.log('The course uses flat lessons/subcollection, not modules array!');
  console.log('useLessonProgress.ts uses modules.reduce() which returns 0');
}

check().then(() => process.exit(0));
