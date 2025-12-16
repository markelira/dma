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
exports.createBillingPortalSession = void 0;
/**
 * Create Billing Portal Session Cloud Function
 *
 * Creates a Stripe Customer Portal session for users to manage their billing.
 * Supports both individual users and company admins.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
const z = __importStar(require("zod"));
const firestore = admin.firestore();
// Lazy Stripe initialization
let stripe = null;
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
exports.createBillingPortalSession = (0, https_1.onCall)({
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
        let stripeCustomerId;
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
            v2_1.logger.info('Creating billing portal session for company admin', {
                userId,
                companyId: userData.companyId,
                stripeCustomerId,
            });
        }
        else {
            // Individual user
            stripeCustomerId = userData?.stripeCustomerId;
            if (!stripeCustomerId) {
                return {
                    success: false,
                    error: 'Nincs aktív előfizetés. Kérjük, először fizessen elő.',
                };
            }
            v2_1.logger.info('Creating billing portal session for individual user', {
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
        v2_1.logger.info('Billing portal session created successfully', {
            userId,
            sessionId: session.id,
            url: session.url,
        });
        return {
            success: true,
            url: session.url,
        };
    }
    catch (error) {
        v2_1.logger.error('Error creating billing portal session:', error);
        if (error instanceof stripe_1.default.errors.StripeError) {
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
//# sourceMappingURL=createBillingPortalSession.js.map