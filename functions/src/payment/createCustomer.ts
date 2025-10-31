/**
 * Create or Retrieve Stripe Customer
 *
 * Standalone function for managing Stripe customer creation and retrieval
 * Ensures each Firebase user has a corresponding Stripe customer ID
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
const CreateCustomerSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional()
  }).optional()
});

/**
 * Create or retrieve Stripe customer for authenticated user
 */
export const createCustomer = onCall({
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
    const validatedData = CreateCustomerSchema.parse(request.data);

    logger.info(`Creating or retrieving Stripe customer for user: ${userId}`);

    // Get user document
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('Felhasználói adatok nem találhatók');
    }

    // Check if customer already exists in Stripe
    if (userData.stripeCustomerId) {
      logger.info(`Retrieving existing Stripe customer: ${userData.stripeCustomerId}`);

      try {
        const stripeInstance = getStripeInstance();
        const customer = await stripeInstance.customers.retrieve(userData.stripeCustomerId);

        // Verify customer is not deleted
        if (customer.deleted) {
          logger.warn(`Customer ${userData.stripeCustomerId} was deleted, creating new one`);
          // Continue to create new customer
        } else {
          return {
            success: true,
            customerId: customer.id,
            customer: {
              id: customer.id,
              email: customer.email,
              name: customer.name
            }
          };
        }
      } catch (error: any) {
        // Customer doesn't exist in Stripe, create new one
        logger.warn(`Customer ${userData.stripeCustomerId} not found in Stripe:`, error.message);
      }
    }

    // Create new Stripe customer
    logger.info('Creating new Stripe customer');

    const customerData: Stripe.CustomerCreateParams = {
      email: validatedData.email || userData.email,
      name: validatedData.name || `${userData.firstName} ${userData.lastName}`,
      phone: validatedData.phone || userData.phone,
      metadata: {
        firebaseUserId: userId
      }
    };

    // Add address if provided
    if (validatedData.address) {
      customerData.address = validatedData.address;
    }

    const stripeInstance = getStripeInstance();
    const customer = await stripeInstance.customers.create(customerData);

    // Save customer ID to Firestore
    await firestore.collection('users').doc(userId).update({
      stripeCustomerId: customer.id,
      updatedAt: new Date().toISOString()
    });

    logger.info(`Stripe customer created: ${customer.id}`);

    return {
      success: true,
      customerId: customer.id,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      }
    };

  } catch (error: any) {
    logger.error('Create customer error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen paraméterek',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Stripe ügyfél létrehozása sikertelen'
    };
  }
});
