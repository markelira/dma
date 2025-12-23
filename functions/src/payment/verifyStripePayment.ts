/**
 * Verify Stripe Payment
 *
 * Verifies if a Stripe checkout session payment was completed.
 * Used for registration recovery when user returns after browser crash/close.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';
import * as z from 'zod';

// Lazy Stripe initialization - will be initialized on first request
let stripe: Stripe | null = null;

/**
 * Initialize Stripe instance (lazy initialization)
 */
function getStripeInstance(): Stripe {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-10-28.acacia' as any,
    });
  }
  return stripe;
}

// Input validation schema
const VerifyPaymentSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
});

interface VerifyPaymentResponse {
  paymentComplete: boolean;
  subscriptionId?: string;
  customerId?: string;
  sessionStatus?: string;
  paymentStatus?: string;
}

/**
 * Verify if a Stripe checkout session payment was completed
 */
export const verifyStripePayment = onCall<{ sessionId: string }>({
  cors: [
    'https://masterclass.dma.hu',
    'https://academion.hu',
    'https://dmaapp-477d4.web.app',
    'https://dmaapp-477d4.firebaseapp.com',
    'http://localhost:3000'
  ],
  region: 'europe-west1',
  memory: '256MiB',
}, async (request): Promise<VerifyPaymentResponse> => {
  try {
    logger.info('🔵 [VerifyPayment] Called');

    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    logger.info(`✅ [VerifyPayment] User authenticated: ${userId}`);

    // Input validation
    const validatedData = VerifyPaymentSchema.parse(request.data);
    const { sessionId } = validatedData;

    logger.info(`🔵 [VerifyPayment] Checking session: ${sessionId}`);

    // Get Stripe session
    const stripeInstance = getStripeInstance();
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    logger.info(`📝 [VerifyPayment] Session status: ${session.status}, payment_status: ${session.payment_status}`);

    // Verify the session belongs to this user (check metadata)
    const sessionUserId = session.metadata?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      logger.warn(`⚠️ [VerifyPayment] Session userId mismatch: expected ${userId}, got ${sessionUserId}`);
      throw new HttpsError('permission-denied', 'Session does not belong to this user');
    }

    // Check if payment is complete
    // For subscriptions with trial, status is 'complete' and payment_status may be 'no_payment_required'
    const paymentComplete =
      session.status === 'complete' &&
      (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

    const result: VerifyPaymentResponse = {
      paymentComplete,
      sessionStatus: session.status || undefined,
      paymentStatus: session.payment_status || undefined,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
      customerId: typeof session.customer === 'string' ? session.customer : undefined
    };

    if (paymentComplete) {
      logger.info(`✅ [VerifyPayment] Payment verified for user: ${userId}`);
    } else {
      logger.info(`⏳ [VerifyPayment] Payment not yet complete for user: ${userId}`);
    }

    return result;
  } catch (error: any) {
    logger.error('❌ [VerifyPayment] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }

    // Stripe specific errors
    if (error.type === 'StripeInvalidRequestError') {
      throw new HttpsError('not-found', 'Checkout session not found');
    }

    throw new HttpsError('internal', `Failed to verify payment: ${error.message}`);
  }
});
