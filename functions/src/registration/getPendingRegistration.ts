import * as admin from 'firebase-admin';
import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

interface PendingEmployee {
  email: string;
  firstName: string;
  lastName: string;
}

interface PendingRegistrationData {
  odingUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName?: string;
  currentStep: 1 | 2 | 3;
  pendingEmployees: PendingEmployee[];
  stripeSessionId?: string;
  stripeCustomerId?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
}

interface GetPendingRegistrationResponse {
  found: boolean;
  alreadyCompleted?: boolean;
  data?: PendingRegistrationData;
}

/**
 * Get pending registration state from Firestore
 * Returns the saved registration state for recovery
 * Also checks if user already completed registration (cleanup)
 */
export const getPendingRegistration = https.onCall(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cors: [
      'https://masterclass.dma.hu',
      'https://academion.hu',
      'https://dmaapp-477d4.web.app',
      'https://dmaapp-477d4.firebaseapp.com',
      'http://localhost:3000'
    ]
  },
  async (request: CallableRequest<void>): Promise<GetPendingRegistrationResponse> => {
    const db = admin.firestore();

    // Require authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;

    try {
      // Check if user already has completed registration
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.companyId) {
          // User has completed registration - clean up pending if exists
          const pendingRef = db.collection('pendingRegistrations').doc(userId);
          const pendingDoc = await pendingRef.get();

          if (pendingDoc.exists) {
            await pendingRef.delete();
            console.log(`🧹 [PendingReg] Cleaned up pending registration for completed user: ${userId}`);
          }

          return {
            found: false,
            alreadyCompleted: true
          };
        }
      }

      // Get pending registration
      const pendingDoc = await db.collection('pendingRegistrations').doc(userId).get();

      if (!pendingDoc.exists) {
        return { found: false };
      }

      const data = pendingDoc.data() as PendingRegistrationData;

      // Check if expired
      if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
        // Expired - delete and return not found
        await pendingDoc.ref.delete();
        console.log(`🧹 [PendingReg] Deleted expired pending registration for user: ${userId}`);
        return { found: false };
      }

      console.log(`📝 [PendingReg] Resumed for user: ${userId}, step: ${data.currentStep}`);

      return {
        found: true,
        data
      };
    } catch (error: any) {
      console.error('❌ [PendingReg] Error getting pending registration:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to get pending registration: ${error.message}`);
    }
  }
);
