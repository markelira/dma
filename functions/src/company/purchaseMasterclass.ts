/**
 * Company Masterclass Purchase Functions
 * When a company purchases a course, all employees automatically get access
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface PurchaseMasterclassInput {
  companyId: string;
  masterclassId: string;
  paymentIntentId?: string; // From Stripe
}

/**
 * Purchase Masterclass for Company
 * Automatically enrolls all existing employees
 */
export const purchaseCompanyMasterclass = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<PurchaseMasterclassInput>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, masterclassId, paymentIntentId } = request.data;
    const userId = request.auth.uid;

    // Validation
    if (!companyId || !masterclassId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // 1. Verify user is company admin with purchase permissions
      const adminDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .get();

      if (!adminDoc.exists) {
        throw new HttpsError(
          'permission-denied',
          'You are not an admin of this company'
        );
      }

      const adminData = adminDoc.data();

      // Only owner or admins with billing permission can purchase
      if (adminData?.role !== 'owner' && !adminData?.permissions?.canManageBilling) {
        throw new HttpsError(
          'permission-denied',
          'No permission to purchase masterclasses'
        );
      }

      // 2. Verify masterclass exists
      const masterclassDoc = await db.collection('course-content').doc(masterclassId).get();

      if (!masterclassDoc.exists) {
        throw new HttpsError('not-found', 'Masterclass not found');
      }

      // 3. Check if company already purchased this masterclass
      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Company not found');
      }

      const companyData = companyDoc.data();
      const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];

      if (purchasedMasterclasses.includes(masterclassId)) {
        throw new HttpsError(
          'already-exists',
          'Company has already purchased this masterclass'
        );
      }

      // 4. Add masterclass to company's purchased list
      await db.collection('companies').doc(companyId).update({
        purchasedMasterclasses: FieldValue.arrayUnion(masterclassId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 5. Get all active employees in the company
      const employeesSnapshot = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('status', '==', 'active')
        .get();

      // 6. Auto-enroll all active employees
      const batch = db.batch();
      let enrolledCount = 0;

      for (const employeeDoc of employeesSnapshot.docs) {
        const employeeData = employeeDoc.data();
        const currentEnrollments = employeeData.enrolledMasterclasses || [];

        // Skip if already enrolled
        if (currentEnrollments.includes(masterclassId)) {
          continue;
        }

        // Add to employee's enrolled masterclasses
        batch.update(employeeDoc.ref, {
          enrolledMasterclasses: FieldValue.arrayUnion(masterclassId),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Create progress record if employee has accepted invite (has userId)
        if (employeeData.userId) {
          const progressId = `${employeeData.userId}_${masterclassId}`;
          const progressRef = db.collection('userProgress').doc(progressId);

          batch.set(progressRef, {
            userId: employeeData.userId,
            masterclassId,
            companyId,
            currentModule: 1,
            completedModules: [],
            status: 'active',
            enrolledAt: FieldValue.serverTimestamp(),
            lastActivityAt: FieldValue.serverTimestamp(),
          });
        }

        enrolledCount++;
      }

      await batch.commit();

      // 7. Log the purchase
      await db.collection('companies').doc(companyId).collection('purchases').add({
        masterclassId,
        masterclassTitle: masterclassDoc.data()?.title || 'Unknown Course',
        purchasedBy: userId,
        purchasedAt: FieldValue.serverTimestamp(),
        paymentIntentId,
        employeesEnrolled: enrolledCount,
        price: masterclassDoc.data()?.price || 0,
      });

      console.log(
        `Company ${companyId} purchased masterclass ${masterclassId}. Auto-enrolled ${enrolledCount} employees.`
      );

      return {
        success: true,
        message: `Masterclass purchased successfully. ${enrolledCount} employees automatically enrolled.`,
        enrolledCount,
      };
    } catch (error: any) {
      console.error('Error purchasing masterclass:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Get Company Purchases
 * Returns all masterclasses purchased by the company
 */
export const getCompanyPurchases = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<{ companyId: string }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId } = request.data;
    const userId = request.auth.uid;

    if (!companyId) {
      throw new HttpsError('invalid-argument', 'Missing companyId');
    }

    try {
      // Verify user is part of the company
      const adminDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .get();

      const employeeQuery = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!adminDoc.exists && employeeQuery.empty) {
        throw new HttpsError(
          'permission-denied',
          'You are not a member of this company'
        );
      }

      // Get purchase history
      const purchasesSnapshot = await db
        .collection('companies')
        .doc(companyId)
        .collection('purchases')
        .orderBy('purchasedAt', 'desc')
        .get();

      const purchases = purchasesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        purchasedAt: doc.data().purchasedAt?.toDate(),
      }));

      return {
        success: true,
        purchases,
      };
    } catch (error: any) {
      console.error('Error fetching company purchases:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);
