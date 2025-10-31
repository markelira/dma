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
exports.handlePaymentSuccess = handlePaymentSuccess;
/**
 * Handle Payment Success
 *
 * Called by webhook after successful payment completion
 * Handles:
 * - Course enrollment after one-time purchase
 * - Payment record creation
 * - Email notifications (future enhancement)
 */
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const firestore = admin.firestore();
/**
 * Handle successful payment from Stripe checkout session
 */
async function handlePaymentSuccess(session) {
    try {
        const { userId, courseId } = session.metadata || {};
        if (!userId) {
            v2_1.logger.error('No userId in session metadata');
            throw new Error('userId kötelező a session metadata-ban');
        }
        v2_1.logger.info(`Processing payment success for user: ${userId}, session: ${session.id}`);
        // Create payment record in Firestore
        const paymentData = {
            userId,
            courseId: courseId || null,
            sessionId: session.id,
            paymentIntentId: session.payment_intent || null,
            subscriptionId: session.subscription || null,
            amount: session.amount_total,
            currency: session.currency,
            status: 'completed',
            mode: session.mode,
            customerEmail: session.customer_email,
            createdAt: new Date().toISOString()
        };
        const paymentRef = await firestore.collection('payments').add(paymentData);
        v2_1.logger.info(`Payment record created: ${paymentRef.id}`);
        // Update checkout session status
        const checkoutSessionsSnapshot = await firestore
            .collection('checkoutSessions')
            .where('sessionId', '==', session.id)
            .limit(1)
            .get();
        if (!checkoutSessionsSnapshot.empty) {
            const checkoutSessionDoc = checkoutSessionsSnapshot.docs[0];
            await checkoutSessionDoc.ref.update({
                status: 'completed',
                completedAt: new Date().toISOString()
            });
        }
        // If course purchase, create enrollment
        if (courseId && session.mode === 'payment') {
            await createEnrollment(userId, courseId);
            v2_1.logger.info(`Enrollment created for user: ${userId}, course: ${courseId}`);
        }
        // For subscriptions, the webhook handler in stripe/webhook.ts handles team subscriptions
        v2_1.logger.info(`Payment success handling completed for session: ${session.id}`);
    }
    catch (error) {
        v2_1.logger.error('Handle payment success error:', error);
        throw error;
    }
}
/**
 * Create course enrollment after successful purchase
 */
async function createEnrollment(userId, courseId) {
    try {
        const enrollmentId = `${userId}_${courseId}`;
        // Check if enrollment already exists
        const existingEnrollment = await firestore
            .collection('enrollments')
            .doc(enrollmentId)
            .get();
        if (existingEnrollment.exists) {
            v2_1.logger.info(`Enrollment already exists: ${enrollmentId}`);
            return;
        }
        // Get course data
        const courseDoc = await firestore.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) {
            throw new Error(`Kurzus nem található: ${courseId}`);
        }
        const courseData = courseDoc.data();
        // Create enrollment document
        await firestore.collection('enrollments').doc(enrollmentId).set({
            userId,
            courseId,
            enrolledAt: new Date().toISOString(),
            status: 'active',
            progress: 0,
            completedLessons: [],
            lastAccessedAt: new Date().toISOString(),
            completedAt: null
        });
        // Update course enrollment count
        await firestore.collection('courses').doc(courseId).update({
            enrollmentCount: admin.firestore.FieldValue.increment(1),
            updatedAt: new Date().toISOString()
        });
        // Update user's enrolled courses list
        await firestore.collection('users').doc(userId).update({
            enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
            updatedAt: new Date().toISOString()
        });
        v2_1.logger.info(`Enrollment created successfully: ${enrollmentId}`);
    }
    catch (error) {
        v2_1.logger.error('Create enrollment error:', error);
        throw error;
    }
}
//# sourceMappingURL=handlePaymentSuccess.js.map