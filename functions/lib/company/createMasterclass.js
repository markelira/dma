"use strict";
/**
 * Create Company Masterclass (Manual Purchase for MVP)
 * In MVP: Admin manually adds masterclass seats without payment integration
 * Post-MVP: Will integrate with Stripe for automatic payment
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
exports.createCompanyMasterclass = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.createCompanyMasterclass = v2_1.https.onCall({
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 10, // Limit concurrent purchases
    timeoutSeconds: 120, // 2 minutes timeout
    cors: true,
}, async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, masterclassId, seatCount, startDate } = request.data;
    const userId = request.auth.uid;
    // Validation
    if (!companyId || !masterclassId || !seatCount || !startDate) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    if (seatCount < 1 || seatCount > 1000) {
        throw new https_1.HttpsError('invalid-argument', 'Seat count must be between 1 and 1000');
    }
    // Verify admin permission
    const adminRef = db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId);
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists) {
        throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
    }
    // Get masterclass details from global masterclasses collection
    // For MVP, we'll use hardcoded data since global masterclasses might not exist yet
    const masterclassRef = db.collection('masterclasses').doc(masterclassId);
    const masterclassDoc = await masterclassRef.get();
    let masterclassTitle = 'AI-Powered Copywriting Masterclass';
    let masterclassDuration = 8; // weeks
    let pricePerSeat = 89990; // Ft (from the price fix you did earlier)
    if (masterclassDoc.exists) {
        const data = masterclassDoc.data();
        masterclassTitle = data?.title || masterclassTitle;
        masterclassDuration = data?.duration || masterclassDuration;
        pricePerSeat = data?.pricePerSeat || pricePerSeat;
    }
    // Calculate dates
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (masterclassDuration * 7)); // duration in weeks
    // Create company masterclass
    const companyMasterclassData = {
        companyId,
        masterclassId,
        title: masterclassTitle,
        duration: masterclassDuration,
        seats: {
            purchased: seatCount,
            used: 0,
            available: seatCount,
        },
        pricePerSeat,
        totalPaid: pricePerSeat * seatCount,
        paymentStatus: 'manual', // MVP: No payment integration
        startDate: admin.firestore.Timestamp.fromDate(start),
        endDate: admin.firestore.Timestamp.fromDate(end),
        status: start > new Date() ? 'scheduled' : 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const companyMasterclassRef = await db
        .collection('companies')
        .doc(companyId)
        .collection('masterclasses')
        .add(companyMasterclassData);
    console.log(`Created company masterclass ${companyMasterclassRef.id} for company ${companyId}: ${seatCount} seats`);
    return {
        success: true,
        masterclassId: companyMasterclassRef.id,
        message: `Successfully added ${seatCount} seats for ${masterclassTitle}`,
    };
});
//# sourceMappingURL=createMasterclass.js.map