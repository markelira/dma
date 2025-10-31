/**
 * Create Stripe Checkout Session
 *
 * Handles creation of Stripe checkout sessions for:
 * - Team subscriptions (monthly, 6-month, 12-month)
 * - Individual course purchases
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';
import * as z from 'zod';

const firestore = admin.firestore();

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
const CreateCheckoutSessionSchema = z.object({
  priceId: z.string().min(1), // Stripe price ID for subscriptions
  courseId: z.string().optional(), // For course purchases
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  mode: z.enum(['payment', 'subscription']).default('subscription'),
  metadata: z.record(z.string()).optional()
});

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Input validation
    const validatedData = CreateCheckoutSessionSchema.parse(request.data);

    logger.info(`Creating checkout session for user: ${userId}`);

    // Get user document
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('Felhasználói adatok nem találhatók');
    }

    // Get or create Stripe customer
    let stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      logger.info('Creating new Stripe customer');
      const stripeInstance = getStripeInstance();
      const customer = await stripeInstance.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        metadata: {
          firebaseUserId: userId
        }
      });

      stripeCustomerId = customer.id;

      // Save customer ID to user document
      await firestore.collection('users').doc(userId).update({
        stripeCustomerId: customer.id,
        updatedAt: new Date().toISOString()
      });
    }

    // Prepare session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: validatedData.mode,
      success_url: validatedData.successUrl,
      cancel_url: validatedData.cancelUrl,
      locale: 'hu',
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      metadata: {
        userId,
        ...validatedData.metadata
      }
    };

    // Add line items based on mode
    if (validatedData.mode === 'subscription') {
      // Subscription mode - use price ID
      sessionParams.line_items = [{
        price: validatedData.priceId,
        quantity: 1
      }];

      // Add trial period (7 days)
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: {
          userId
        }
      };
    } else if (validatedData.mode === 'payment' && validatedData.courseId) {
      // One-time payment mode for course purchase
      const courseDoc = await firestore.collection('courses').doc(validatedData.courseId).get();
      if (!courseDoc.exists) {
        throw new Error('Kurzus nem található');
      }

      const course = courseDoc.data();
      if (!course) {
        throw new Error('Kurzus adatok nem találhatók');
      }

      sessionParams.line_items = [{
        price_data: {
          currency: 'huf',
          product_data: {
            name: course.title,
            description: course.description?.substring(0, 500),
            images: course.thumbnail ? [course.thumbnail] : [],
            metadata: {
              courseId: validatedData.courseId
            }
          },
          unit_amount: Math.round(course.price * 100) // Convert to cents
        },
        quantity: 1
      }];

      sessionParams.payment_intent_data = {
        metadata: {
          userId,
          courseId: validatedData.courseId
        }
      };
    } else {
      throw new Error('Érvénytelen paraméterek');
    }

    // Create checkout session
    const stripeInstance = getStripeInstance();
    const session = await stripeInstance.checkout.sessions.create(sessionParams);

    // Log checkout session to Firestore
    await firestore.collection('checkoutSessions').add({
      sessionId: session.id,
      userId,
      courseId: validatedData.courseId || null,
      priceId: validatedData.priceId,
      mode: validatedData.mode,
      status: 'pending',
      amount: session.amount_total,
      currency: session.currency,
      createdAt: new Date().toISOString()
    });

    logger.info(`Checkout session created: ${session.id}`);

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };

  } catch (error: any) {
    logger.error('Create checkout session error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen paraméterek',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Checkout session létrehozása sikertelen'
    };
  }
});
