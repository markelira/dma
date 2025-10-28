/**
 * Masterclass Enrollment Functions
 * Handles assigning employees to company-purchased masterclasses
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface AssignEmployeeToMasterclassInput {
  companyId: string;
  employeeId: string; // Document ID in employees subcollection
  masterclassId: string;
}

/**
 * Assign Employee to Company-Purchased Masterclass
 * Only company admins can assign employees to courses the company has purchased
 */
export const assignEmployeeToMasterclass = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<AssignEmployeeToMasterclassInput>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, employeeId, masterclassId } = request.data;
    const userId = request.auth.uid;

    // Validation
    if (!companyId || !employeeId || !masterclassId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // 1. Verify admin permission
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
      if (!adminData?.permissions?.canManageEmployees) {
        throw new HttpsError(
          'permission-denied',
          'No permission to manage employees'
        );
      }

      // 2. Verify company has purchased this masterclass
      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Company not found');
      }

      const companyData = companyDoc.data();
      const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];

      if (!purchasedMasterclasses.includes(masterclassId)) {
        throw new HttpsError(
          'failed-precondition',
          'Company has not purchased this masterclass'
        );
      }

      // 3. Get employee document
      const employeeDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        throw new HttpsError('not-found', 'Employee not found');
      }

      const employeeData = employeeDoc.data();

      if (!employeeData) {
        throw new HttpsError('not-found', 'Employee data not found');
      }

      const currentEnrollments = employeeData.enrolledMasterclasses || [];

      // 4. Check if already enrolled
      if (currentEnrollments.includes(masterclassId)) {
        throw new HttpsError(
          'already-exists',
          'Employee is already enrolled in this masterclass'
        );
      }

      // 5. Add masterclass to employee's enrolledMasterclasses array
      await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .doc(employeeId)
        .update({
          enrolledMasterclasses: FieldValue.arrayUnion(masterclassId),
          updatedAt: FieldValue.serverTimestamp(),
        });

      // 6. If employee has accepted invite (has userId), create initial progress record
      if (employeeData.userId) {
        const progressId = `${employeeData.userId}_${masterclassId}`;
        const progressRef = db.collection('userProgress').doc(progressId);

        const existingProgress = await progressRef.get();

        if (!existingProgress.exists) {
          await progressRef.set({
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
      }

      console.log(
        `Employee ${employeeId} assigned to masterclass ${masterclassId} by admin ${userId}`
      );

      return {
        success: true,
        message: 'Employee successfully assigned to masterclass',
      };
    } catch (error: any) {
      console.error('Error assigning employee to masterclass:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Unassign Employee from Masterclass
 */
export const unassignEmployeeFromMasterclass = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<AssignEmployeeToMasterclassInput>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, employeeId, masterclassId } = request.data;
    const userId = request.auth.uid;

    if (!companyId || !employeeId || !masterclassId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // 1. Verify admin permission
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
      if (!adminData?.permissions?.canManageEmployees) {
        throw new HttpsError(
          'permission-denied',
          'No permission to manage employees'
        );
      }

      // 2. Remove masterclass from employee's enrolledMasterclasses array
      await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .doc(employeeId)
        .update({
          enrolledMasterclasses: FieldValue.arrayRemove(masterclassId),
          updatedAt: FieldValue.serverTimestamp(),
        });

      console.log(
        `Employee ${employeeId} unassigned from masterclass ${masterclassId} by admin ${userId}`
      );

      return {
        success: true,
        message: 'Employee successfully unassigned from masterclass',
      };
    } catch (error: any) {
      console.error('Error unassigning employee from masterclass:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Get Available Masterclasses for Company
 * Returns all masterclasses the company has purchased
 */
export const getCompanyMasterclasses = https.onCall(
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
      // Verify user is part of the company (admin or employee)
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

      // Get company's purchased masterclasses
      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Company not found');
      }

      const companyData = companyDoc.data();
      const purchasedMasterclassIds = companyData?.purchasedMasterclasses || [];

      // Get masterclass details from course-content collection
      const masterclasses = await Promise.all(
        purchasedMasterclassIds.map(async (id: string) => {
          const masterclassDoc = await db.collection('course-content').doc(id).get();

          if (masterclassDoc.exists) {
            return {
              id: masterclassDoc.id,
              ...masterclassDoc.data(),
            };
          }
          return null;
        })
      );

      return {
        success: true,
        masterclasses: masterclasses.filter((m) => m !== null),
      };
    } catch (error: any) {
      console.error('Error fetching company masterclasses:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);
