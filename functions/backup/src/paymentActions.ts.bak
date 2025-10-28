import { onCall, onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { stripeService } from './services/stripeService';
import * as z from 'zod';
import Stripe from 'stripe';

// Set global options for functions
setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 100
});

// Initialize Stripe
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2023-10-16' }
);

// Validation schemas
const CreateCheckoutSchema = z.object({
  courseId: z.string().optional(),
  priceId: z.string().optional(),
  mode: z.enum(['payment', 'subscription']).default('payment'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional()
});

const CreateRefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive().optional(),
  reason: z.string().optional()
});

const GetPaymentDetailsSchema = z.object({
  sessionId: z.string()
});

/**
 * Simple auth check for v2 functions
 */
const requireAuth = (request: any) => {
  if (!request.auth) {
    throw new Error('Authentication required');
  }
  return {
    uid: request.auth.uid,
    email: request.auth.token.email || '',
    token: request.auth.token
  };
};

/**
 * Create checkout session
 */
export const createCheckoutSession = onCall(async (request) => {
  try {
    const auth = requireAuth(request);
    const validated = CreateCheckoutSchema.parse(request.data);

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      userId: auth.uid,
      ...validated,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        ...validated.metadata
      }
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };

  } catch (error) {
    console.error('Create checkout session error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid checkout data',
        details: error.errors
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    };
  }
});

/**
 * Enhanced Stripe webhook handler with comprehensive event handling
 */
export const stripeWebhook = onRequest(async (req, res) => {
  try {
    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      res.status(400).send('Webhook signature verification failed');
      return;
    }

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return;
    }

    console.log('Processing webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await stripeService.handlePaymentSuccess(session);
        
        // Log successful payment
        console.log('✅ Checkout session completed:', session.id);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // Update payment record
        const paymentsQuery = await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', paymentIntent.id)
          .get();

        const batch = admin.firestore().batch();
        paymentsQuery.forEach(doc => {
          batch.update(doc.ref, {
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', failedPayment.id);
        
        // Update payment record with failure details
        const failedQuery = await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', failedPayment.id)
          .get();

        const failedBatch = admin.firestore().batch();
        failedQuery.forEach(doc => {
          failedBatch.update(doc.ref, {
            status: 'failed',
            failureReason: failedPayment.last_payment_error?.message || 'Payment failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await failedBatch.commit();
        
        // TODO: Send failure notification email
        break;

      case 'customer.subscription.created':
        const newSubscription = event.data.object as Stripe.Subscription;
        const userId = newSubscription.metadata.userId;
        
        if (userId) {
          await admin.firestore().collection('subscriptions').add({
            userId,
            subscriptionId: newSubscription.id,
            customerId: newSubscription.customer,
            status: newSubscription.status,
            currentPeriodStart: new Date(newSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(newSubscription.current_period_end * 1000),
            priceId: newSubscription.items.data[0]?.price.id,
            planName: newSubscription.items.data[0]?.price.nickname || 'Unknown Plan',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('✅ Subscription created for user:', userId);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        
        // Update subscription record
        const subQuery = await admin.firestore()
          .collection('subscriptions')
          .where('subscriptionId', '==', updatedSubscription.id)
          .get();
        
        const subBatch = admin.firestore().batch();
        subQuery.forEach(doc => {
          subBatch.update(doc.ref, {
            status: updatedSubscription.status,
            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await subBatch.commit();
        
        console.log('✅ Subscription updated:', updatedSubscription.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as cancelled
        const delQuery = await admin.firestore()
          .collection('subscriptions')
          .where('subscriptionId', '==', deletedSubscription.id)
          .get();
        
        const delBatch = admin.firestore().batch();
        delQuery.forEach(doc => {
          delBatch.update(doc.ref, {
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await delBatch.commit();
        
        console.log('✅ Subscription cancelled:', deletedSubscription.id);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('✅ Invoice payment succeeded:', invoice.id);
        
        // Log invoice payment
        if (invoice.subscription) {
          await admin.firestore().collection('invoicePayments').add({
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.error('❌ Invoice payment failed:', failedInvoice.id);
        
        // Log failed invoice payment
        if (failedInvoice.subscription) {
          await admin.firestore().collection('invoicePayments').add({
            invoiceId: failedInvoice.id,
            subscriptionId: failedInvoice.subscription,
            amount: failedInvoice.amount_due,
            currency: failedInvoice.currency,
            status: 'failed',
            failureReason: failedInvoice.last_finalization_error?.message || 'Payment failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // TODO: Send payment failure notification
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        console.error('⚠️ Dispute created:', dispute.id);
        
        // Log dispute for admin review
        await admin.firestore().collection('disputes').add({
          disputeId: dispute.id,
          chargeId: dispute.charge,
          amount: dispute.amount,
          currency: dispute.currency,
          reason: dispute.reason,
          status: dispute.status,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * Get user payment history with enhanced filtering
 */
export const getPaymentHistory = onCall(async (request) => {
  try {
    const auth = requireAuth(request);
    const { limit = 50, status, startDate, endDate } = request.data || {};

    // Build query
    let query = admin.firestore()
      .collection('payments')
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    const payments = await query.limit(limit).get();

    const paymentHistory = payments.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString(),
        completedAt: data.completedAt?.toDate()?.toISOString(),
        failedAt: data.failedAt?.toDate()?.toISOString()
      };
    });

    return {
      success: true,
      payments: paymentHistory,
      total: paymentHistory.length
    };

  } catch (error) {
    console.error('Get payment history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment history'
    };
  }
});

/**
 * Create refund (admin only)
 */
export const createRefund = onCall(async (request) => {
  try {
    const auth = requireAuth(request);
    
    // Check if user is admin
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(auth.uid)
      .get();

    const userData = userDoc.data();
    if (!userData || !['admin', 'university_admin'].includes(userData.role)) {
      return {
        success: false,
        error: 'Insufficient permissions - admin access required'
      };
    }

    const validated = CreateRefundSchema.parse(request.data);

    // Get payment record
    const paymentDoc = await admin.firestore()
      .collection('payments')
      .doc(validated.paymentId)
      .get();

    if (!paymentDoc.exists) {
      return {
        success: false,
        error: 'Payment not found'
      };
    }

    const payment = paymentDoc.data()!;

    if (payment.status === 'refunded') {
      return {
        success: false,
        error: 'Payment already refunded'
      };
    }

    // Create refund
    const refund = await stripeService.createRefund(
      payment.paymentIntentId,
      validated.amount,
      validated.reason
    );

    // Update payment status
    await paymentDoc.ref.update({
      status: 'refunded',
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundAmount: refund.amount,
      refundReason: validated.reason,
      refundedBy: auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Refund created:', refund.id);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency
    };

  } catch (error) {
    console.error('Create refund error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid refund data',
        details: error.errors
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create refund'
    };
  }
});

/**
 * Get subscription status with detailed information
 */
export const getSubscriptionStatus = onCall(async (request) => {
  try {
    const auth = requireAuth(request);

    // Get active subscription
    const subscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('userId', '==', auth.uid)
      .where('status', 'in', ['active', 'trialing', 'past_due'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (subscriptions.empty) {
      return {
        success: true,
        hasSubscription: false,
        isActive: false
      };
    }

    const subscriptionDoc = subscriptions.docs[0];
    const subscription = subscriptionDoc.data();

    // Check if subscription is actually active
    const now = new Date();
    const currentPeriodEnd = subscription.currentPeriodEnd.toDate();
    const isActive = subscription.status === 'active' && currentPeriodEnd > now;

    return {
      success: true,
      hasSubscription: true,
      isActive,
      subscription: {
        id: subscriptionDoc.id,
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        planName: subscription.planName,
        currentPeriodStart: subscription.currentPeriodStart?.toDate()?.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd?.toDate()?.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        createdAt: subscription.createdAt?.toDate()?.toISOString()
      }
    };

  } catch (error) {
    console.error('Get subscription status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get subscription status'
    };
  }
});

/**
 * Cancel subscription with proper handling
 */
export const cancelSubscription = onCall(async (request) => {
  try {
    const auth = requireAuth(request);

    // Get active subscription
    const subscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('userId', '==', auth.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subscriptions.empty) {
      return {
        success: false,
        error: 'No active subscription found'
      };
    }

    const subscriptionDoc = subscriptions.docs[0];
    const subscription = subscriptionDoc.data();

    // Cancel in Stripe (at period end)
    await stripeService.cancelSubscription(subscription.subscriptionId);

    // Update database
    await subscriptionDoc.ref.update({
      cancelAtPeriodEnd: true,
      cancelRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelRequestedBy: auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Subscription cancellation requested:', subscription.subscriptionId);

    return {
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAt: subscription.currentPeriodEnd?.toDate()?.toISOString()
    };

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    };
  }
});

/**
 * Get payment analytics (admin only)
 */
export const getPaymentAnalytics = onCall(async (request) => {
  try {
    const auth = requireAuth(request);
    
    // Check if user is admin
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(auth.uid)
      .get();

    const userData = userDoc.data();
    if (!userData || !['admin', 'university_admin'].includes(userData.role)) {
      return {
        success: false,
        error: 'Insufficient permissions - admin access required'
      };
    }

    const { startDate, endDate } = request.data || {};
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    // Get payment analytics
    const paymentsQuery = admin.firestore()
      .collection('payments')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end);

    const [allPayments, successfulPayments, subscriptions] = await Promise.all([
      paymentsQuery.get(),
      paymentsQuery.where('status', '==', 'completed').get(),
      admin.firestore()
        .collection('subscriptions')
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .get()
    ]);

    // Calculate metrics
    const totalRevenue = successfulPayments.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);

    const totalTransactions = allPayments.size;
    const successfulTransactions = successfulPayments.size;
    const conversionRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    const newSubscriptions = subscriptions.size;

    return {
      success: true,
      analytics: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        revenue: {
          total: totalRevenue,
          currency: 'HUF'
        },
        transactions: {
          total: totalTransactions,
          successful: successfulTransactions,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        subscriptions: {
          new: newSubscriptions
        }
      }
    };

  } catch (error) {
    console.error('Get payment analytics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment analytics'
    };
  }
});

/**
 * Retry failed payment
 */
export const retryFailedPayment = onCall(async (request) => {
  try {
    const auth = requireAuth(request);
    const { paymentId } = request.data || {};

    if (!paymentId) {
      return {
        success: false,
        error: 'Payment ID is required'
      };
    }

    // Get payment record
    const paymentDoc = await admin.firestore()
      .collection('payments')
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      return {
        success: false,
        error: 'Payment not found'
      };
    }

    const payment = paymentDoc.data()!;

    // Verify ownership
    if (payment.userId !== auth.uid) {
      return {
        success: false,
        error: 'Unauthorized access to payment'
      };
    }

    // Check if payment can be retried
    if (payment.status !== 'failed') {
      return {
        success: false,
        error: 'Payment is not in failed state'
      };
    }

    // Create new checkout session for retry
    const retrySession = await stripeService.createCheckoutSession({
      userId: auth.uid,
      courseId: payment.courseId,
      mode: 'payment',
      successUrl: payment.successUrl || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancelUrl: payment.cancelUrl || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?cancelled=true`,
      metadata: {
        originalPaymentId: paymentId,
        retryAttempt: 'true'
      }
    });

    // Log retry attempt
    await admin.firestore().collection('paymentRetries').add({
      originalPaymentId: paymentId,
      newSessionId: retrySession.id,
      userId: auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      sessionId: retrySession.id,
      url: retrySession.url
    };

  } catch (error) {
    console.error('Retry failed payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry payment'
    };
  }
});

/**
 * Get payment details for success page
 */
export const getPaymentDetails = onCall(async (request) => {
  try {
    const auth = requireAuth(request);
    const { sessionId } = GetPaymentDetailsSchema.parse(request.data);

    console.log('🔍 Getting payment details for session:', sessionId);

    // Get checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'subscription', 'line_items']
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Find payment in database
    const paymentQuery = await admin.firestore()
      .collection('payments')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    let paymentData: any = null;
    
    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      paymentData = paymentDoc.data();
    }

    // Get course details if available
    let courseInfo = null;
    if (session.metadata?.courseId) {
      const courseDoc = await admin.firestore()
        .collection('courses')
        .doc(session.metadata.courseId)
        .get();
      
      if (courseDoc.exists) {
        const course = courseDoc.data();
        courseInfo = {
          id: courseDoc.id,
          name: course?.title || course?.name
        };
      }
    }

    // Get subscription details if available
    let subscriptionInfo = null;
    if (session.subscription && typeof session.subscription === 'object') {
      const subscription = session.subscription as Stripe.Subscription;
      subscriptionInfo = {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.items.data[0]?.price?.nickname || 'Premium Plan'
      };
    }

    // Construct payment details response
    const paymentDetails = {
      id: session.payment_intent 
        ? (typeof session.payment_intent === 'object' ? session.payment_intent.id : session.payment_intent)
        : sessionId,
      amount: session.amount_total || 0,
      currency: session.currency || 'huf',
      status: session.payment_status === 'paid' ? 'succeeded' : session.payment_status,
      description: session.metadata?.description || 
                  (courseInfo ? `Kurzus: ${courseInfo.name}` : 'ELIRA vásárlás'),
      receiptUrl: session.payment_intent && typeof session.payment_intent === 'object' 
        ? session.payment_intent.charges?.data?.[0]?.receipt_url
        : undefined,
      courseId: session.metadata?.courseId,
      courseName: courseInfo?.name,
      subscriptionId: subscriptionInfo?.id,
      planName: subscriptionInfo?.planName,
      createdAt: paymentData?.createdAt?.toDate()?.toISOString() || new Date().toISOString()
    };

    console.log('✅ Payment details retrieved successfully');

    return {
      success: true,
      payment: paymentDetails
    };

  } catch (error) {
    console.error('Get payment details error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment details'
    };
  }
});