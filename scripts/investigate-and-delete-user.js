const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  projectId: 'dmaapp-477d4'
});

const db = admin.firestore();
const auth = admin.auth();
const userId = 'SH8pQI3lEuYdt24C3ZfsfnkFEDI2';

async function investigate() {
  console.log('=== Investigating user:', userId, '===\n');

  let email = null;

  // Check Auth
  try {
    const authUser = await auth.getUser(userId);
    email = authUser.email;
    console.log('✅ Auth user exists:', authUser.email);
    console.log('   Created:', authUser.metadata.creationTime);
    console.log('   Last sign in:', authUser.metadata.lastSignInTime);
  } catch (e) {
    console.log('❌ Auth user not found');
  }

  // Check Firestore user doc
  const userDoc = await db.collection('users').doc(userId).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('\n✅ Firestore user doc exists');
    console.log('   Email:', data.email);
    console.log('   Name:', data.firstName, data.lastName);
    console.log('   Role:', data.role);
    console.log('   CompanyId:', data.companyId || 'NINCS');
    console.log('   SubscriptionStatus:', data.subscriptionStatus || 'NINCS');
  } else {
    console.log('\n❌ Firestore user doc not found');
  }

  // Check subscriptions
  const subs = await db.collection('subscriptions').where('userId', '==', userId).get();
  if (subs.empty === false) {
    console.log('\n✅ Subscriptions found:', subs.size);
    subs.forEach(doc => {
      const data = doc.data();
      console.log('   - ID:', doc.id);
      console.log('     Status:', data.status);
      console.log('     Plan:', data.planName || data.plan);
    });
  } else {
    console.log('\n❌ No subscriptions');
  }

  // Check enrollments
  const enrollments = await db.collection('enrollments').where('userId', '==', userId).get();
  console.log('\n📚 Enrollments:', enrollments.size);

  // Check lesson progress
  const progress = await db.collection('lessonProgress').where('userId', '==', userId).get();
  console.log('📊 Lesson progress records:', progress.size);

  return email;
}

async function deleteUser() {
  console.log('\n\n=== DELETING USER ===\n');

  // Delete from Auth
  try {
    await auth.deleteUser(userId);
    console.log('✅ Auth user deleted');
  } catch (e) {
    console.log('⚠️ Auth deletion failed:', e.message);
  }

  // Delete Firestore user doc
  try {
    await db.collection('users').doc(userId).delete();
    console.log('✅ Firestore user doc deleted');
  } catch (e) {
    console.log('⚠️ Firestore user deletion failed:', e.message);
  }

  // Delete enrollments
  const enrollments = await db.collection('enrollments').where('userId', '==', userId).get();
  for (const doc of enrollments.docs) {
    await doc.ref.delete();
  }
  console.log('✅ Deleted', enrollments.size, 'enrollments');

  // Delete lesson progress
  const progress = await db.collection('lessonProgress').where('userId', '==', userId).get();
  for (const doc of progress.docs) {
    await doc.ref.delete();
  }
  console.log('✅ Deleted', progress.size, 'lesson progress records');

  // Anonymize subscriptions (keep for billing)
  const subs = await db.collection('subscriptions').where('userId', '==', userId).get();
  for (const doc of subs.docs) {
    await doc.ref.update({
      userId: 'deleted_' + userId.substring(0, 8),
      anonymizedAt: new Date().toISOString()
    });
  }
  console.log('✅ Anonymized', subs.size, 'subscriptions');

  console.log('\n✅ User deletion complete!');
}

async function main() {
  await investigate();
  await deleteUser();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
