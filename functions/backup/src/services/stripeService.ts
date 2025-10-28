import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const config = functions.config();
const stripe = new Stripe(
  config.stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2023-10-16' }
);

export interface CreateCheckoutSessionData {
  userId: string;
  courseId?: string;
  priceId?: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerData {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  address?: Stripe.AddressParam;
}

export class StripeService {
  /**
   * Create or get Stripe customer
   */
  async createOrGetCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(data.userId)
        .get();
      
      const userData = userDoc.data();
      
      if (userData?.stripeCustomerId) {
        // Return existing customer
        return await stripe.customers.retrieve(userData.stripeCustomerId) as Stripe.Customer;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        metadata: {
          firebaseUserId: data.userId
        }
      });

      // Save customer ID to user document
      await admin.firestore()
        .collection('users')
        .doc(data.userId)
        .update({
          stripeCustomerId: customer.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      console.log('✅ Stripe customer created:', customer.id);
      return customer;

    } catch (error) {
      console.error('❌ Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create checkout session for course purchase
   */
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      // Get or create customer
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(data.userId)
        .get();
      
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('User not found');
      }

      const customer = await this.createOrGetCustomer({
        userId: data.userId,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`
      });

      // Prepare line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      
      if (data.courseId) {
        // Get course details
        const courseDoc = await admin.firestore()
          .collection('courses')
          .doc(data.courseId)
          .get();
        
        const course = courseDoc.data();
        
        if (!course) {
          throw new Error('Course not found');
        }

        lineItems.push({
          price_data: {
            currency: 'huf',
            product_data: {
              name: course.title,
              description: course.description,
              images: course.thumbnail ? [course.thumbnail] : [],
              metadata: {
                courseId: data.courseId
              }
            },
            unit_amount: Math.round(course.price * 100) // Convert to cents
          },
          quantity: 1
        });
      } else if (data.priceId) {
        // Use existing price ID (for subscriptions)
        lineItems.push({
          price: data.priceId,
          quantity: 1
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: data.mode,
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          userId: data.userId,
          courseId: data.courseId || '',
          ...data.metadata
        },
        locale: 'hu',
        payment_intent_data: data.mode === 'payment' ? {
          metadata: {
            userId: data.userId,
            courseId: data.courseId || ''
          }
        } : undefined,
        subscription_data: data.mode === 'subscription' ? {
          metadata: {
            userId: data.userId
          }
        } : undefined
      });

      // Log checkout session
      await admin.firestore().collection('checkoutSessions').add({
        sessionId: session.id,
        userId: data.userId,
        courseId: data.courseId,
        status: 'pending',
        amount: session.amount_total,
        currency: session.currency,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Checkout session created:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const { userId, courseId } = session.metadata || {};
      
      if (!userId) {
        console.error('No userId in session metadata');
        return;
      }

      // Create payment record
      await admin.firestore().collection('payments').add({
        userId,
        courseId: courseId || null,
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // If course purchase, create enrollment
      if (courseId) {
        await this.createEnrollment(userId, courseId);
      }

      // Send receipt email
      const emailService = (await import('./emailService')).emailService;
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.data();
      
      if (userData?.email) {
        await emailService.sendPaymentReceipt(
          { email: userData.email, name: userData.displayName },
          {
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || 'HUF',
            description: courseId ? `Kurzus vásárlás` : 'Előfizetés',
            invoiceNumber: `INV-${Date.now()}`,
            date: new Date().toLocaleDateString('hu-HU')
          }
        );
      }

      console.log('✅ Payment processed successfully');

    } catch (error) {
      console.error('❌ Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Create enrollment after payment
   */
  private async createEnrollment(userId: string, courseId: string): Promise<void> {
    try {
      const enrollmentId = `${userId}_${courseId}`;
      
      // Check if already enrolled
      const existingEnrollment = await admin.firestore()
        .collection('enrollments')
        .doc(enrollmentId)
        .get();
      
      if (existingEnrollment.exists) {
        console.log('User already enrolled');
        return;
      }

      // Get course details
      const courseDoc = await admin.firestore()
        .collection('courses')
        .doc(courseId)
        .get();
      
      const course = courseDoc.data();
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Create enrollment
      await admin.firestore()
        .collection('enrollments')
        .doc(enrollmentId)
        .set({
          userId,
          courseId,
          courseTitle: course.title,
          instructorId: course.instructorId,
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          progress: 0,
          completedLessons: [],
          lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      // Update course enrollment count
      await admin.firestore()
        .collection('courses')
        .doc(courseId)
        .update({
          enrollmentCount: admin.firestore.FieldValue.increment(1)
        });

      // Send enrollment confirmation email
      const emailService = (await import('./emailService')).emailService;
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.data();
      
      if (userData?.email) {
        await emailService.sendEnrollmentConfirmation(
          { email: userData.email, name: userData.displayName },
          { 
            title: course.title,
            instructor: course.instructorName,
            startDate: course.startDate
          }
        );
      }

      console.log('✅ Enrollment created successfully');

    } catch (error) {
      console.error('❌ Error creating enrollment:', error);
      throw error;
    }
  }

  /**
   * Create subscription for user
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata
      });

      console.log('✅ Subscription created:', subscription.id);
      return subscription;

    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      console.log('✅ Subscription cancelled:', subscription.id);
      return subscription;

    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason
      });

      // Log refund
      await admin.firestore().collection('refunds').add({
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Refund created:', refund.id);
      return refund;

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;

    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Create setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      console.log('✅ Setup intent created:', setupIntent.id);
      return setupIntent;

    } catch (error) {
      console.error('❌ Error creating setup intent:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();