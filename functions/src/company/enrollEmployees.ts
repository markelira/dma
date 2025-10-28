/**
 * Enroll Employees in Company Masterclass
 * 🔴 CRITICAL: Uses Firestore transaction to prevent race conditions
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  CompanyEmployee,
  UserMasterclassProgress,
} from '../types/company';

const db = admin.firestore();

interface EnrollEmployeesInput {
  companyId: string;
  masterclassId: string;
  employeeIds: string[];
}

export const enrollEmployeesInMasterclass = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 10, // Limit concurrent enrollments
    timeoutSeconds: 180, // 3 minutes for bulk enrollments
    cors: true,
  },
  async (request: CallableRequest<EnrollEmployeesInput>) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { companyId, masterclassId, employeeIds } = request.data;
    const userId = request.auth.uid;

    // Validation
    if (!companyId || !masterclassId || !Array.isArray(employeeIds)) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    if (employeeIds.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'At least one employee must be selected'
      );
    }

    if (employeeIds.length > 100) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot enroll more than 100 employees at once'
      );
    }

    // 🔴 CRITICAL FIX: Use Firestore transaction to prevent race condition
    return await db.runTransaction(async (transaction) => {
      // 1. Verify admin permission (read in transaction)
      const adminRef = db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId);

      const adminDoc = await transaction.get(adminRef);

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

      // 2. Get company masterclass (read in transaction)
      const masterclassQuery = await db
        .collection('companies')
        .doc(companyId)
        .collection('masterclasses')
        .where('masterclassId', '==', masterclassId)
        .limit(1)
        .get();

      if (masterclassQuery.empty) {
        throw new HttpsError(
          'not-found',
          'Masterclass not found for this company'
        );
      }

      const masterclassDocRef = masterclassQuery.docs[0].ref;
      const masterclassDoc = await transaction.get(masterclassDocRef);
      const masterclassData = masterclassDoc.data();

      if (!masterclassData) {
        throw new HttpsError(
          'not-found',
          'Masterclass data not found'
        );
      }

      // 3. Check available seats ATOMICALLY
      const availableSeats = masterclassData.seats?.available || 0;

      if (employeeIds.length > availableSeats) {
        throw new HttpsError(
          'failed-precondition',
          `Only ${availableSeats} seats available. You tried to enroll ${employeeIds.length} employees.`
        );
      }

      // 4. Update seat count in SAME transaction (prevents race condition)
      transaction.update(masterclassDocRef, {
        'seats.used': admin.firestore.FieldValue.increment(employeeIds.length),
        'seats.available': admin.firestore.FieldValue.increment(
          -employeeIds.length
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Enroll each employee (in transaction)
      const enrolledEmployees: string[] = [];

      for (const employeeId of employeeIds) {
        const employeeRef = db
          .collection('companies')
          .doc(companyId)
          .collection('employees')
          .doc(employeeId);

        const employeeDoc = await transaction.get(employeeRef);

        if (!employeeDoc.exists) {
          console.warn(`Employee ${employeeId} not found, skipping`);
          continue;
        }

        const employeeData = employeeDoc.data() as CompanyEmployee;

        // Check if already enrolled
        const alreadyEnrolled = employeeData.enrolledMasterclasses?.some(
          (e) => e.masterclassId === masterclassDocRef.id
        );

        if (alreadyEnrolled) {
          console.warn(
            `Employee ${employeeId} already enrolled in ${masterclassDocRef.id}, skipping`
          );
          continue;
        }

        // Check if employee has userId (has accepted invite)
        if (!employeeData.userId) {
          console.warn(
            `Employee ${employeeId} has not accepted invite yet, skipping`
          );
          continue;
        }

        // Update employee enrollments
        transaction.update(employeeRef, {
          enrolledMasterclasses: admin.firestore.FieldValue.arrayUnion({
            masterclassId: masterclassDocRef.id,
            enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          }),
        });

        // Create user progress document
        const progressId = `${employeeData.userId}_${masterclassData.masterclassId}`;
        const progressRef = db.collection('userProgress').doc(progressId);

        const progressData: Partial<UserMasterclassProgress> = {
          userId: employeeData.userId,
          masterclassId: masterclassData.masterclassId,
          isCompanySponsored: true,
          companyId: companyId,
          companyMasterclassId: masterclassDocRef.id,
          currentModule: 1,
          overallProgress: 0,
          lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
          totalTimeSpent: 0,
          computedStatus: 'on_track',
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          certificateIssued: false,
        };

        transaction.set(progressRef, progressData);

        enrolledEmployees.push(employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`);

        // TODO: Send enrollment email (outside transaction)
        // We'll queue this for post-transaction execution
      }

      return {
        success: true,
        enrolledCount: enrolledEmployees.length,
        enrolledEmployees: enrolledEmployees,
        skipped: employeeIds.length - enrolledEmployees.length,
      };
    });
  }
);
