/**
 * Day 3 Authentication Test Setup
 * Sets up test users and Firebase emulators for authentication testing
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Test Firebase configuration
const testFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'DMA-PROJECT-ID.firebaseapp.com',
  projectId: 'DMA-PROJECT-ID',
  storageBucket: 'DMA-PROJECT-ID.appspot.com',
  messagingSenderId: '156979876603',
  appId: 'demo-app-id'
};

// Test users for different roles
export const testUsers = {
  student: {
    email: 'student@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Student',
    role: 'student'
  },
  instructor: {
    email: 'instructor@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Instructor',
    role: 'instructor'
  },
  universityAdmin: {
    email: 'university_admin@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'University Admin',
    role: 'university_admin',
    universityId: 'test-university'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin'
  }
};

// Initialize Firebase for testing
const app = initializeApp(testFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);
connectFunctionsEmulator(functions, 'localhost', 5001);

/**
 * Creates test users in Firebase Auth and Firestore
 */
export async function createTestUsers() {
  console.log('Creating test users for Day 3 authentication tests...');
  
  for (const [role, userData] of Object.entries(testUsers)) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        universityId: userData.universityId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        isActive: true
      });
      
      console.log(`✅ Created test user: ${userData.email} (${userData.role})`);
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Test user already exists: ${userData.email}`);
      } else {
        console.error(`❌ Failed to create test user ${userData.email}:`, error);
      }
    }
  }
  
  console.log('Test user creation completed.');
}

/**
 * Cleans up test users (optional, for teardown)
 */
export async function cleanupTestUsers() {
  console.log('Cleaning up test users...');
  
  for (const userData of Object.values(testUsers)) {
    try {
      // Sign in and delete user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      await userCredential.user.delete();
      console.log(`✅ Deleted test user: ${userData.email}`);
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`⚠️  Test user not found: ${userData.email}`);
      } else {
        console.error(`❌ Failed to delete test user ${userData.email}:`, error);
      }
    }
  }
}

/**
 * Verifies that Firebase emulators are running
 */
export async function verifyEmulatorsRunning(): Promise<boolean> {
  try {
    // Try to create a test user to verify emulators are working
    const testEmail = 'emulator-test@test.com';
    const testPassword = 'Test123!';
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    await userCredential.user.delete();
    
    console.log('✅ Firebase emulators are running and accessible');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase emulators are not running or not accessible:', error);
    console.log('Please start Firebase emulators with: firebase emulators:start');
    return false;
  }
}

// Export Firebase instances for tests
export { auth, db, functions };