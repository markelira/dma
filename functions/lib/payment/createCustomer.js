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
exports.createCustomer = void 0;
/**
 * Create or Retrieve Stripe Customer
 *
 * Standalone function for managing Stripe customer creation and retrieval
 * Ensures each Firebase user has a corresponding Stripe customer ID
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
exports.createCustomer = (0, https_1.onCall)({
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
        v2_1.logger.info(`Creating or retrieving Stripe customer for user: ${userId}`);
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
            v2_1.logger.info(`Retrieving existing Stripe customer: ${userData.stripeCustomerId}`);
            try {
                const stripeInstance = getStripeInstance();
                const customer = await stripeInstance.customers.retrieve(userData.stripeCustomerId);
                // Verify customer is not deleted
                if (customer.deleted) {
                    v2_1.logger.warn(`Customer ${userData.stripeCustomerId} was deleted, creating new one`);
                    // Continue to create new customer
                }
                else {
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
            }
            catch (error) {
                // Customer doesn't exist in Stripe, create new one
                v2_1.logger.warn(`Customer ${userData.stripeCustomerId} not found in Stripe:`, error.message);
            }
        }
        // Create new Stripe customer
        v2_1.logger.info('Creating new Stripe customer');
        const customerData = {
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
        v2_1.logger.info(`Stripe customer created: ${customer.id}`);
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
    catch (error) {
        v2_1.logger.error('Create customer error:', error);
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
//# sourceMappingURL=createCustomer.js.map