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

const users = [
  {
    email: 'admin@elira.hu',
    password: 'Admin123!',
    displayName: 'Admin',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'kovacs.janos@example.com',
    password: 'Test123!',
    displayName: 'Kovács János',
    role: 'student',
    firstName: 'János',
    lastName: 'Kovács',
  },
  {
    email: 'nagy.peter@example.com',
    password: 'Test123!',
    displayName: 'Nagy Péter',
    role: 'instructor',
    firstName: 'Péter',
    lastName: 'Nagy',
  },
  {
    email: 'szabo.anna@example.com',
    password: 'Test123!',
    displayName: 'Szabó Anna',
    role: 'student',
    firstName: 'Anna',
    lastName: 'Szabó',
  },
];

async function createAuthUsers() {
  console.log('🔐 Felhasználók létrehozása a Firebase Auth emulátorban...\n');
  
  for (const userData of users) {
    try {
      // Check if user exists and delete if needed
      try {
        const existingUser = await auth.getUserByEmail(userData.email);
        await auth.deleteUser(existingUser.uid);
        console.log(`✅ Meglévő felhasználó törölve: ${userData.email}`);
      } catch (error) {
        // User doesn't exist, that's fine
      }
      
      // Create new user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: true
      });
      
      console.log(`✅ Felhasználó létrehozva Auth-ban: ${userData.email}`);
      console.log(`   UID: ${userRecord.uid}`);
      
      // Create/update user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoURL: '',
        bio: userData.role === 'admin' ? 'Platform Adminisztrátor' : 
             userData.role === 'instructor' ? 'Oktató' : 'Diák',
        isActive: true,
        emailVerified: true
      });
      
      console.log(`✅ Felhasználó létrehozva Firestore-ban: ${userData.email}\n`);
      
    } catch (error) {
      console.error(`❌ Hiba ${userData.email} létrehozásakor:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Minden felhasználó sikeresen létrehozva!');
  console.log('='.repeat(60));
  console.log('\n📧 Bejelentkezési adatok:');
  console.log('='.repeat(60));
  
  for (const user of users) {
    console.log(`\n${user.role === 'admin' ? 'ADMIN' : user.role === 'instructor' ? 'OKTATÓ' : 'DIÁK'}:`);
    console.log(`Email: ${user.email}`);
    console.log(`Jelszó: ${user.password}`);
  }
  
  console.log('\n='.repeat(60));
  console.log('💡 Használd ezeket az adatokat itt: http://localhost:3000/login');
  console.log('='.repeat(60) + '\n');
}

createAuthUsers();