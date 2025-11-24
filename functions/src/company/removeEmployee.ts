/**
 * Remove Employee from Company
 * Handles both canceling invitations and removing active employees
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface RemoveEmployeeInput {
  companyId: string;
  employeeId: string;
}

interface RemoveEmployeeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Remove an employee from a company or cancel their invitation
 */
export const removeEmployee = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    maxInstances: 10,
    timeoutSeconds: 60,
    cors: true,
  },
  async (request: CallableRequest<RemoveEmployeeInput>): Promise<RemoveEmployeeResponse> => {
    // 1. Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, employeeId } = request.data;
    const adminUserId = request.auth.uid;

    logger.info('[removeEmployee] Request received', {
      companyId,
      employeeId,
      adminUserId,
    });

    // 2. Validate input
    if (!companyId || !employeeId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // 3. Verify admin permission
      const adminDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(adminUserId)
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

      // 4. Get employee document
      const employeeRef = db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .doc(employeeId);

      const employeeDoc = await employeeRef.get();

      if (!employeeDoc.exists) {
        throw new HttpsError('not-found', 'Employee not found');
      }

      const employeeData = employeeDoc.data();
      if (!employeeData) {
        throw new HttpsError('not-found', 'Employee data not found');
      }

      // 5. Prevent removing company owner
      const companyDoc = await db.collection('companies').doc(companyId).get();
      const companyData = companyDoc.data();

      if (employeeData.userId && companyData?.ownerId === employeeData.userId) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot remove the company owner'
        );
      }

      const employeeStatus = employeeData.status;
      const employeeName = employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`;

      logger.info('[removeEmployee] Processing removal', {
        employeeId,
        employeeStatus,
        employeeName,
        hasUserId: !!employeeData.userId,
      });

      // 6. Handle based on employee status
      if (employeeStatus === 'invited') {
        // Cancel invitation - just update status
        await employeeRef.update({
          status: 'left',
          inviteToken: admin.firestore.FieldValue.delete(),
          inviteExpiresAt: admin.firestore.FieldValue.delete(),
          removedAt: admin.firestore.FieldValue.serverTimestamp(),
          removedBy: adminUserId,
        });

        logger.info('[removeEmployee] Invitation cancelled', { employeeId });

      } else if (employeeStatus === 'active') {
        // Remove active employee
        const userId = employeeData.userId;

        // Update employee status
        await employeeRef.update({
          status: 'left',
          removedAt: admin.firestore.FieldValue.serverTimestamp(),
          removedBy: adminUserId,
        });

        // Update user document if userId exists
        if (userId) {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            await userRef.update({
              companyId: admin.firestore.FieldValue.delete(),
              companyRole: admin.firestore.FieldValue.delete(),
              updatedAt: new Date().toISOString(),
            });

            // Clear user custom claims
            try {
              const currentClaims = (await admin.auth().getUser(userId)).customClaims || {};
              const updatedClaims = { ...currentClaims };
              delete updatedClaims.companyId;
              delete updatedClaims.companyRole;

              // Reset role if it was COMPANY_ADMIN or company-related
              if (updatedClaims.role === 'COMPANY_ADMIN' || updatedClaims.role === 'COMPANY_EMPLOYEE') {
                updatedClaims.role = 'STUDENT';
              }

              await admin.auth().setCustomUserClaims(userId, updatedClaims);

              logger.info('[removeEmployee] User claims updated', { userId });
            } catch (claimsError) {
              logger.error('[removeEmployee] Error updating claims', claimsError);
              // Continue even if claims update fails
            }
          }
        }

        logger.info('[removeEmployee] Active employee removed', { employeeId, userId });

      } else if (employeeStatus === 'left') {
        // Already removed
        return {
          success: true,
          message: 'Az alkalmazott már el lett távolítva',
        };
      }

      // 7. Update company employee count
      const companyRef = db.collection('companies').doc(companyId);
      await companyRef.update({
        employeeCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 8. Log activity
      await db.collection('companies').doc(companyId).collection('activity').add({
        type: employeeStatus === 'invited' ? 'invitation_cancelled' : 'employee_removed',
        employeeId,
        employeeName,
        employeeEmail: employeeData.email,
        performedBy: adminUserId,
        performedByEmail: request.auth.token.email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      const message = employeeStatus === 'invited'
        ? `${employeeName} meghívása visszavonva`
        : `${employeeName} eltávolítva a vállalatból`;

      logger.info('[removeEmployee] Success', { message });

      return {
        success: true,
        message,
      };

    } catch (error: any) {
      logger.error('[removeEmployee] Error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message || 'Failed to remove employee');
    }
  }
);
