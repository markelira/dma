import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Set emulator hosts to match firebase.json configuration
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp({
    projectId: 'elira-67ab7',
    storageBucket: 'elira-67ab7.appspot.com'
  });
}

export const firestore = getFirestore();
export const auth = getAuth();
export const storage = getStorage(); 