"use strict";
/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe webhook events for subscription management and team creation.
 * Automatically creates teams when users subscribe and manages subscription lifecycle.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
const createTeam_1 = require("../team/createTeam");
const team_1 = require("../types/team");
const handlePaymentSuccess_1 = require("../payment/handlePaymentSuccess");
const firestore = admin.firestore();
// Lazy Stripe initialization - will be initialized on first request
let stripe = null;
let stripeWebhookSecret = null;
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
/**
 * Get webhook secret (lazy initialization)
 */
function getWebhookSecret() {
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
exports.stripeWebhook = (0, https_1.onRequest)({
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
            v2_1.logger.error('[stripeWebhook] No Stripe signature found');
            res.status(400).send('No Stripe signature found');
            return;
        }
        // Initialize Stripe and get webhook secret
        let stripeInstance;
        let webhookSecret;
        try {
            stripeInstance = getStripeInstance();
            webhookSecret = getWebhookSecret();
        }
        catch (error) {
            v2_1.logger.error('[stripeWebhook] Stripe configuration error:', error.message);
            res.status(500).send('Stripe not configured');
            return;
        }
        // Verify webhook signature
        let event;
        try {
            const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
            event = stripeInstance.webhooks.constructEvent(rawBody, sig, webhookSecret);
        }
        catch (err) {
            v2_1.logger.error('[stripeWebhook] Webhook signature verification failed:', err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        v2_1.logger.info('[stripeWebhook] Event received', {
            type: event.type,
            id: event.id,
        });
        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object, stripeInstance);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object, stripeInstance);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                v2_1.logger.info('[stripeWebhook] Unhandled event type:', event.type);
        }
        // Return success response
        res.status(200).json({ received: true });
    }
    catch (error) {
        v2_1.logger.error('[stripeWebhook] Error processing webhook:', error);
        res.status(500).send(`Webhook Error: ${error.message}`);
    }
});
/**
 * Handle checkout.session.completed
 * Creates team when user successfully subscribes OR
 * Creates enrollment when user purchases a course
 */
async function handleCheckoutSessionCompleted(session, stripe) {
    try {
        v2_1.logger.info('[handleCheckoutSessionCompleted] Processing session', {
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
            await (0, handlePaymentSuccess_1.handlePaymentSuccess)(session);
            return;
        }
        v2_1.logger.warn('[handleCheckoutSessionCompleted] Unknown session mode:', session.mode);
    }
    catch (error) {
        v2_1.logger.error('[handleCheckoutSessionCompleted] Error:', error);
        throw error;
    }
}
/**
 * Handle subscription checkout
 * Creates team for company subscriptions OR
 * Creates subscription document for individual subscriptions
 */
async function handleSubscriptionCheckout(session, stripe) {
    try {
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userEmail = session.customer_email || session.customer_details?.email;
        // Get metadata from session
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        const subscriptionType = session.metadata?.subscriptionType || 'company'; // Default to company for backwards compatibility
        if (!userId) {
            throw new Error('User ID not found in session metadata');
        }
        if (!priceId) {
            throw new Error('Price ID not found in session metadata');
        }
        // Get subscription plan from price ID
        const subscriptionPlan = (0, team_1.stripePriceIdToPlan)(priceId);
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
        const endDate = (0, team_1.calculateSubscriptionEndDate)(startDate, subscriptionPlan);
        // Get trial end date from subscription if available
        let trialEndDate = (0, team_1.calculateTrialEndDate)(startDate);
        let subscriptionStatus = 'active';
        if (subscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                if (subscription.trial_end) {
                    trialEndDate = new Date(subscription.trial_end * 1000);
                }
                subscriptionStatus = subscription.status === 'trialing' ? 'trialing' : 'active';
            }
            catch (error) {
                v2_1.logger.warn('Could not retrieve trial_end from subscription, using default');
            }
        }
        // Handle based on subscription type
        if (subscriptionType === 'individual') {
            // Individual subscription - create subscription document
            await handleIndividualSubscription({
                userId,
                customerId,
                subscriptionId,
                subscriptionStatus,
                priceId,
                subscriptionPlan,
                startDate,
                endDate,
                trialEndDate,
            });
            v2_1.logger.info('[handleSubscriptionCheckout] Individual subscription created successfully', {
                userId,
                customerId,
                subscriptionId,
            });
        }
        else {
            // Company subscription - create team
            await (0, createTeam_1.createTeam)({
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
            v2_1.logger.info('[handleSubscriptionCheckout] Team created successfully', {
                userId,
                customerId,
                subscriptionId,
            });
        }
    }
    catch (error) {
        v2_1.logger.error('[handleSubscriptionCheckout] Error:', error);
        throw error;
    }
}
/**
 * Handle individual subscription
 * Creates subscription document and updates user without creating a team
 */
async function handleIndividualSubscription(params) {
    const { userId, customerId, subscriptionId, subscriptionStatus, priceId, subscriptionPlan, startDate, endDate, trialEndDate, } = params;
    try {
        // Create subscription document
        await firestore.collection('subscriptions').add({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            status: subscriptionStatus,
            planName: `DMA ${subscriptionPlan} Subscription`,
            subscriptionPlan,
            currentPeriodStart: startDate.toISOString(),
            currentPeriodEnd: endDate.toISOString(),
            trialEnd: trialEndDate.toISOString(),
            cancelAtPeriodEnd: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        // Update user document with subscription status
        await firestore.collection('users').doc(userId).update({
            subscriptionStatus,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date().toISOString(),
        });
        v2_1.logger.info('[handleIndividualSubscription] Individual subscription created', {
            userId,
            subscriptionId,
            status: subscriptionStatus,
        });
    }
    catch (error) {
        v2_1.logger.error('[handleIndividualSubscription] Error:', error);
        throw error;
    }
}
/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription) {
    try {
        v2_1.logger.info('[handleSubscriptionCreated] Subscription created', {
            subscriptionId: subscription.id,
            status: subscription.status,
        });
        // Team is already created in checkout.session.completed
        // This is just for logging/analytics
    }
    catch (error) {
        v2_1.logger.error('[handleSubscriptionCreated] Error:', error);
    }
}
/**
 * Handle customer.subscription.updated
 * Updates team subscription status
 */
async function handleSubscriptionUpdated(subscription) {
    try {
        v2_1.logger.info('[handleSubscriptionUpdated] Subscription updated', {
            subscriptionId: subscription.id,
            status: subscription.status,
        });
        // Map Stripe status to our status
        let status;
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
        await (0, createTeam_1.updateTeamSubscription)(subscription.id, status, endDate);
        v2_1.logger.info('[handleSubscriptionUpdated] Team subscription updated', {
            subscriptionId: subscription.id,
            newStatus: status,
        });
    }
    catch (error) {
        v2_1.logger.error('[handleSubscriptionUpdated] Error:', error);
    }
}
/**
 * Handle customer.subscription.deleted
 * Cancels team subscription
 */
async function handleSubscriptionDeleted(subscription) {
    try {
        v2_1.logger.info('[handleSubscriptionDeleted] Subscription deleted', {
            subscriptionId: subscription.id,
        });
        // Update team to canceled status
        await (0, createTeam_1.updateTeamSubscription)(subscription.id, 'canceled');
        v2_1.logger.info('[handleSubscriptionDeleted] Team subscription canceled', {
            subscriptionId: subscription.id,
        });
    }
    catch (error) {
        v2_1.logger.error('[handleSubscriptionDeleted] Error:', error);
    }
}
/**
 * Handle invoice.payment_succeeded
 * Reactivates subscription after successful payment
 */
async function handleInvoicePaymentSucceeded(invoice, stripe) {
    try {
        v2_1.logger.info('[handleInvoicePaymentSucceeded] Payment succeeded', {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
        });
        if (!invoice.subscription) {
            return;
        }
        // Get subscription to check status
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        if (subscription.status === 'active') {
            await (0, createTeam_1.updateTeamSubscription)(subscription.id, 'active');
        }
        v2_1.logger.info('[handleInvoicePaymentSucceeded] Subscription reactivated', {
            subscriptionId: subscription.id,
        });
    }
    catch (error) {
        v2_1.logger.error('[handleInvoicePaymentSucceeded] Error:', error);
    }
}
/**
 * Handle invoice.payment_failed
 * Marks subscription as past_due
 */
async function handleInvoicePaymentFailed(invoice) {
    try {
        v2_1.logger.info('[handleInvoicePaymentFailed] Payment failed', {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
        });
        if (!invoice.subscription) {
            return;
        }
        // Update team to past_due status
        await (0, createTeam_1.updateTeamSubscription)(invoice.subscription, 'past_due');
        v2_1.logger.info('[handleInvoicePaymentFailed] Subscription marked as past_due', {
            subscriptionId: invoice.subscription,
        });
    }
    catch (error) {
        v2_1.logger.error('[handleInvoicePaymentFailed] Error:', error);
    }
}
//# sourceMappingURL=webhook.js.map