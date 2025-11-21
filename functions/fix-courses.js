const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCourses() {
  console.log('🔍 Checking courses...');

  const coursesSnapshot = await db.collection('courses').get();

  console.log(`Found ${coursesSnapshot.size} courses`);

  for (const doc of coursesSnapshot.docs) {
    const data = doc.data();
    if (data.deletedAt) {
      console.log(`Found soft-deleted course: ${doc.id} - ${data.title}`);
      console.log(`  deletedAt field exists`);

      // Remove deletedAt field
      await doc.ref.update({
        deletedAt: admin.firestore.FieldValue.delete()
      });

      console.log(`✅ Removed deletedAt from course: ${doc.id}`);
    } else {
      console.log(`✓ Course ${doc.id} - ${data.title || 'Untitled'} is active (status: ${data.status})`);
    }
  }

  console.log('✅ Done!');
  process.exit(0);
}

fixCourses().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
