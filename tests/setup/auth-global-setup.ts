// Global setup for authentication tests
export default async function globalSetup() {
  console.log('🔧 Setting up authentication test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.FIREBASE_PROJECT_ID = 'test-project';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';
  
  // Disable Firebase Analytics in tests
  process.env.FIREBASE_ANALYTICS_DISABLED = 'true';
  
  // Mock Firebase configuration
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
  
  console.log('✅ Authentication test environment setup complete');
}