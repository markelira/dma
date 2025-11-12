const admin = require('firebase-admin');
const path = require('path');

const projectId = 'dmaapp-477d4';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  } catch (error) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
    } catch (appDefaultError) {
      console.error('Could not initialize Firebase Admin');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function fixEnrollmentDates() {
  const enrollmentId = 'p32LB6NXiSS9DJJiLp6490o2GYr1_q9tZIC56NPMcGHTuRYxO';

  console.log('\n🔧 FIXING ENROLLMENT DATES');
  console.log('='.repeat(80));
  console.log(`Enrollment ID: ${enrollmentId}\n`);

  try {
    // Get enrollment document
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const enrollmentDoc = await enrollmentRef.get();

    if (!enrollmentDoc.exists) {
      console.log('❌ Enrollment document not found');
      process.exit(1);
    }

    const enrollmentData = enrollmentDoc.data();
    console.log('Current enrollment data:');
    console.log('  enrolledAt:', enrollmentData.enrolledAt);
    console.log('  lastAccessedAt:', enrollmentData.lastAccessedAt);
    console.log('  createdAt:', enrollmentData.createdAt);
    console.log('  updatedAt:', enrollmentData.updatedAt);

    // Convert ISO strings to Firestore Timestamps
    const now = admin.firestore.Timestamp.now();

    await enrollmentRef.update({
      enrolledAt: now,
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now
    });

    console.log('\n✅ Enrollment dates converted to Firestore Timestamps');
    console.log('   All date fields updated to current timestamp');
    console.log('\n🎉 SUCCESS! Enrollment should now display correctly in dashboard');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixEnrollmentDates()
  .then(() => {
    console.log('\n✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
