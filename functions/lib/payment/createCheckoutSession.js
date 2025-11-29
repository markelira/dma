"use strict";
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
exports.createCheckoutSession = void 0;
/**
 * Create Stripe Checkout Session
 *
 * Handles creation of Stripe checkout sessions for:
 * - Team subscriptions (monthly, 6-month, 12-month)
 * - Individual course purchases
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
const z = __importStar(require("zod"));
const firestore = admin.firestore();
// Lazy Stripe initialization - will be initialized on first request
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
// Input validation schema
const CreateCheckoutSessionSchema = z.object({
    priceId: z.string().min(1), // Stripe price ID for subscriptions
    courseId: z.string().optional(), // For course purchases
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
    mode: z.enum(['payment', 'subscription']).default('subscription'),
    metadata: z.record(z.string()).optional()
});
/**
 * Create Stripe checkout session
 */
exports.createCheckoutSession = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('🔵 [CF] createCheckoutSession called');
        v2_1.logger.info('🔵 [CF] request.data:', request.data);
        // Authentication check
        if (!request.auth) {
            v2_1.logger.error('❌ [CF] No authentication');
            throw new Error('Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        v2_1.logger.info(`✅ [CF] User authenticated: ${userId}`);
        // Input validation
        v2_1.logger.info('🔵 [CF] Validating input data...');
        const validatedData = CreateCheckoutSessionSchema.parse(request.data);
        v2_1.logger.info('✅ [CF] Input validation passed:', validatedData);
        v2_1.logger.info(`Creating checkout session for user: ${userId}`);
        // Get user document
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Felhasználó nem található');
        }
        const userData = userDoc.data();
        if (!userData) {
            throw new Error('Felhasználói adatok nem találhatók');
        }
        // Get or create Stripe customer
        let stripeCustomerId = userData.stripeCustomerId;
        if (!stripeCustomerId) {
            v2_1.logger.info('Creating new Stripe customer');
            const stripeInstance = getStripeInstance();
            const customer = await stripeInstance.customers.create({
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`,
                metadata: {
                    firebaseUserId: userId
                }
            });
            stripeCustomerId = customer.id;
            // Save customer ID to user document
            await firestore.collection('users').doc(userId).update({
                stripeCustomerId: customer.id,
                updatedAt: new Date().toISOString()
            });
        }
        // Determine subscription type based on user's account
        // Individual: user has NO teamId AND NO companyId
        // Company: user has companyId (B2B) or teamId/isTeamOwner (legacy)
        const isCompanyUser = !!(userData.companyId || userData.teamId || userData.isTeamOwner);
        const subscriptionType = isCompanyUser ? 'company' : 'individual';
        const companyId = userData.companyId || userData.teamId || null;
        v2_1.logger.info(`Subscription type determined: ${subscriptionType}`, {
            companyId,
            teamId: userData.teamId,
            isTeamOwner: userData.isTeamOwner,
        });
        // Prepare session parameters
        const sessionParams = {
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            mode: validatedData.mode,
            success_url: validatedData.successUrl,
            cancel_url: validatedData.cancelUrl,
            locale: 'hu',
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
            // Add trial period (7 days)
            sessionParams.subscription_data = {
                trial_period_days: 7,
                metadata: {
                    userId
                }
            };
        }
        else if (validatedData.mode === 'payment' && validatedData.courseId) {
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
        }
        else {
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
        v2_1.logger.info(`Checkout session created: ${session.id}`);
        const response = {
            success: true,
            data: {
                sessionId: session.id,
                url: session.url
            }
        };
        v2_1.logger.info('✅ [CF] Returning response:', response);
        v2_1.logger.info('✅ [CF] Response structure check:', {
            hasSuccess: 'success' in response,
            successValue: response.success,
            hasData: 'data' in response,
            dataValue: response.data,
            hasUrl: response.data && 'url' in response.data,
            urlValue: response.data?.url
        });
        return response;
    }
    catch (error) {
        v2_1.logger.error('Create checkout session error:', error);
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
//# sourceMappingURL=createCheckoutSession.js.map