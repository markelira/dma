"use strict";
/**
 * Enroll Employees in Company Masterclass
 * 🔴 CRITICAL: Uses Firestore transaction to prevent race conditions
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
exports.enrollEmployeesInMasterclass = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.enrollEmployeesInMasterclass = v2_1.https.onCall({
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 10, // Limit concurrent enrollments
    timeoutSeconds: 180, // 3 minutes for bulk enrollments
    cors: true,
}, async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, masterclassId, employeeIds } = request.data;
    const userId = request.auth.uid;
    // Validation
    if (!companyId || !masterclassId || !Array.isArray(employeeIds)) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    if (employeeIds.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'At least one employee must be selected');
    }
    if (employeeIds.length > 100) {
        throw new https_1.HttpsError('invalid-argument', 'Cannot enroll more than 100 employees at once');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        const adminData = adminDoc.data();
        if (!adminData?.permissions?.canManageEmployees) {
            throw new https_1.HttpsError('permission-denied', 'No permission to manage employees');
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
            throw new https_1.HttpsError('not-found', 'Masterclass not found for this company');
        }
        const masterclassDocRef = masterclassQuery.docs[0].ref;
        const masterclassDoc = await transaction.get(masterclassDocRef);
        const masterclassData = masterclassDoc.data();
        if (!masterclassData) {
            throw new https_1.HttpsError('not-found', 'Masterclass data not found');
        }
        // 3. Check available seats ATOMICALLY
        const availableSeats = masterclassData.seats?.available || 0;
        if (employeeIds.length > availableSeats) {
            throw new https_1.HttpsError('failed-precondition', `Only ${availableSeats} seats available. You tried to enroll ${employeeIds.length} employees.`);
        }
        // 4. Update seat count in SAME transaction (prevents race condition)
        transaction.update(masterclassDocRef, {
            'seats.used': admin.firestore.FieldValue.increment(employeeIds.length),
            'seats.available': admin.firestore.FieldValue.increment(-employeeIds.length),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 5. Enroll each employee (in transaction)
        const enrolledEmployees = [];
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
            const employeeData = employeeDoc.data();
            // Check if already enrolled
            const alreadyEnrolled = employeeData.enrolledMasterclasses?.some((e) => e.masterclassId === masterclassDocRef.id);
            if (alreadyEnrolled) {
                console.warn(`Employee ${employeeId} already enrolled in ${masterclassDocRef.id}, skipping`);
                continue;
            }
            // Check if employee has userId (has accepted invite)
            if (!employeeData.userId) {
                console.warn(`Employee ${employeeId} has not accepted invite yet, skipping`);
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
            const progressData = {
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
});
//# sourceMappingURL=enrollEmployees.js.map