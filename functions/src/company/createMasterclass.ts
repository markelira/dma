/**
 * Create Company Masterclass (Manual Purchase for MVP)
 * In MVP: Admin manually adds masterclass seats without payment integration
 * Post-MVP: Will integrate with Stripe for automatic payment
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { CompanyMasterclass } from '../types/company';

const db = admin.firestore();

interface CreateMasterclassInput {
  companyId: string;
  masterclassId: string;
  seatCount: number;
  startDate: string; // ISO date string
}

export const createCompanyMasterclass = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 10, // Limit concurrent purchases
    timeoutSeconds: 120, // 2 minutes timeout
    cors: true,
  },
  async (request: CallableRequest<CreateMasterclassInput>) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { companyId, masterclassId, seatCount, startDate } = request.data;
    const userId = request.auth.uid;

    // Validation
    if (!companyId || !masterclassId || !seatCount || !startDate) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    if (seatCount < 1 || seatCount > 1000) {
      throw new HttpsError(
        'invalid-argument',
        'Seat count must be between 1 and 1000'
      );
    }

    // Verify admin permission
    const adminRef = db
      .collection('companies')
      .doc(companyId)
      .collection('admins')
      .doc(userId);

    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'You are not an admin of this company'
      );
    }

    // Get masterclass details from global masterclasses collection
    // For MVP, we'll use hardcoded data since global masterclasses might not exist yet
    const masterclassRef = db.collection('masterclasses').doc(masterclassId);
    const masterclassDoc = await masterclassRef.get();

    let masterclassTitle = 'AI-Powered Copywriting Masterclass';
    let masterclassDuration = 8; // weeks
    let pricePerSeat = 89990; // Ft (from the price fix you did earlier)

    if (masterclassDoc.exists) {
      const data = masterclassDoc.data();
      masterclassTitle = data?.title || masterclassTitle;
      masterclassDuration = data?.duration || masterclassDuration;
      pricePerSeat = data?.pricePerSeat || pricePerSeat;
    }

    // Calculate dates
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (masterclassDuration * 7)); // duration in weeks

    // Create company masterclass
    const companyMasterclassData: Omit<CompanyMasterclass, 'id'> = {
      companyId,
      masterclassId,
      title: masterclassTitle,
      duration: masterclassDuration,
      seats: {
        purchased: seatCount,
        used: 0,
        available: seatCount,
      },
      pricePerSeat,
      totalPaid: pricePerSeat * seatCount,
      paymentStatus: 'manual', // MVP: No payment integration
      startDate: admin.firestore.Timestamp.fromDate(start),
      endDate: admin.firestore.Timestamp.fromDate(end),
      status: start > new Date() ? 'scheduled' : 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const companyMasterclassRef = await db
      .collection('companies')
      .doc(companyId)
      .collection('masterclasses')
      .add(companyMasterclassData);

    console.log(
      `Created company masterclass ${companyMasterclassRef.id} for company ${companyId}: ${seatCount} seats`
    );

    return {
      success: true,
      masterclassId: companyMasterclassRef.id,
      message: `Successfully added ${seatCount} seats for ${masterclassTitle}`,
    };
  }
);
