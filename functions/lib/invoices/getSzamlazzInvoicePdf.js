"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSzamlazzInvoicePdf = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = __importDefault(require("stripe"));
// szamlazz.js doesn't have TypeScript types, so we use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const szamlazz = require('szamlazz.js');
const db = (0, firestore_1.getFirestore)();
// Lazy initialization for Stripe
let stripe = null;
function getStripe() {
    if (!stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new https_1.HttpsError('internal', 'Stripe is not configured');
        }
        stripe = new stripe_1.default(secretKey, { apiVersion: '2024-10-28.acacia' });
    }
    return stripe;
}
// Lazy initialization for szamlazz.hu client
let szamlazzClient = null;
function getSzamlazzClient() {
    if (!szamlazzClient) {
        const agentKey = process.env.SZAMLAZZ_AGENT_KEY;
        if (!agentKey) {
            throw new https_1.HttpsError('internal', 'Szamlazz.hu is not configured');
        }
        szamlazzClient = new szamlazz.Client({
            authToken: agentKey,
            requestInvoiceDownload: true,
        });
    }
    return szamlazzClient;
}
/**
 * Cloud function to fetch Hungarian invoice PDF from szamlazz.hu
 *
 * SzamlaBridge creates invoices in szamlazz.hu using the Stripe Payment Intent ID
 * as the "order number". This function fetches the invoice PDF by that order number.
 */
exports.getSzamlazzInvoicePdf = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    secrets: ['SZAMLAZZ_AGENT_KEY'],
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }
    const { stripePaymentIntentId } = request.data;
    // Validate input
    if (!stripePaymentIntentId || typeof stripePaymentIntentId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Hiányzó fizetési azonosító');
    }
    // Validate format (Stripe Payment Intent IDs start with 'pi_')
    if (!stripePaymentIntentId.startsWith('pi_')) {
        throw new https_1.HttpsError('invalid-argument', 'Érvénytelen fizetési azonosító formátum');
    }
    const userId = request.auth.uid;
    try {
        // Get user's Stripe customer ID
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Felhasználó nem található');
        }
        const userData = userDoc.data();
        const stripeCustomerId = userData?.stripeCustomerId;
        if (!stripeCustomerId) {
            throw new https_1.HttpsError('failed-precondition', 'Nincs Stripe ügyfél azonosító');
        }
        // Verify the payment belongs to this user via Stripe API
        const stripeClient = getStripe();
        let paymentIntent;
        try {
            paymentIntent = await stripeClient.paymentIntents.retrieve(stripePaymentIntentId);
        }
        catch (stripeError) {
            console.error('Stripe error retrieving payment intent:', stripeError);
            throw new https_1.HttpsError('not-found', 'Fizetés nem található');
        }
        // Check ownership
        if (paymentIntent.customer !== stripeCustomerId) {
            console.warn(`User ${userId} attempted to access payment ${stripePaymentIntentId} belonging to ${paymentIntent.customer}`);
            throw new https_1.HttpsError('permission-denied', 'Nincs jogosultság a számla letöltéséhez');
        }
        // Check payment was successful
        if (paymentIntent.status !== 'succeeded') {
            throw new https_1.HttpsError('failed-precondition', 'A számla csak sikeres fizetés után érhető el');
        }
        // Fetch invoice PDF from szamlazz.hu using Payment Intent ID as order number
        const client = getSzamlazzClient();
        console.log(`Fetching szamlazz.hu invoice for order number: ${stripePaymentIntentId}`);
        const result = await new Promise((resolve, reject) => {
            client.getInvoiceData({
                invoiceId: stripePaymentIntentId,
                invoiceIdType: szamlazz.Invoice.FROM_ORDER_NUMBER,
                pdf: true,
            }, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
        if (!result || !result.pdf) {
            console.error('No PDF returned from szamlazz.hu for:', stripePaymentIntentId);
            throw new https_1.HttpsError('not-found', 'A számla PDF nem található. Lehet, hogy a számla még nem készült el.');
        }
        console.log(`Successfully fetched invoice ${result.invoiceNumber || 'unknown'} from szamlazz.hu`);
        // Return PDF as base64
        return {
            success: true,
            pdfBase64: result.pdf.toString('base64'),
            invoiceNumber: result.invoiceNumber || undefined,
        };
    }
    catch (error) {
        // Re-throw HttpsError as-is
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Handle szamlazz.hu specific errors
        if (error.message?.includes('Invoice not found') || error.code === 'INVOICE_NOT_FOUND') {
            throw new https_1.HttpsError('not-found', 'A számla nem található a számlázz.hu rendszerében. Lehetséges, hogy még feldolgozás alatt áll.');
        }
        console.error('Error fetching szamlazz.hu invoice:', error);
        throw new https_1.HttpsError('internal', 'Hiba történt a számla letöltése során');
    }
});
//# sourceMappingURL=getSzamlazzInvoicePdf.js.map