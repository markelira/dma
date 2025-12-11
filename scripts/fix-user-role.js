const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const USER_ID = '95nTI1oh9WTQ4YljzZd5W9A1mvp1';

async function fixUserRole() {
  console.log('🔧 Fixing user role for:', USER_ID);

  // Update Firestore document
  console.log('📝 Updating Firestore user document...');
  await db.collection('users').doc(USER_ID).update({
    role: 'company_admin' // Change from COMPANY_ADMIN to company_admin
  });
  console.log('✅ Firestore user document updated');

  // Get current user record to check companyId
  const userDoc = await db.collection('users').doc(USER_ID).get();
  const userData = userDoc.data();

  // Update custom claims
  console.log('🔐 Updating custom claims...');
  const customClaims = {
    role: 'company_admin',
    companyId: userData.companyId,
    companyRole: 'owner'
  };

  await auth.setCustomUserClaims(USER_ID, customClaims);
  console.log('✅ Custom claims updated:', customClaims);

  // Verify the update
  const userRecord = await auth.getUser(USER_ID);
  console.log('🔍 Verified custom claims:', userRecord.customClaims);

  console.log('✅ User role fix complete!');
  console.log('⚠️  User needs to log out and log back in for changes to take effect');

  process.exit(0);
}

fixUserRole().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
