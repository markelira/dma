/**
 * Seed Categories via Cloud Function
 * Calls the seedCategories Firebase Function
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDXaEoK6tQPLrYxC5Sg6aVhJbz-gKGJ2_Q",
  authDomain: "elira-67ab7.firebaseapp.com",
  projectId: "elira-67ab7",
  storageBucket: "elira-67ab7.firebasestorage.app",
  messagingSenderId: "695517526749",
  appId: "1:695517526749:web:faf3dc02c3e3fcadbeb4f1",
  measurementId: "G-Q1L3PDZNHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to emulator
connectFunctionsEmulator(functions, 'localhost', 5001);

async function seedCategories() {
  console.log('🌱 Calling seedCategories function...');

  try {
    const seedCategoriesFn = httpsCallable(functions, 'seedCategories');
    const result = await seedCategoriesFn();

    console.log('✅ Result:', result.data);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedCategories();
