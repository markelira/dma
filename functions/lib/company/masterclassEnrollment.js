"use strict";
/**
 * Masterclass Enrollment Functions
 * Handles assigning employees to company-purchased masterclasses
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
exports.getCompanyMasterclasses = exports.unassignEmployeeFromMasterclass = exports.assignEmployeeToMasterclass = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
/**
 * Assign Employee to Company-Purchased Masterclass
 * Only company admins can assign employees to courses the company has purchased
 */
exports.assignEmployeeToMasterclass = v2_1.https.onCall({
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, employeeId, masterclassId } = request.data;
    const userId = request.auth.uid;
    // Validation
    if (!companyId || !employeeId || !masterclassId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        const adminData = adminDoc.data();
        if (!adminData?.permissions?.canManageEmployees) {
            throw new https_1.HttpsError('permission-denied', 'No permission to manage employees');
        }
        // 2. Verify company has purchased this masterclass
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Company not found');
        }
        const companyData = companyDoc.data();
        const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];
        if (!purchasedMasterclasses.includes(masterclassId)) {
            throw new https_1.HttpsError('failed-precondition', 'Company has not purchased this masterclass');
        }
        // 3. Get employee document
        const employeeDoc = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc(employeeId)
            .get();
        if (!employeeDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Employee not found');
        }
        const employeeData = employeeDoc.data();
        if (!employeeData) {
            throw new https_1.HttpsError('not-found', 'Employee data not found');
        }
        const currentEnrollments = employeeData.enrolledMasterclasses || [];
        // 4. Check if already enrolled
        if (currentEnrollments.includes(masterclassId)) {
            throw new https_1.HttpsError('already-exists', 'Employee is already enrolled in this masterclass');
        }
        // 5. Add masterclass to employee's enrolledMasterclasses array
        await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc(employeeId)
            .update({
            enrolledMasterclasses: firestore_1.FieldValue.arrayUnion(masterclassId),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                    enrolledAt: firestore_1.FieldValue.serverTimestamp(),
                    lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
        }
        console.log(`Employee ${employeeId} assigned to masterclass ${masterclassId} by admin ${userId}`);
        return {
            success: true,
            message: 'Employee successfully assigned to masterclass',
        };
    }
    catch (error) {
        console.error('Error assigning employee to masterclass:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Unassign Employee from Masterclass
 */
exports.unassignEmployeeFromMasterclass = v2_1.https.onCall({
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, employeeId, masterclassId } = request.data;
    const userId = request.auth.uid;
    if (!companyId || !employeeId || !masterclassId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        const adminData = adminDoc.data();
        if (!adminData?.permissions?.canManageEmployees) {
            throw new https_1.HttpsError('permission-denied', 'No permission to manage employees');
        }
        // 2. Remove masterclass from employee's enrolledMasterclasses array
        await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc(employeeId)
            .update({
            enrolledMasterclasses: firestore_1.FieldValue.arrayRemove(masterclassId),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        console.log(`Employee ${employeeId} unassigned from masterclass ${masterclassId} by admin ${userId}`);
        return {
            success: true,
            message: 'Employee successfully unassigned from masterclass',
        };
    }
    catch (error) {
        console.error('Error unassigning employee from masterclass:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Get Available Masterclasses for Company
 * Returns all masterclasses the company has purchased
 */
exports.getCompanyMasterclasses = v2_1.https.onCall({
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId } = request.data;
    const userId = request.auth.uid;
    if (!companyId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing companyId');
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
            throw new https_1.HttpsError('permission-denied', 'You are not a member of this company');
        }
        // Get company's purchased masterclasses
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Company not found');
        }
        const companyData = companyDoc.data();
        const purchasedMasterclassIds = companyData?.purchasedMasterclasses || [];
        // Get masterclass details from course-content collection
        const masterclasses = await Promise.all(purchasedMasterclassIds.map(async (id) => {
            const masterclassDoc = await db.collection('course-content').doc(id).get();
            if (masterclassDoc.exists) {
                return {
                    id: masterclassDoc.id,
                    ...masterclassDoc.data(),
                };
            }
            return null;
        }));
        return {
            success: true,
            masterclasses: masterclasses.filter((m) => m !== null),
        };
    }
    catch (error) {
        console.error('Error fetching company masterclasses:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=masterclassEnrollment.js.map