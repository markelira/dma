const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use the service account file
    const serviceAccountPath = path.join(__dirname, '../../secure/dmaapp-477d4-firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'dmaapp-477d4'
    });
    console.log('✅ Firebase Admin initialized with service account');
  } catch (error) {
    // If service account doesn't exist, try default credentials
    admin.initializeApp({
      projectId: 'dmaapp-477d4'
    });
    console.log('✅ Firebase Admin initialized with default credentials');
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const adminData = {
    email: 'admin@elira.hu',
    password: 'admin123',
    displayName: 'Admin User',
    emailVerified: true
  };

  try {
    console.log('🔧 Creating admin user...');
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminData.email);
      console.log(`⚠️  User ${adminData.email} already exists with UID: ${userRecord.uid}`);
      
      // Update password
      await auth.updateUser(userRecord.uid, {
        password: adminData.password,
        displayName: adminData.displayName,
        emailVerified: true
      });
      console.log('✅ Updated existing user password and details');
      
    } catch (error) {
      // User doesn't exist, create new
      userRecord = await auth.createUser(adminData);
      console.log(`✅ Created new user with UID: ${userRecord.uid}`);
    }

    // Set custom claims for ADMIN role
    await auth.setCustomUserClaims(userRecord.uid, { role: 'ADMIN' });
    console.log('✅ Set ADMIN role in custom claims');

    // Create/Update Firestore document
    const userDoc = {
      id: userRecord.uid,
      uid: userRecord.uid,
      email: adminData.email,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      displayName: 'Admin User',
      profilePictureUrl: null,
      bio: 'Platform Administrator',
      title: 'System Administrator',
      institution: 'DMA Platform',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log('✅ Created/Updated Firestore document');

    console.log('\n' + '='.repeat(60));
    console.log('✨ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('📧 Email: admin@elira.hu');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    console.log('🆔 UID: ' + userRecord.uid);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

createAdminUser();