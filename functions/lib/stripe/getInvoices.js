"use strict";
/**
 * Get Stripe Invoices Cloud Function
 *
 * Fetches all invoices from Stripe for the authenticated user
 * Enriches invoice data with course information from Firestore
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
exports.getStripeInvoices = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
const firestore = admin.firestore();
// Lazy Stripe initialization
let stripe = null;
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
 * Get Stripe Invoices for authenticated user
 */
exports.getStripeInvoices = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
    memory: '256MiB',
}, async (request) => {
    try {
        // Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        v2_1.logger.info('[getStripeInvoices] Fetching invoices for user:', userId);
        // Get user from Firestore to find stripeCustomerId
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            throw new https_1.HttpsError('not-found', 'Felhasználó nem található');
        }
        const stripeCustomerId = userData.stripeCustomerId;
        if (!stripeCustomerId) {
            // User has no Stripe customer ID, return empty array
            v2_1.logger.info('[getStripeInvoices] User has no Stripe customer ID, returning empty list');
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
        v2_1.logger.info(`[getStripeInvoices] Found ${invoices.data.length} invoices from Stripe`);
        // Enrich invoices with course data from Firestore
        const enrichedInvoices = [];
        for (const invoice of invoices.data) {
            try {
                // Determine payment status
                let status = 'pending';
                if (invoice.status === 'paid') {
                    status = 'succeeded';
                }
                else if (invoice.status === 'void' || invoice.status === 'uncollectible') {
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
                let courseId;
                let courseName;
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
                    }
                    catch (error) {
                        v2_1.logger.warn(`[getStripeInvoices] Could not fetch course ${courseId}:`, error);
                    }
                }
                // Extract payment intent ID for szamlazz.hu lookup
                let paymentIntentId;
                if (invoice.payment_intent) {
                    paymentIntentId = typeof invoice.payment_intent === 'string'
                        ? invoice.payment_intent
                        : invoice.payment_intent.id;
                }
                // Build enriched invoice object
                const enrichedInvoice = {
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
                    paymentIntentId, // For szamlazz.hu invoice lookup
                };
                enrichedInvoices.push(enrichedInvoice);
            }
            catch (error) {
                v2_1.logger.error('[getStripeInvoices] Error processing invoice:', invoice.id, error);
                // Continue processing other invoices
            }
        }
        v2_1.logger.info(`[getStripeInvoices] Successfully enriched ${enrichedInvoices.length} invoices`);
        return {
            success: true,
            invoices: enrichedInvoices,
        };
    }
    catch (error) {
        v2_1.logger.error('[getStripeInvoices] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message || 'Hiba történt a számlák betöltésekor');
    }
});
//# sourceMappingURL=getInvoices.js.map