const admin = require('firebase-admin');

// Set emulator hosts
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Initialize admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'dma-67ab7',
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('🔐 Admin felhasználó létrehozása...\n');
    
    const email = 'admin@elira.hu';
    const password = 'Admin123!';
    
    // Check if user exists and delete if needed
    try {
      const existingUser = await auth.getUserByEmail(email);
      await auth.deleteUser(existingUser.uid);
      console.log('✅ Meglévő felhasználó törölve');
    } catch (error) {
      // User doesn't exist, that's fine
    }
    
    // Create new user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'Admin User',
      emailVerified: true
    });
    
    console.log('✅ Admin felhasználó létrehozva Firebase Auth-ban');
    console.log('   UID:', userRecord.uid);
    
    // Create/update user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: 'Admin User',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoURL: '',
      bio: 'Platform Administrator',
      isActive: true,
      emailVerified: true
    });
    
    console.log('✅ Admin felhasználó létrehozva Firestore-ban');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Admin fiók sikeresen létrehozva!');
    console.log('='.repeat(50));
    console.log('\n📧 Email: ' + email);
    console.log('🔑 Jelszó: ' + password);
    console.log('\n💡 Használd ezeket az adatokat a bejelentkezéshez:');
    console.log('   http://localhost:3000/login');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

createAdminUser();