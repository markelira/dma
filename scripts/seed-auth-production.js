// seed-auth-production.js - Create test users in production Firebase Auth
const admin = require('firebase-admin');
const serviceAccount = require('../dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

// Initialize Firebase Admin for production
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dmaapp-477d4',
});

async function createTestUsers() {
  const auth = admin.auth(app);
  
  // Define test users with their specific UIDs to match Firestore data
  const testUsers = [
    {
      uid: 'WUGJfyeG6pvuojUwWtnNHUpMC3un',
      email: 'admin@dma.hu',
      password: 'admin123',
      displayName: 'Admin User',
      customClaims: { role: 'ADMIN' }
    },
    {
      uid: 'jjCWRvVCERVBO4YWBlhxu3ynnyGx',
      email: 'instructor@dma.hu',
      password: 'instructor123',
      displayName: 'Nagy Péter',
      customClaims: { role: 'INSTRUCTOR' }
    },
    {
      uid: 'rvrvcbhX8NqV7bghm4umhfGuGuyo',
      email: 'student1@dma.hu',
      password: 'student123',
      displayName: 'Kovács János',
      customClaims: { role: 'STUDENT' }
    },
    {
      uid: '8P3Kanza5Cak6esWIaehrCMigEJ1',
      email: 'student2@dma.hu',
      password: 'student123',
      displayName: 'Szabó Anna',
      customClaims: { role: 'STUDENT' }
    }
  ];

  console.log('🚀 Creating test users in production Firebase Auth...\n');

  for (const user of testUsers) {
    try {
      // Try to get existing user
      try {
        await auth.getUser(user.uid);
        console.log(`ℹ️  User ${user.email} already exists, updating...`);
        await auth.updateUser(user.uid, {
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });
        await auth.setCustomUserClaims(user.uid, user.customClaims);
        console.log(`✅ Updated: ${user.email} (${user.customClaims.role})`);
      } catch (error) {
        // User doesn't exist, create new
        await auth.createUser({
          uid: user.uid,
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });
        await auth.setCustomUserClaims(user.uid, user.customClaims);
        console.log(`✅ Created: ${user.email} (${user.customClaims.role})`);
      }
    } catch (error) {
      console.error(`❌ Failed to process user ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Auth users creation completed!');
  console.log('\n📝 Test Accounts:');
  console.log('  Admin: admin@dma.hu / admin123');
  console.log('  Instructor: instructor@dma.hu / instructor123');
  console.log('  Student 1: student1@dma.hu / student123');
  console.log('  Student 2: student2@dma.hu / student123');
}

createTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
