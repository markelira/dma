/**
 * Get Stripe Invoices Cloud Function
 *
 * Fetches all invoices from Stripe for the authenticated user
 * Enriches invoice data with course information from Firestore
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';

const firestore = admin.firestore();

// Lazy Stripe initialization
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

interface EnrichedInvoice {
  id: string
  courseId?: string
  courseName?: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  paymentMethod: string
  stripeInvoiceUrl?: string
  invoicePdfUrl?: string
  createdAt: number
  paidAt?: number
  number?: string
}

/**
 * Get Stripe Invoices for authenticated user
 */
export const getStripeInvoices = onCall({
  cors: true,
  region: 'us-central1',
  memory: '256MiB',
}, async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const userId = request.auth.uid;
    logger.info('[getStripeInvoices] Fetching invoices for user:', userId);

    // Get user from Firestore to find stripeCustomerId
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new HttpsError('not-found', 'Felhasználó nem található');
    }

    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      // User has no Stripe customer ID, return empty array
      logger.info('[getStripeInvoices] User has no Stripe customer ID, returning empty list');
      return {
        success: true,
        invoices: [],
      };
    }

    // Initialize Stripe
    const stripeInstance = getStripeInstance();

    // Fetch invoices from Stripe
    const invoices = await stripeInstance.invoices.list({
      customer: stripeCustomerId,
      limit: 100, // Get last 100 invoices
      expand: ['data.payment_intent', 'data.charge'],
    });

    logger.info(`[getStripeInvoices] Found ${invoices.data.length} invoices from Stripe`);

    // Enrich invoices with course data from Firestore
    const enrichedInvoices: EnrichedInvoice[] = [];

    for (const invoice of invoices.data) {
      try {
        // Determine payment status
        let status: 'succeeded' | 'pending' | 'failed' = 'pending';
        if (invoice.status === 'paid') {
          status = 'succeeded';
        } else if (invoice.status === 'void' || invoice.status === 'uncollectible') {
          status = 'failed';
        }

        // Get payment method
        let paymentMethod = 'Bankkártya';
        if (invoice.charge) {
          const charge = typeof invoice.charge === 'string'
            ? await stripeInstance.charges.retrieve(invoice.charge)
            : invoice.charge;

          if (charge.payment_method_details?.card?.brand) {
            const brand = charge.payment_method_details.card.brand;
            paymentMethod = brand.charAt(0).toUpperCase() + brand.slice(1);
          }
        }

        // Extract course ID from metadata or line items
        let courseId: string | undefined;
        let courseName: string | undefined;

        // Check invoice metadata
        if (invoice.metadata?.courseId) {
          courseId = invoice.metadata.courseId;
        }

        // Check line items
        if (!courseId && invoice.lines.data.length > 0) {
          const lineItem = invoice.lines.data[0];
          if (lineItem.metadata?.courseId) {
            courseId = lineItem.metadata.courseId;
          }
          courseName = lineItem.description || undefined;
        }

        // Fetch course name from Firestore if we have courseId
        if (courseId && !courseName) {
          try {
            const courseDoc = await firestore.collection('courses').doc(courseId).get();
            if (courseDoc.exists) {
              const courseData = courseDoc.data();
              courseName = courseData?.title || courseData?.name;
            }
          } catch (error) {
            logger.warn(`[getStripeInvoices] Could not fetch course ${courseId}:`, error);
          }
        }

        // Build enriched invoice object
        const enrichedInvoice: EnrichedInvoice = {
          id: invoice.id,
          courseId,
          courseName: courseName || (courseId ? 'Kurzus' : 'Előfizetés'),
          amount: invoice.total || 0,
          currency: (invoice.currency || 'huf').toUpperCase(),
          status,
          paymentMethod,
          stripeInvoiceUrl: invoice.hosted_invoice_url || undefined,
          invoicePdfUrl: invoice.invoice_pdf || undefined,
          createdAt: invoice.created * 1000, // Convert to milliseconds
          paidAt: invoice.status_transitions?.paid_at
            ? invoice.status_transitions.paid_at * 1000
            : undefined,
          number: invoice.number || undefined,
        };

        enrichedInvoices.push(enrichedInvoice);
      } catch (error) {
        logger.error('[getStripeInvoices] Error processing invoice:', invoice.id, error);
        // Continue processing other invoices
      }
    }

    logger.info(`[getStripeInvoices] Successfully enriched ${enrichedInvoices.length} invoices`);

    return {
      success: true,
      invoices: enrichedInvoices,
    };

  } catch (error: any) {
    logger.error('[getStripeInvoices] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', error.message || 'Hiba történt a számlák betöltésekor');
  }
});
