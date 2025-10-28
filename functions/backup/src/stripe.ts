import { onCall, onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as z from 'zod';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { stripeService } from './services/stripeService';

// Set global options for functions
setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 100
});

const config = admin.app().options;
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2023-10-16' }
);

// Input validation schemas
const CreateCheckoutSessionSchema = z.object({
  courseId: z.string().optional(),
  priceId: z.string().optional(),
  mode: z.enum(['payment', 'subscription']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional()
});

const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional()
  }).optional()
});

const CreateSubscriptionSchema = z.object({
  priceId: z.string(),
  metadata: z.record(z.string()).optional()
});

const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string()
});

const CreateRefundSchema = z.object({
  paymentIntentId: z.string(),
  amount: z.number().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional()
});

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Input validation
    const validatedData = CreateCheckoutSessionSchema.parse(request.data);

    // Check user permissions
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      userId,
      courseId: validatedData.courseId,
      priceId: validatedData.priceId,
      mode: validatedData.mode,
      successUrl: validatedData.successUrl,
      cancelUrl: validatedData.cancelUrl,
      metadata: validatedData.metadata
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Create or get Stripe customer
 */
export const createCustomer = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Input validation
    const validatedData = CreateCustomerSchema.parse(request.data);

    // Create or get customer
    const customer = await stripeService.createOrGetCustomer({
      userId,
      email: validatedData.email,
      name: validatedData.name,
      phone: validatedData.phone,
      address: validatedData.address
    });

    return {
      success: true,
      data: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      }
    };

  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Create subscription
 */
export const createSubscription = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Input validation
    const validatedData = CreateSubscriptionSchema.parse(request.data);

    // Get user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      throw new Error('User has no Stripe customer ID');
    }

    // Create subscription
    const subscription = await stripeService.createSubscription(
      userData.stripeCustomerId,
      validatedData.priceId,
      { userId, ...validatedData.metadata }
    );

    return {
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent && typeof (subscription.latest_invoice as Stripe.Invoice).payment_intent === 'object' 
          ? ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent)?.client_secret 
          : undefined
      }
    };

  } catch (error) {
    console.error('Error creating subscription:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Cancel subscription
 */
export const cancelSubscription = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Input validation
    const validatedData = CancelSubscriptionSchema.parse(request.data);

    // Verify subscription belongs to user
    const subscription = await stripe.subscriptions.retrieve(validatedData.subscriptionId);
    
    if (subscription.metadata.userId !== userId) {
      throw new Error('Unauthorized to cancel this subscription');
    }

    // Cancel subscription
    const cancelledSubscription = await stripeService.cancelSubscription(validatedData.subscriptionId);

    return {
      success: true,
      data: {
        subscriptionId: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
        currentPeriodEnd: cancelledSubscription.current_period_end
      }
    };

  } catch (error) {
    console.error('Error cancelling subscription:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Create refund
 */
export const createRefund = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .get();

    const userData = userDoc.data();

    if (!userData || !['admin', 'university_admin'].includes(userData.role)) {
      throw new Error('Insufficient permissions');
    }

    // Input validation
    const validatedData = CreateRefundSchema.parse(request.data);

    // Create refund
    const refund = await stripeService.createRefund(
      validatedData.paymentIntentId,
      validatedData.amount,
      validatedData.reason
    );

    return {
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason
      }
    };

  } catch (error) {
    console.error('Error creating refund:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Get user payment methods
 */
export const getPaymentMethods = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Get user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return {
        success: true,
        data: { paymentMethods: [] }
      };
    }

    // Get payment methods
    const paymentMethods = await stripeService.getPaymentMethods(userData.stripeCustomerId);

    return {
      success: true,
      data: {
        paymentMethods: paymentMethods.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          } : null
        }))
      }
    };

  } catch (error) {
    console.error('Error getting payment methods:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Create setup intent for saving payment method
 */
export const createSetupIntent = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Get user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      throw new Error('User has no Stripe customer ID');
    }

    // Create setup intent
    const setupIntent = await stripeService.createSetupIntent(userData.stripeCustomerId);

    return {
      success: true,
      data: {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret
      }
    };

  } catch (error) {
    console.error('Error creating setup intent:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Get user subscriptions
 */
export const getUserSubscriptions = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const userId = request.auth.uid;

    // Get user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return {
        success: true,
        data: { subscriptions: [] }
      };
    }

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    return {
      success: true,
      data: {
        subscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          items: sub.items.data.map(item => ({
            id: item.id,
            priceId: item.price.id,
            productId: item.price.product,
            amount: item.price.unit_amount,
            currency: item.price.currency,
            interval: item.price.recurring?.interval
          }))
        }))
      }
    };

  } catch (error) {
    console.error('Error getting user subscriptions:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

/**
 * Stripe webhook handler
 */
export const stripeWebhook = onRequest(async (request, response) => {
  try {
    const sig = request.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!sig || !webhookSecret) {
      console.error('Missing stripe signature or webhook secret');
      response.status(400).send('Webhook signature verification failed');
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      response.status(400).send('Webhook signature verification failed');
      return;
    }

    console.log('Processing webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await stripeService.handlePaymentSuccess(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // Update payment record
        const paymentsQuery = await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', paymentIntent.id)
          .get();

        paymentsQuery.forEach(async (doc) => {
          await doc.ref.update({
            status: 'completed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        
        // Update payment record
        const paymentsQuery = await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', paymentIntent.id)
          .get();

        paymentsQuery.forEach(async (doc) => {
          await doc.ref.update({
            status: 'failed',
            failureReason: paymentIntent.last_payment_error?.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          await admin.firestore()
            .collection('subscriptions')
            .doc(subscription.id)
            .set({
              userId,
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              status: subscription.status,
              currentPeriodStart: subscription.current_period_start,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              priceId: subscription.items.data[0]?.price.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await admin.firestore()
          .collection('subscriptions')
          .doc(subscription.id)
          .update({
            status: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    response.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    response.status(500).send('Internal server error');
  }
});