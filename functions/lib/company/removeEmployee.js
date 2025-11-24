"use strict";
/**
 * Remove Employee from Company
 * Handles both canceling invitations and removing active employees
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEmployee = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const v2_2 = require("firebase-functions/v2");
const db = admin.firestore();
/**
 * Remove an employee from a company or cancel their invitation
 */
exports.removeEmployee = v2_1.https.onCall({
    region: 'us-central1',
    memory: '256MiB',
    maxInstances: 10,
    timeoutSeconds: 60,
    cors: true,
}, async (request) => {
    // 1. Authentication check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, employeeId } = request.data;
    const adminUserId = request.auth.uid;
    v2_2.logger.info('[removeEmployee] Request received', {
        companyId,
        employeeId,
        adminUserId,
    });
    // 2. Validate input
    if (!companyId || !employeeId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        const adminData = adminDoc.data();
        if (!adminData?.permissions?.canManageEmployees) {
            throw new https_1.HttpsError('permission-denied', 'No permission to manage employees');
        }
        // 4. Get employee document
        const employeeRef = db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc(employeeId);
        const employeeDoc = await employeeRef.get();
        if (!employeeDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Employee not found');
        }
        const employeeData = employeeDoc.data();
        if (!employeeData) {
            throw new https_1.HttpsError('not-found', 'Employee data not found');
        }
        // 5. Prevent removing company owner
        const companyDoc = await db.collection('companies').doc(companyId).get();
        const companyData = companyDoc.data();
        if (employeeData.userId && companyData?.ownerId === employeeData.userId) {
            throw new https_1.HttpsError('failed-precondition', 'Cannot remove the company owner');
        }
        const employeeStatus = employeeData.status;
        const employeeName = employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`;
        v2_2.logger.info('[removeEmployee] Processing removal', {
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
            v2_2.logger.info('[removeEmployee] Invitation cancelled', { employeeId });
        }
        else if (employeeStatus === 'active') {
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
                        v2_2.logger.info('[removeEmployee] User claims updated', { userId });
                    }
                    catch (claimsError) {
                        v2_2.logger.error('[removeEmployee] Error updating claims', claimsError);
                        // Continue even if claims update fails
                    }
                }
            }
            v2_2.logger.info('[removeEmployee] Active employee removed', { employeeId, userId });
        }
        else if (employeeStatus === 'left') {
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
        v2_2.logger.info('[removeEmployee] Success', { message });
        return {
            success: true,
            message,
        };
    }
    catch (error) {
        v2_2.logger.error('[removeEmployee] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message || 'Failed to remove employee');
    }
});
//# sourceMappingURL=removeEmployee.js.map