"use strict";
/**
 * Company Masterclass Purchase Functions
 * When a company purchases a course, all employees automatically get access
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
exports.getCompanyPurchases = exports.purchaseCompanyMasterclass = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
/**
 * Purchase Masterclass for Company
 * Automatically enrolls all existing employees
 */
exports.purchaseCompanyMasterclass = v2_1.https.onCall({
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, masterclassId, paymentIntentId } = request.data;
    const userId = request.auth.uid;
    // Validation
    if (!companyId || !masterclassId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        const adminData = adminDoc.data();
        // Only owner or admins with billing permission can purchase
        if (adminData?.role !== 'owner' && !adminData?.permissions?.canManageBilling) {
            throw new https_1.HttpsError('permission-denied', 'No permission to purchase masterclasses');
        }
        // 2. Verify masterclass exists
        const masterclassDoc = await db.collection('course-content').doc(masterclassId).get();
        if (!masterclassDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Masterclass not found');
        }
        // 3. Check if company already purchased this masterclass
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Company not found');
        }
        const companyData = companyDoc.data();
        const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];
        if (purchasedMasterclasses.includes(masterclassId)) {
            throw new https_1.HttpsError('already-exists', 'Company has already purchased this masterclass');
        }
        // 4. Add masterclass to company's purchased list
        await db.collection('companies').doc(companyId).update({
            purchasedMasterclasses: firestore_1.FieldValue.arrayUnion(masterclassId),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                enrolledMasterclasses: firestore_1.FieldValue.arrayUnion(masterclassId),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                    enrolledAt: firestore_1.FieldValue.serverTimestamp(),
                    lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
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
            purchasedAt: firestore_1.FieldValue.serverTimestamp(),
            paymentIntentId,
            employeesEnrolled: enrolledCount,
            price: masterclassDoc.data()?.price || 0,
        });
        console.log(`Company ${companyId} purchased masterclass ${masterclassId}. Auto-enrolled ${enrolledCount} employees.`);
        return {
            success: true,
            message: `Masterclass purchased successfully. ${enrolledCount} employees automatically enrolled.`,
            enrolledCount,
        };
    }
    catch (error) {
        console.error('Error purchasing masterclass:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Get Company Purchases
 * Returns all masterclasses purchased by the company
 */
exports.getCompanyPurchases = v2_1.https.onCall({
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
            throw new https_1.HttpsError('permission-denied', 'You are not a member of this company');
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
    }
    catch (error) {
        console.error('Error fetching company purchases:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=purchaseMasterclass.js.map