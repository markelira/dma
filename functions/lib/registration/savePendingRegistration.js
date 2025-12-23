"use strict";
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
exports.savePendingRegistration = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
/**
 * Save pending registration state to Firestore
 * Replaces sessionStorage for persistence across browser sessions
 * Auto-expires after 7 days if not completed
 */
exports.savePendingRegistration = v2_1.https.onCall({
    region: 'europe-west1',
    memory: '256MiB',
    cors: [
        'https://masterclass.dma.hu',
        'https://academion.hu',
        'https://dmaapp-477d4.web.app',
        'https://dmaapp-477d4.firebaseapp.com',
        'http://localhost:3000'
    ]
}, async (request) => {
    const db = admin.firestore();
    // Require authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { firstName, lastName, email, phone, companyName, currentStep, pendingEmployees, stripeSessionId, stripeCustomerId } = request.data;
    // Validate required fields
    if (!email?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Email is required');
    }
    if (currentStep < 1 || currentStep > 3) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid step number');
    }
    try {
        const now = firestore_1.Timestamp.now();
        const expiresAt = firestore_1.Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const pendingData = {
            odingUserId: userId,
            email: email.trim().toLowerCase(),
            firstName: firstName?.trim() || '',
            lastName: lastName?.trim() || '',
            phone: phone?.trim() || '',
            companyName: companyName?.trim() || '',
            currentStep,
            pendingEmployees: pendingEmployees || [],
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            expiresAt
        };
        // Only add Stripe fields if provided
        if (stripeSessionId) {
            pendingData.stripeSessionId = stripeSessionId;
        }
        if (stripeCustomerId) {
            pendingData.stripeCustomerId = stripeCustomerId;
        }
        // Check if document exists (for logging)
        const existingDoc = await db.collection('pendingRegistrations').doc(userId).get();
        const isNew = !existingDoc.exists;
        if (isNew) {
            pendingData.createdAt = firestore_1.FieldValue.serverTimestamp();
        }
        // Upsert the pending registration
        await db.collection('pendingRegistrations').doc(userId).set(pendingData, { merge: true });
        console.log(`📝 [PendingReg] ${isNew ? 'Created' : 'Updated'} for user: ${userId}, step: ${currentStep}`);
        return {
            success: true,
            message: isNew ? 'Pending registration created' : 'Pending registration updated'
        };
    }
    catch (error) {
        console.error('❌ [PendingReg] Error saving pending registration:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to save pending registration: ${error.message}`);
    }
});
//# sourceMappingURL=savePendingRegistration.js.map