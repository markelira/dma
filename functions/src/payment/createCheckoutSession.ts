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
  successUrl: z.string().url().optional(), // Required for hosted mode
  cancelUrl: z.string().url().optional(), // Required for hosted mode
  returnUrl: z.string().url().optional(), // Required for embedded mode
  mode: z.enum(['payment', 'subscription']).default('subscription'),
  uiMode: z.enum(['hosted', 'embedded']).default('hosted'), // Embedded checkout support
  metadata: z.record(z.string()).optional()
});

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  try {
    logger.info('🔵 [CF] createCheckoutSession called');
    logger.info('🔵 [CF] request.data:', request.data);

    // Authentication check
    if (!request.auth) {
      logger.error('❌ [CF] No authentication');
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;
    logger.info(`✅ [CF] User authenticated: ${userId}`);

    // Input validation
    logger.info('🔵 [CF] Validating input data...');
    const validatedData = CreateCheckoutSessionSchema.parse(request.data);
    logger.info('✅ [CF] Input validation passed:', validatedData);

    logger.info(`Creating checkout session for user: ${userId}`);

    // Get user document OR pending registration for new signups
    let userData: any = null;
    let isPendingRegistration = false;
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      // Fallback: Check pendingRegistrations for new signups
      const pendingDoc = await firestore.collection('pendingRegistrations').doc(userId).get();
      if (pendingDoc.exists) {
        const pending = pendingDoc.data();
        userData = {
          email: pending?.email,
          firstName: pending?.firstName,
          lastName: pending?.lastName,
          companyName: pending?.companyName, // For subscription type detection
        };
        isPendingRegistration = true;
        logger.info('[createCheckoutSession] Using pending registration data for new user:', userId);
      }
    }

    if (!userData) {
      throw new Error('Felhasználó nem található');
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

      // Save customer ID (to users doc or pendingRegistrations)
      if (isPendingRegistration) {
        await firestore.collection('pendingRegistrations').doc(userId).update({
          stripeCustomerId: customer.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await firestore.collection('users').doc(userId).update({
          stripeCustomerId: customer.id,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Determine subscription type based on user's account
    // For pending registrations: has companyName = company subscription
    // For existing users: has companyId/teamId = company subscription
    const isCompanyUser = isPendingRegistration
      ? !!userData.companyName  // New registration with company name
      : !!(userData.companyId || userData.teamId || userData.isTeamOwner);

    const subscriptionType = isCompanyUser ? 'company' : 'individual';
    const companyId = userData.companyId || userData.teamId || null;
    logger.info(`Subscription type determined: ${subscriptionType}`, {
      isPendingRegistration,
      companyName: userData.companyName,
      companyId,
    });

    // Validate URL requirements based on uiMode
    const isEmbeddedMode = validatedData.uiMode === 'embedded';
    if (isEmbeddedMode && !validatedData.returnUrl) {
      throw new Error('returnUrl is required for embedded checkout mode');
    }
    if (!isEmbeddedMode && (!validatedData.successUrl || !validatedData.cancelUrl)) {
      throw new Error('successUrl and cancelUrl are required for hosted checkout mode');
    }

    // Prepare session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: validatedData.mode,
      locale: 'hu',
      // UI mode: 'hosted' (redirect) or 'embedded' (iframe)
      ui_mode: isEmbeddedMode ? 'embedded' : 'hosted',
      // URL configuration based on mode
      ...(isEmbeddedMode
        ? { return_url: validatedData.returnUrl }
        : { success_url: validatedData.successUrl, cancel_url: validatedData.cancelUrl }
      ),

      // Collect billing addresses (required)
      billing_address_collection: 'required',

      // Collect customers' names and addresses
      customer_update: {
        address: 'auto',
        name: 'auto'
      },

      // Require phone number
      phone_number_collection: {
        enabled: true
      },

      // Allow promotion codes
      allow_promotion_codes: true,

      // Allow business tax IDs
      tax_id_collection: {
        enabled: true
      },

      // Collect business name (optional)
      custom_fields: [
        {
          key: 'business_name',
          label: {
            type: 'custom',
            custom: 'Cégnév (opcionális)'
          },
          type: 'text',
          optional: true
        }
      ],

      metadata: {
        userId,
        priceId: validatedData.priceId,
        subscriptionType,
        ...(companyId && { companyId }), // Include companyId for company subscriptions
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

      sessionParams.subscription_data = {
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

    logger.info(`Checkout session created: ${session.id}, ui_mode: ${validatedData.uiMode}`);

    const response = {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url, // For hosted mode redirect
        clientSecret: session.client_secret, // For embedded mode
        uiMode: validatedData.uiMode
      }
    };

    logger.info('✅ [CF] Returning response:', response);
    logger.info('✅ [CF] Response structure check:', {
      hasSuccess: 'success' in response,
      successValue: response.success,
      hasData: 'data' in response,
      uiMode: response.data?.uiMode,
      hasUrl: response.data && 'url' in response.data,
      hasClientSecret: response.data && 'clientSecret' in response.data
    });

    return response;

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
