// Global teardown for authentication tests
export default async function globalTeardown() {
  console.log('🧹 Cleaning up authentication test environment...');
  
  // Clean up environment variables
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST;
  delete process.env.FIREBASE_ANALYTICS_DISABLED;
  
  // Clean up mock Firebase configuration
  delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  
  console.log('✅ Authentication test environment cleanup complete');
}