/**
 * Create Billing Portal Session Cloud Function
 *
 * Creates a Stripe Customer Portal session for users to manage their billing.
 * Supports both individual users and company admins.
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';
import * as z from 'zod';

const firestore = admin.firestore();

// Lazy Stripe initialization
let stripe: Stripe | null = null;

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
const CreateBillingPortalSessionSchema = z.object({
  returnUrl: z.string().url().optional(),
});

/**
 * Create a Stripe Billing Portal session
 *
 * For individual users: Uses user's stripeCustomerId
 * For company admins: Uses company's stripeCustomerId
 * Company employees (non-admin) are denied access
 */
export const createBillingPortalSession = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // 1. Authentication check
    if (!request.auth) {
      return {
        success: false,
        error: 'Hitelesítés szükséges',
      };
    }

    const userId = request.auth.uid;

    // 2. Validate input
    const validationResult = CreateBillingPortalSessionSchema.safeParse(request.data || {});
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Érvénytelen bemenet',
      };
    }

    const { returnUrl } = validationResult.data;
    const defaultReturnUrl = 'https://academion.hu/dashboard/billing';

    // 3. Get user document
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'Felhasználó nem található',
      };
    }

    const userData = userDoc.data();
    let stripeCustomerId: string | undefined;

    // 4. Determine user type and get appropriate stripeCustomerId
    if (userData?.companyId) {
      // User is part of a company
      const companyDoc = await firestore.collection('companies').doc(userData.companyId).get();

      if (!companyDoc.exists) {
        return {
          success: false,
          error: 'Vállalat nem található',
        };
      }

      const companyData = companyDoc.data();

      // Check if user is company admin (support both cases for backwards compatibility)
      const userRole = userData.role?.toUpperCase();
      if (userRole !== 'COMPANY_ADMIN') {
        return {
          success: false,
          error: 'A számlázás kezeléséhez adminisztrátori jogosultság szükséges. Kérjük, forduljon a vállalati adminisztrátorhoz.',
          isCompanyEmployee: true,
        };
      }

      // Use company's stripeCustomerId
      stripeCustomerId = companyData?.stripeCustomerId;

      if (!stripeCustomerId) {
        return {
          success: false,
          error: 'A vállalat még nem rendelkezik aktív előfizetéssel',
        };
      }

      logger.info('Creating billing portal session for company admin', {
        userId,
        companyId: userData.companyId,
        stripeCustomerId,
      });
    } else {
      // Individual user
      stripeCustomerId = userData?.stripeCustomerId;

      if (!stripeCustomerId) {
        return {
          success: false,
          error: 'Nincs aktív előfizetés. Kérjük, először fizessen elő.',
        };
      }

      logger.info('Creating billing portal session for individual user', {
        userId,
        stripeCustomerId,
      });
    }

    // 5. Create Stripe Billing Portal session
    const stripeInstance = getStripeInstance();

    const session = await stripeInstance.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    });

    logger.info('Billing portal session created successfully', {
      userId,
      sessionId: session.id,
      url: session.url,
    });

    return {
      success: true,
      url: session.url,
    };

  } catch (error) {
    logger.error('Error creating billing portal session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: 'Hiba történt a számlázási portál betöltése közben. Kérjük, próbálja újra később.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
    };
  }
});
