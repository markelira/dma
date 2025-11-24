/**
 * Get Payment History
 * Returns user's payment history with optional filtering
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

interface PaymentHistoryFilter {
  limit?: number;
  status?: 'completed' | 'pending' | 'failed' | 'refunded';
  startDate?: string;
  endDate?: string;
}

export const getPaymentHistory = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    cors: true,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const userId = request.auth.uid;
    const { limit = 50, status, startDate, endDate } = (request.data || {}) as PaymentHistoryFilter;

    logger.info('📋 [getPaymentHistory] Fetching payment history', {
      userId,
      limit,
      status,
      startDate,
      endDate,
    });

    try {
      const db = admin.firestore();

      // Build query
      let query: FirebaseFirestore.Query = db
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

      logger.info('📋 [getPaymentHistory] Found payments', {
        userId,
        count: payments.length,
      });

      return {
        success: true,
        payments,
        total: payments.length,
      };
    } catch (error) {
      logger.error('❌ [getPaymentHistory] Error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment history',
        payments: [],
        total: 0,
      };
    }
  }
);
