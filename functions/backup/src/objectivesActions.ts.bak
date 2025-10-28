import { onCall } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp();
}
const firestore = getFirestore();

/**
 * Get all objectives (Callable function)
 */
export const getObjectives = onCall(async () => {
  try {
    const snap = await firestore.collection('objectives').get();
    const objectives = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      success: true,
      objectives,
    };
  } catch (error: any) {
    console.error('❌ getObjectives error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
}); 