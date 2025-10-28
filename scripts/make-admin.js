// Script to make a user admin in Firestore
// Usage: node scripts/make-admin.js <email>

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://dmaapp-477d4.firebaseio.com'
});

const db = admin.firestore();

async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Finding user with email: ${email}`);
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`✅ Found user: ${userData.firstName} ${userData.lastName} (${userId})`);
    console.log(`Current role: ${userData.role}`);
    
    // Update user role to ADMIN
    await db.collection('users').doc(userId).update({
      role: 'ADMIN',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Successfully updated user role to ADMIN`);
    console.log(`🎉 ${email} is now an admin!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-admin.js <email>');
  console.log('Example: node scripts/make-admin.js admin@example.com');
  process.exit(1);
}

makeUserAdmin(email);