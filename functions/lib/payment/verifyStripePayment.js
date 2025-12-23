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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyStripePayment = void 0;
/**
 * Verify Stripe Payment
 *
 * Verifies if a Stripe checkout session payment was completed.
 * Used for registration recovery when user returns after browser crash/close.
 */
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
const z = __importStar(require("zod"));
// Lazy Stripe initialization - will be initialized on first request
let stripe = null;
/**
 * Initialize Stripe instance (lazy initialization)
 */
function getStripeInstance() {
    if (!stripe) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2024-10-28.acacia',
        });
    }
    return stripe;
}
// Input validation schema
const VerifyPaymentSchema = z.object({
    sessionId: z.string().min(1, 'Session ID is required')
});
/**
 * Verify if a Stripe checkout session payment was completed
 */
exports.verifyStripePayment = (0, https_1.onCall)({
    cors: [
        'https://masterclass.dma.hu',
        'https://academion.hu',
        'https://dmaapp-477d4.web.app',
        'https://dmaapp-477d4.firebaseapp.com',
        'http://localhost:3000'
    ],
    region: 'europe-west1',
    memory: '256MiB',
}, async (request) => {
    try {
        v2_1.logger.info('🔵 [VerifyPayment] Called');
        // Authentication check
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userId = request.auth.uid;
        v2_1.logger.info(`✅ [VerifyPayment] User authenticated: ${userId}`);
        // Input validation
        const validatedData = VerifyPaymentSchema.parse(request.data);
        const { sessionId } = validatedData;
        v2_1.logger.info(`🔵 [VerifyPayment] Checking session: ${sessionId}`);
        // Get Stripe session
        const stripeInstance = getStripeInstance();
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
        v2_1.logger.info(`📝 [VerifyPayment] Session status: ${session.status}, payment_status: ${session.payment_status}`);
        // Verify the session belongs to this user (check metadata)
        const sessionUserId = session.metadata?.userId;
        if (sessionUserId && sessionUserId !== userId) {
            v2_1.logger.warn(`⚠️ [VerifyPayment] Session userId mismatch: expected ${userId}, got ${sessionUserId}`);
            throw new https_1.HttpsError('permission-denied', 'Session does not belong to this user');
        }
        // Check if payment is complete
        // For subscriptions with trial, status is 'complete' and payment_status may be 'no_payment_required'
        const paymentComplete = session.status === 'complete' &&
            (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
        const result = {
            paymentComplete,
            sessionStatus: session.status || undefined,
            paymentStatus: session.payment_status || undefined,
            subscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
            customerId: typeof session.customer === 'string' ? session.customer : undefined
        };
        if (paymentComplete) {
            v2_1.logger.info(`✅ [VerifyPayment] Payment verified for user: ${userId}`);
        }
        else {
            v2_1.logger.info(`⏳ [VerifyPayment] Payment not yet complete for user: ${userId}`);
        }
        return result;
    }
    catch (error) {
        v2_1.logger.error('❌ [VerifyPayment] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        if (error instanceof z.ZodError) {
            throw new https_1.HttpsError('invalid-argument', `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        // Stripe specific errors
        if (error.type === 'StripeInvalidRequestError') {
            throw new https_1.HttpsError('not-found', 'Checkout session not found');
        }
        throw new https_1.HttpsError('internal', `Failed to verify payment: ${error.message}`);
    }
});
//# sourceMappingURL=verifyStripePayment.js.map