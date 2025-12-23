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
exports.getPendingRegistration = void 0;
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
/**
 * Get pending registration state from Firestore
 * Returns the saved registration state for recovery
 * Also checks if user already completed registration (cleanup)
 */
exports.getPendingRegistration = v2_1.https.onCall({
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
    try {
        // Check if user already has completed registration
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.companyId) {
                // User has completed registration - clean up pending if exists
                const pendingRef = db.collection('pendingRegistrations').doc(userId);
                const pendingDoc = await pendingRef.get();
                if (pendingDoc.exists) {
                    await pendingRef.delete();
                    console.log(`🧹 [PendingReg] Cleaned up pending registration for completed user: ${userId}`);
                }
                return {
                    found: false,
                    alreadyCompleted: true
                };
            }
        }
        // Get pending registration
        const pendingDoc = await db.collection('pendingRegistrations').doc(userId).get();
        if (!pendingDoc.exists) {
            return { found: false };
        }
        const data = pendingDoc.data();
        // Check if expired
        if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
            // Expired - delete and return not found
            await pendingDoc.ref.delete();
            console.log(`🧹 [PendingReg] Deleted expired pending registration for user: ${userId}`);
            return { found: false };
        }
        console.log(`📝 [PendingReg] Resumed for user: ${userId}, step: ${data.currentStep}`);
        return {
            found: true,
            data
        };
    }
    catch (error) {
        console.error('❌ [PendingReg] Error getting pending registration:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to get pending registration: ${error.message}`);
    }
});
//# sourceMappingURL=getPendingRegistration.js.map