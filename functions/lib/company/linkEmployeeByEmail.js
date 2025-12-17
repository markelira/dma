"use strict";
/**
 * Link Employee By Email
 *
 * Automatically links a newly registered user to a company if they were invited.
 * Called during user registration to seamlessly onboard company employees.
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
exports.linkEmployeeByEmail = linkEmployeeByEmail;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
/**
 * Link a newly registered user to a company if they have a pending invite
 *
 * @param userId - The Firebase Auth UID of the newly registered user
 * @param email - The email address of the user
 * @returns Result indicating if linking was successful
 */
async function linkEmployeeByEmail(userId, email) {
    console.log('🔗 [linkEmployeeByEmail] Checking for pending invite...', {
        userId,
        email: email.substring(0, 5) + '...',
    });
    try {
        // 1. Query employees collection group for matching email with status='invited'
        const employeeQuery = await db
            .collectionGroup('employees')
            .where('email', '==', email.toLowerCase())
            .where('status', '==', 'invited')
            .limit(1)
            .get();
        if (employeeQuery.empty) {
            console.log('ℹ️ [linkEmployeeByEmail] No pending invite found for email');
            return {
                linked: false,
                message: 'No pending invite found',
            };
        }
        const employeeDoc = employeeQuery.docs[0];
        const employeeData = employeeDoc.data();
        const employeeRef = employeeDoc.ref;
        const employeeId = employeeDoc.id;
        const companyId = employeeData.companyId;
        console.log('✅ [linkEmployeeByEmail] Found pending invite:', {
            employeeId,
            companyId,
            invitedAt: employeeData.invitedAt,
        });
        // 2. Check if invite has expired
        const now = new Date();
        const expiresAt = employeeData.inviteExpiresAt?.toDate();
        if (expiresAt && expiresAt < now) {
            console.log('⚠️ [linkEmployeeByEmail] Invite has expired');
            return {
                linked: false,
                message: 'Invite has expired',
            };
        }
        // 3. Get company name for response
        const companyDoc = await db.collection('companies').doc(companyId).get();
        const companyData = companyDoc.data();
        const companyName = companyData?.name || 'Unknown Company';
        const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];
        // 4. Prepare all Firestore updates in a single batch (reduces network round-trips)
        const batch = db.batch();
        const userRef = db.collection('users').doc(userId);
        // Employee document update
        batch.update(employeeRef, {
            userId,
            status: 'active',
            inviteAcceptedAt: firestore_1.FieldValue.serverTimestamp(),
            inviteToken: firestore_1.FieldValue.delete(),
            inviteExpiresAt: firestore_1.FieldValue.delete(),
            ...(purchasedMasterclasses.length > 0 && { enrolledMasterclasses: purchasedMasterclasses }),
        });
        // User document update
        batch.update(userRef, {
            companyId: companyId,
            companyRole: 'employee',
            role: 'COMPANY_EMPLOYEE',
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // Auto-enroll in company-purchased masterclasses (progress records)
        for (const masterclassId of purchasedMasterclasses) {
            const progressId = `${userId}_${masterclassId}`;
            const progressRef = db.collection('userProgress').doc(progressId);
            batch.set(progressRef, {
                userId,
                masterclassId,
                companyId,
                currentModule: 1,
                completedModules: [],
                status: 'active',
                enrolledAt: firestore_1.FieldValue.serverTimestamp(),
                lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        // 5. Run batch commit and custom claims in parallel
        const claimsPromise = admin.auth().setCustomUserClaims(userId, {
            role: 'COMPANY_EMPLOYEE',
            companyId: companyId,
            companyRole: 'employee',
        }).catch((err) => {
            console.error('❌ [linkEmployeeByEmail] Error setting custom claims:', err.message);
        });
        await Promise.all([batch.commit(), claimsPromise]);
        console.log('✅ [linkEmployeeByEmail] Batch updates + custom claims completed');
        if (purchasedMasterclasses.length > 0) {
            console.log(`✅ [linkEmployeeByEmail] Auto-enrolled in ${purchasedMasterclasses.length} masterclasses`);
        }
        // 6. Log activity (fire-and-forget, non-blocking)
        db.collection('companies').doc(companyId).collection('activity').add({
            type: 'employee_joined',
            employeeId,
            userId,
            employeeName: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
            joinedVia: 'registration',
            timestamp: firestore_1.FieldValue.serverTimestamp(),
        }).catch(() => { });
        console.log('🎉 [linkEmployeeByEmail] Employee successfully linked to company');
        return {
            linked: true,
            companyId,
            companyName,
            employeeId,
            message: `Successfully joined ${companyName}`,
        };
    }
    catch (error) {
        console.error('❌ [linkEmployeeByEmail] Error:', error);
        return {
            linked: false,
            message: error.message || 'Error linking employee',
        };
    }
}
//# sourceMappingURL=linkEmployeeByEmail.js.map