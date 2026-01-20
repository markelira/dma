const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  projectId: 'dmaapp-477d4'
});

const db = admin.firestore();
const auth = admin.auth();

async function investigateUser(email) {
  console.log('\n' + '='.repeat(60));
  console.log('Investigating: ' + email);
  console.log('='.repeat(60));

  try {
    const authUser = await auth.getUserByEmail(email);
    console.log('\n✅ Firebase Auth User Found:');
    console.log('  - UID:', authUser.uid);
    console.log('  - Email Verified:', authUser.emailVerified);
    console.log('  - Created:', authUser.metadata.creationTime);
    console.log('  - Last Sign In:', authUser.metadata.lastSignInTime);
    console.log('  - Disabled:', authUser.disabled);

    const userDoc = await db.collection('users').doc(authUser.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log('\n✅ Firestore User Document Found:');
      console.log('  - Role:', data.role);
      console.log('  - CompanyId:', data.companyId || 'NINCS');
      console.log('  - SubscriptionStatus:', data.subscriptionStatus || 'NINCS');
      console.log('  - CreatedAt:', data.createdAt);
    } else {
      console.log('\n❌ Firestore User Document: NEM LÉTEZIK');
    }

    const pendingDoc = await db.collection('pendingRegistrations').doc(authUser.uid).get();
    if (pendingDoc.exists) {
      const data = pendingDoc.data();
      console.log('\n⚠️ Pending Registration Found:');
      console.log('  - Current Step:', data.currentStep);
      console.log('  - Company Name:', data.companyName);
      console.log('  - Stripe Session:', data.stripeSessionId || 'NINCS');
      console.log('  - Created:', data.createdAt?.toDate?.());
      console.log('  - Expires:', data.expiresAt?.toDate?.());
    } else {
      console.log('\n✅ Pending Registration: NINCS');
    }

    const subsSnapshot = await db.collection('subscriptions').where('userId', '==', authUser.uid).get();
    if (subsSnapshot.empty === false) {
      console.log('\n✅ Subscriptions Found:');
      subsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('  - ' + doc.id + ': status=' + data.status + ', plan=' + data.planName);
      });
    } else {
      console.log('\n❌ Subscriptions: NINCS');
    }

    if (userDoc.exists && userDoc.data().companyId) {
      const companyDoc = await db.collection('companies').doc(userDoc.data().companyId).get();
      if (companyDoc.exists) {
        const data = companyDoc.data();
        console.log('\n✅ Company Found:');
        console.log('  - Name:', data.name);
        console.log('  - SubscriptionStatus:', data.subscriptionStatus);
      }
    }

    return authUser.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('\n❌ Firebase Auth: USER NOT FOUND');

      const usersSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();
      if (usersSnapshot.empty === false) {
        console.log('\n⚠️ De Firestore user létezik ezzel az email-lel!');
        usersSnapshot.forEach(doc => {
          console.log('  - Doc ID:', doc.id);
          console.log('  - Data:', JSON.stringify(doc.data(), null, 2));
        });
      }

      const pendingSnapshot = await db.collection('pendingRegistrations').where('email', '==', email.toLowerCase()).get();
      if (pendingSnapshot.empty === false) {
        console.log('\n⚠️ Pending Registration létezik ezzel az email-lel!');
        pendingSnapshot.forEach(doc => {
          console.log('  - Doc ID:', doc.id);
          console.log('  - Step:', doc.data().currentStep);
        });
      }
    } else {
      console.log('\n❌ Error:', error.message);
    }
    return null;
  }
}

async function main() {
  await investigateUser('toth.karoly.w@gmail.com');
  await investigateUser('wok2boxoffice@gmail.com');
  process.exit(0);
}

main().catch(console.error);
