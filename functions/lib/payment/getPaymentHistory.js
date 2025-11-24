"use strict";
/**
 * Get Payment History
 * Returns user's payment history with optional filtering
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
exports.getPaymentHistory = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
exports.getPaymentHistory = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    cors: true,
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const userId = request.auth.uid;
    const { limit = 50, status, startDate, endDate } = (request.data || {});
    v2_1.logger.info('📋 [getPaymentHistory] Fetching payment history', {
        userId,
        limit,
        status,
        startDate,
        endDate,
    });
    try {
        const db = admin.firestore();
        // Build query
        let query = db
            .collection('payments')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc');
        // Apply status filter
        if (status) {
            query = query.where('status', '==', status);
        }
        // Apply date filters (Note: Firestore has limitations on multiple inequalities)
        // For simplicity, we'll filter dates in memory after fetching
        const paymentsSnapshot = await query.limit(limit).get();
        let payments = paymentsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                courseId: data.courseId,
                amount: data.amount || 0,
                currency: data.currency || 'huf',
                status: data.status || 'pending',
                description: data.description || '',
                paymentIntentId: data.paymentIntentId,
                sessionId: data.sessionId,
                createdAt: data.createdAt?.toDate()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
                completedAt: data.completedAt?.toDate()?.toISOString() || null,
                failedAt: data.failedAt?.toDate()?.toISOString() || null,
                failureReason: data.failureReason,
                refundedAt: data.refundedAt?.toDate()?.toISOString() || null,
                refundAmount: data.refundAmount,
                refundReason: data.refundReason,
            };
        });
        // Apply date filters in memory
        if (startDate) {
            const start = new Date(startDate);
            payments = payments.filter((p) => p.createdAt && new Date(p.createdAt) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            payments = payments.filter((p) => p.createdAt && new Date(p.createdAt) <= end);
        }
        v2_1.logger.info('📋 [getPaymentHistory] Found payments', {
            userId,
            count: payments.length,
        });
        return {
            success: true,
            payments,
            total: payments.length,
        };
    }
    catch (error) {
        v2_1.logger.error('❌ [getPaymentHistory] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get payment history',
            payments: [],
            total: 0,
        };
    }
});
//# sourceMappingURL=getPaymentHistory.js.map