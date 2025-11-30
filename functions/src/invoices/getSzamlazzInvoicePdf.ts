import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// szamlazz.js doesn't have TypeScript types, so we use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const szamlazz = require('szamlazz.js');

const db = getFirestore();

// Lazy initialization for Stripe
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new HttpsError('internal', 'Stripe is not configured');
    }
    stripe = new Stripe(secretKey, { apiVersion: '2024-10-28.acacia' as any });
  }
  return stripe;
}

// Lazy initialization for szamlazz.hu client
let szamlazzClient: any = null;
function getSzamlazzClient(): any {
  if (!szamlazzClient) {
    const agentKey = process.env.SZAMLAZZ_AGENT_KEY;
    if (!agentKey) {
      throw new HttpsError('internal', 'Szamlazz.hu is not configured');
    }
    szamlazzClient = new szamlazz.Client({
      authToken: agentKey,
      requestInvoiceDownload: true,
    });
  }
  return szamlazzClient;
}

interface GetSzamlazzInvoicePdfRequest {
  stripePaymentIntentId: string;
}

interface GetSzamlazzInvoicePdfResponse {
  success: boolean;
  pdfBase64?: string;
  invoiceNumber?: string;
  error?: string;
}

/**
 * Cloud function to fetch Hungarian invoice PDF from szamlazz.hu
 *
 * SzamlaBridge creates invoices in szamlazz.hu using the Stripe Payment Intent ID
 * as the "order number". This function fetches the invoice PDF by that order number.
 */
export const getSzamlazzInvoicePdf = onCall<
  GetSzamlazzInvoicePdfRequest,
  Promise<GetSzamlazzInvoicePdfResponse>
>(
  {
    region: 'us-central1',
    memory: '256MiB',
    secrets: ['SZAMLAZZ_AGENT_KEY'],
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }

    const { stripePaymentIntentId } = request.data;

    // Validate input
    if (!stripePaymentIntentId || typeof stripePaymentIntentId !== 'string') {
      throw new HttpsError('invalid-argument', 'Hiányzó fizetési azonosító');
    }

    // Validate format (Stripe Payment Intent IDs start with 'pi_')
    if (!stripePaymentIntentId.startsWith('pi_')) {
      throw new HttpsError('invalid-argument', 'Érvénytelen fizetési azonosító formátum');
    }

    const userId = request.auth.uid;

    try {
      // Get user's Stripe customer ID
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Felhasználó nem található');
      }

      const userData = userDoc.data();
      const stripeCustomerId = userData?.stripeCustomerId;

      if (!stripeCustomerId) {
        throw new HttpsError('failed-precondition', 'Nincs Stripe ügyfél azonosító');
      }

      // Verify the payment belongs to this user via Stripe API
      const stripeClient = getStripe();
      let paymentIntent: Stripe.PaymentIntent;

      try {
        paymentIntent = await stripeClient.paymentIntents.retrieve(stripePaymentIntentId);
      } catch (stripeError: any) {
        console.error('Stripe error retrieving payment intent:', stripeError);
        throw new HttpsError('not-found', 'Fizetés nem található');
      }

      // Check ownership
      if (paymentIntent.customer !== stripeCustomerId) {
        console.warn(
          `User ${userId} attempted to access payment ${stripePaymentIntentId} belonging to ${paymentIntent.customer}`
        );
        throw new HttpsError('permission-denied', 'Nincs jogosultság a számla letöltéséhez');
      }

      // Check payment was successful
      if (paymentIntent.status !== 'succeeded') {
        throw new HttpsError(
          'failed-precondition',
          'A számla csak sikeres fizetés után érhető el'
        );
      }

      // Fetch invoice PDF from szamlazz.hu using Payment Intent ID as order number
      const client = getSzamlazzClient();

      console.log(`Fetching szamlazz.hu invoice for order number: ${stripePaymentIntentId}`);

      const result = await new Promise<any>((resolve, reject) => {
        client.getInvoiceData(
          {
            invoiceId: stripePaymentIntentId,
            invoiceIdType: szamlazz.Invoice.FROM_ORDER_NUMBER,
            pdf: true,
          },
          (err: any, data: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          }
        );
      });

      if (!result || !result.pdf) {
        console.error('No PDF returned from szamlazz.hu for:', stripePaymentIntentId);
        throw new HttpsError(
          'not-found',
          'A számla PDF nem található. Lehet, hogy a számla még nem készült el.'
        );
      }

      console.log(`Successfully fetched invoice ${result.invoiceNumber || 'unknown'} from szamlazz.hu`);

      // Return PDF as base64
      return {
        success: true,
        pdfBase64: result.pdf.toString('base64'),
        invoiceNumber: result.invoiceNumber || undefined,
      };
    } catch (error: any) {
      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle szamlazz.hu specific errors
      if (error.message?.includes('Invoice not found') || error.code === 'INVOICE_NOT_FOUND') {
        throw new HttpsError(
          'not-found',
          'A számla nem található a számlázz.hu rendszerében. Lehetséges, hogy még feldolgozás alatt áll.'
        );
      }

      console.error('Error fetching szamlazz.hu invoice:', error);
      throw new HttpsError('internal', 'Hiba történt a számla letöltése során');
    }
  }
);
