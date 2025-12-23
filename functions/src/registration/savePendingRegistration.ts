import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

interface PendingEmployee {
  email: string;
  firstName: string;
  lastName: string;
}

interface SavePendingRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  currentStep: 1 | 2 | 3;
  pendingEmployees: PendingEmployee[];
  stripeSessionId?: string;
  stripeCustomerId?: string;
}

interface SavePendingRegistrationResponse {
  success: boolean;
  message?: string;
}

/**
 * Save pending registration state to Firestore
 * Replaces sessionStorage for persistence across browser sessions
 * Auto-expires after 7 days if not completed
 */
export const savePendingRegistration = https.onCall(
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
  async (request: CallableRequest<SavePendingRegistrationInput>): Promise<SavePendingRegistrationResponse> => {
    const db = admin.firestore();

    // Require authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      currentStep,
      pendingEmployees,
      stripeSessionId,
      stripeCustomerId
    } = request.data;

    // Validate required fields
    if (!email?.trim()) {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    if (currentStep < 1 || currentStep > 3) {
      throw new HttpsError('invalid-argument', 'Invalid step number');
    }

    try {
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const pendingData: any = {
        odingUserId: userId,
        email: email.trim().toLowerCase(),
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        phone: phone?.trim() || '',
        companyName: companyName?.trim() || '',
        currentStep,
        pendingEmployees: pendingEmployees || [],
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt
      };

      // Only add Stripe fields if provided
      if (stripeSessionId) {
        pendingData.stripeSessionId = stripeSessionId;
      }
      if (stripeCustomerId) {
        pendingData.stripeCustomerId = stripeCustomerId;
      }

      // Check if document exists (for logging)
      const existingDoc = await db.collection('pendingRegistrations').doc(userId).get();
      const isNew = !existingDoc.exists;

      if (isNew) {
        pendingData.createdAt = FieldValue.serverTimestamp();
      }

      // Upsert the pending registration
      await db.collection('pendingRegistrations').doc(userId).set(pendingData, { merge: true });

      console.log(`📝 [PendingReg] ${isNew ? 'Created' : 'Updated'} for user: ${userId}, step: ${currentStep}`);

      return {
        success: true,
        message: isNew ? 'Pending registration created' : 'Pending registration updated'
      };
    } catch (error: any) {
      console.error('❌ [PendingReg] Error saving pending registration:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to save pending registration: ${error.message}`);
    }
  }
);
