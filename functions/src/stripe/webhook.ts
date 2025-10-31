/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe webhook events for subscription management and team creation.
 * Automatically creates teams when users subscribe and manages subscription lifecycle.
 */

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';
import { createTeam, updateTeamSubscription } from '../team/createTeam';
import {
  SubscriptionPlan,
  stripePriceIdToPlan,
  calculateSubscriptionEndDate,
  calculateTrialEndDate,
} from '../types/team';
import { handlePaymentSuccess } from '../payment/handlePaymentSuccess';

const firestore = admin.firestore();

// Lazy Stripe initialization - will be initialized on first request
let stripe: Stripe | null = null;
let stripeWebhookSecret: string | null = null;

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

/**
 * Get webhook secret (lazy initialization)
 */
function getWebhookSecret(): string {
  if (!stripeWebhookSecret) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    }
    stripeWebhookSecret = secret;
  }
  return stripeWebhookSecret;
}

/**
 * Stripe Webhook Handler
 * Endpoint: /stripeWebhook
 */
export const stripeWebhook = onRequest({
  cors: true,
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
}, async (req, res) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      logger.error('[stripeWebhook] No Stripe signature found');
      res.status(400).send('No Stripe signature found');
      return;
    }

    // Initialize Stripe and get webhook secret
    let stripeInstance: Stripe;
    let webhookSecret: string;

    try {
      stripeInstance = getStripeInstance();
      webhookSecret = getWebhookSecret();
    } catch (error: any) {
      logger.error('[stripeWebhook] Stripe configuration error:', error.message);
      res.status(500).send('Stripe not configured');
      return;
    }

    // Verify webhook signature
    let event: Stripe.Event;

    try {
      const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      event = stripeInstance.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      logger.error('[stripeWebhook] Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    logger.info('[stripeWebhook] Event received', {
      type: event.type,
      id: event.id,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, stripeInstance);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, stripeInstance);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info('[stripeWebhook] Unhandled event type:', event.type);
    }

    // Return success response
    res.status(200).json({ received: true });

  } catch (error: any) {
    logger.error('[stripeWebhook] Error processing webhook:', error);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Handle checkout.session.completed
 * Creates team when user successfully subscribes OR
 * Creates enrollment when user purchases a course
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, stripe: Stripe): Promise<void> {
  try {
    logger.info('[handleCheckoutSessionCompleted] Processing session', {
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
      mode: session.mode,
    });

    // Handle subscription mode - create team
    if (session.mode === 'subscription') {
      await handleSubscriptionCheckout(session, stripe);
      return;
    }

    // Handle payment mode - course purchase
    if (session.mode === 'payment') {
      await handlePaymentSuccess(session);
      return;
    }

    logger.warn('[handleCheckoutSessionCompleted] Unknown session mode:', session.mode);

  } catch (error: any) {
    logger.error('[handleCheckoutSessionCompleted] Error:', error);
    throw error;
  }
}

/**
 * Handle subscription checkout - creates team
 */
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session, stripe: Stripe): Promise<void> {
  try {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const userEmail = session.customer_email || session.customer_details?.email;

    // Get metadata from session
    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;

    if (!userId) {
      throw new Error('User ID not found in session metadata');
    }

    if (!priceId) {
      throw new Error('Price ID not found in session metadata');
    }

    // Get subscription plan from price ID
    const subscriptionPlan = stripePriceIdToPlan(priceId);

    // Get user details
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new Error(`User not found: ${userId}`);
    }

    const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      userEmail ||
      'DMA Team';

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = calculateSubscriptionEndDate(startDate, subscriptionPlan);

    // Get trial end date from subscription if available
    let trialEndDate = calculateTrialEndDate(startDate);
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.trial_end) {
          trialEndDate = new Date(subscription.trial_end * 1000);
        }
      } catch (error) {
        logger.warn('Could not retrieve trial_end from subscription, using default');
      }
    }

    // Create team
    await createTeam({
      name: `${userName} csapata`,
      ownerId: userId,
      ownerEmail: userData.email || userEmail || '',
      ownerName: userName,
      subscriptionPlan,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      trialEndDate,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
    });

    logger.info('[handleSubscriptionCheckout] Team created successfully', {
      userId,
      customerId,
      subscriptionId,
    });

  } catch (error: any) {
    logger.error('[handleSubscriptionCheckout] Error:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  try {
    logger.info('[handleSubscriptionCreated] Subscription created', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    // Team is already created in checkout.session.completed
    // This is just for logging/analytics
  } catch (error: any) {
    logger.error('[handleSubscriptionCreated] Error:', error);
  }
}

/**
 * Handle customer.subscription.updated
 * Updates team subscription status
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    logger.info('[handleSubscriptionUpdated] Subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    // Map Stripe status to our status
    let status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

    switch (subscription.status) {
      case 'active':
        status = 'active';
        break;
      case 'trialing':
        status = 'trialing';
        break;
      case 'past_due':
        status = 'past_due';
        break;
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':
        status = 'canceled';
        break;
      case 'incomplete':
      case 'paused':
      default:
        status = 'none';
        break;
    }

    // Calculate new end date
    const endDate = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : undefined;

    // Update team subscription
    await updateTeamSubscription(subscription.id, status, endDate);

    logger.info('[handleSubscriptionUpdated] Team subscription updated', {
      subscriptionId: subscription.id,
      newStatus: status,
    });

  } catch (error: any) {
    logger.error('[handleSubscriptionUpdated] Error:', error);
  }
}

/**
 * Handle customer.subscription.deleted
 * Cancels team subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    logger.info('[handleSubscriptionDeleted] Subscription deleted', {
      subscriptionId: subscription.id,
    });

    // Update team to canceled status
    await updateTeamSubscription(subscription.id, 'canceled');

    logger.info('[handleSubscriptionDeleted] Team subscription canceled', {
      subscriptionId: subscription.id,
    });

  } catch (error: any) {
    logger.error('[handleSubscriptionDeleted] Error:', error);
  }
}

/**
 * Handle invoice.payment_succeeded
 * Reactivates subscription after successful payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe): Promise<void> {
  try {
    logger.info('[handleInvoicePaymentSucceeded] Payment succeeded', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
    });

    if (!invoice.subscription) {
      return;
    }

    // Get subscription to check status
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

    if (subscription.status === 'active') {
      await updateTeamSubscription(subscription.id, 'active');
    }

    logger.info('[handleInvoicePaymentSucceeded] Subscription reactivated', {
      subscriptionId: subscription.id,
    });

  } catch (error: any) {
    logger.error('[handleInvoicePaymentSucceeded] Error:', error);
  }
}

/**
 * Handle invoice.payment_failed
 * Marks subscription as past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    logger.info('[handleInvoicePaymentFailed] Payment failed', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
    });

    if (!invoice.subscription) {
      return;
    }

    // Update team to past_due status
    await updateTeamSubscription(invoice.subscription as string, 'past_due');

    logger.info('[handleInvoicePaymentFailed] Subscription marked as past_due', {
      subscriptionId: invoice.subscription,
    });

  } catch (error: any) {
    logger.error('[handleInvoicePaymentFailed] Error:', error);
  }
}
