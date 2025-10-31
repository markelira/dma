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
exports.applyPromoCode = exports.getSubscriptionInvoices = exports.reactivateSubscription = exports.cancelSubscription = exports.getSubscriptionStatus = void 0;
/**
 * Subscription Management Cloud Functions
 *
 * Handles subscription status checks, cancellations, and retention flows
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
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
/**
 * Get user's subscription status
 */
exports.getSubscriptionStatus = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        // Get user document
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Felhasználó nem található');
        }
        const userData = userDoc.data();
        // Check for direct subscription
        const subscriptionsSnapshot = await firestore
            .collection('subscriptions')
            .where('userId', '==', userId)
            .where('status', 'in', ['active', 'trialing'])
            .limit(1)
            .get();
        if (!subscriptionsSnapshot.empty) {
            const subscriptionDoc = subscriptionsSnapshot.docs[0];
            const subscriptionData = subscriptionDoc.data();
            return {
                success: true,
                hasSubscription: true,
                isActive: true,
                hasActiveSubscription: true,
                subscription: {
                    id: subscriptionDoc.id,
                    subscriptionId: subscriptionData.stripeSubscriptionId || subscriptionDoc.id,
                    status: subscriptionData.status,
                    planName: subscriptionData.planName || 'DMA Előfizetés',
                    currentPeriodStart: subscriptionData.currentPeriodStart,
                    currentPeriodEnd: subscriptionData.currentPeriodEnd,
                    cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
                    createdAt: subscriptionData.createdAt,
                    trialEnd: subscriptionData.trialEnd || null,
                    isTrialing: subscriptionData.status === 'trialing',
                }
            };
        }
        // Check for team/company subscription inheritance
        const teamId = userData?.teamId;
        if (teamId) {
            const teamDoc = await firestore.collection('teams').doc(teamId).get();
            if (teamDoc.exists) {
                const teamData = teamDoc.data();
                const teamOwnerId = teamData?.ownerId;
                if (teamOwnerId) {
                    // Check team owner's subscription
                    const ownerSubscriptionSnapshot = await firestore
                        .collection('subscriptions')
                        .where('userId', '==', teamOwnerId)
                        .where('status', 'in', ['active', 'trialing'])
                        .limit(1)
                        .get();
                    if (!ownerSubscriptionSnapshot.empty) {
                        const subscriptionDoc = ownerSubscriptionSnapshot.docs[0];
                        const subscriptionData = subscriptionDoc.data();
                        return {
                            success: true,
                            hasSubscription: true,
                            isActive: true,
                            hasActiveSubscription: true,
                            inheritedFromTeam: true,
                            subscription: {
                                id: subscriptionDoc.id,
                                subscriptionId: subscriptionData.stripeSubscriptionId || subscriptionDoc.id,
                                status: subscriptionData.status,
                                planName: subscriptionData.planName || 'DMA Csapat Előfizetés',
                                currentPeriodStart: subscriptionData.currentPeriodStart,
                                currentPeriodEnd: subscriptionData.currentPeriodEnd,
                                cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
                                createdAt: subscriptionData.createdAt,
                                trialEnd: subscriptionData.trialEnd || null,
                                isTrialing: subscriptionData.status === 'trialing',
                            }
                        };
                    }
                }
            }
        }
        // No active subscription
        return {
            success: true,
            hasSubscription: false,
            isActive: false,
            hasActiveSubscription: false,
            subscription: null
        };
    }
    catch (error) {
        v2_1.logger.error('Get subscription status error:', error);
        throw new Error(error.message || 'Előfizetés státusz lekérdezése sikertelen');
    }
});
/**
 * Cancel subscription with optional retention offer
 */
exports.cancelSubscription = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const { subscriptionId, reason, acceptRetentionOffer } = request.data;
        if (!subscriptionId) {
            throw new Error('Előfizetés azonosító kötelező');
        }
        const userId = request.auth.uid;
        // Get subscription document
        const subscriptionDoc = await firestore.collection('subscriptions').doc(subscriptionId).get();
        if (!subscriptionDoc.exists) {
            throw new Error('Előfizetés nem található');
        }
        const subscriptionData = subscriptionDoc.data();
        // Verify ownership
        if (subscriptionData?.userId !== userId) {
            throw new Error('Nincs jogosultságod ehhez az előfizetéshez');
        }
        // If user accepted retention offer (free month)
        if (acceptRetentionOffer) {
            const stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
            if (stripeSubscriptionId) {
                // Extend Stripe subscription by 1 month for free (pause collection)
                try {
                    const stripeInstance = getStripeInstance();
                    await stripeInstance.subscriptions.update(stripeSubscriptionId, {
                        pause_collection: {
                            behavior: 'keep_as_draft',
                            resumes_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
                        }
                    });
                    v2_1.logger.info(`Stripe subscription ${stripeSubscriptionId} paused for 1 month`);
                }
                catch (stripeError) {
                    v2_1.logger.error('Error pausing Stripe subscription:', stripeError);
                    throw new Error('Stripe előfizetés felfüggesztése sikertelen');
                }
            }
            // Update Firestore
            const currentPeriodEnd = new Date(subscriptionData.currentPeriodEnd);
            const newPeriodEnd = new Date(currentPeriodEnd);
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
            await firestore.collection('subscriptions').doc(subscriptionId).update({
                currentPeriodEnd: newPeriodEnd.toISOString(),
                retentionOfferApplied: true,
                retentionOfferAppliedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            v2_1.logger.info(`Retention offer applied for subscription ${subscriptionId}`);
            return {
                success: true,
                message: 'Köszönjük! 1 havi ingyenes hozzáférést adtunk Önnek.',
                retentionOfferApplied: true,
                newPeriodEnd: newPeriodEnd.toISOString()
            };
        }
        // Cancel subscription in Stripe
        const stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
        if (stripeSubscriptionId) {
            try {
                // Cancel at period end in Stripe
                const stripeInstance = getStripeInstance();
                await stripeInstance.subscriptions.update(stripeSubscriptionId, {
                    cancel_at_period_end: true,
                    cancellation_details: {
                        comment: reason || 'User requested cancellation'
                    }
                });
                v2_1.logger.info(`Stripe subscription ${stripeSubscriptionId} marked for cancellation`);
            }
            catch (stripeError) {
                v2_1.logger.error('Error canceling Stripe subscription:', stripeError);
                throw new Error('Stripe előfizetés lemondása sikertelen');
            }
        }
        // Update Firestore
        await firestore.collection('subscriptions').doc(subscriptionId).update({
            cancelAtPeriodEnd: true,
            cancelReason: reason || null,
            canceledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        v2_1.logger.info(`Subscription ${subscriptionId} marked for cancellation`);
        return {
            success: true,
            message: 'Az előfizetés lemondva. A jelenlegi időszak végéig még hozzáférhet.',
            canceledAt: new Date().toISOString(),
            accessUntil: subscriptionData.currentPeriodEnd
        };
    }
    catch (error) {
        v2_1.logger.error('Cancel subscription error:', error);
        throw new Error(error.message || 'Előfizetés lemondása sikertelen');
    }
});
/**
 * Reactivate a canceled subscription
 */
exports.reactivateSubscription = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const { subscriptionId } = request.data;
        if (!subscriptionId) {
            throw new Error('Előfizetés azonosító kötelező');
        }
        const userId = request.auth.uid;
        // Get subscription document
        const subscriptionDoc = await firestore.collection('subscriptions').doc(subscriptionId).get();
        if (!subscriptionDoc.exists) {
            throw new Error('Előfizetés nem található');
        }
        const subscriptionData = subscriptionDoc.data();
        // Verify ownership
        if (subscriptionData?.userId !== userId) {
            throw new Error('Nincs jogosultságod ehhez az előfizetéshez');
        }
        // Reactivate subscription in Stripe
        const stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
        if (stripeSubscriptionId) {
            try {
                // Remove cancel_at_period_end in Stripe
                const stripeInstance = getStripeInstance();
                await stripeInstance.subscriptions.update(stripeSubscriptionId, {
                    cancel_at_period_end: false
                });
                v2_1.logger.info(`Stripe subscription ${stripeSubscriptionId} reactivated`);
            }
            catch (stripeError) {
                v2_1.logger.error('Error reactivating Stripe subscription:', stripeError);
                throw new Error('Stripe előfizetés újraaktiválása sikertelen');
            }
        }
        // Update Firestore
        await firestore.collection('subscriptions').doc(subscriptionId).update({
            cancelAtPeriodEnd: false,
            reactivatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        v2_1.logger.info(`Subscription ${subscriptionId} reactivated`);
        return {
            success: true,
            message: 'Az előfizetés újraaktiválva'
        };
    }
    catch (error) {
        v2_1.logger.error('Reactivate subscription error:', error);
        throw new Error(error.message || 'Előfizetés újraaktiválása sikertelen');
    }
});
/**
 * Get subscription invoices
 */
exports.getSubscriptionInvoices = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        // Get all invoices for user
        const invoicesSnapshot = await firestore
            .collection('invoices')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const invoices = [];
        invoicesSnapshot.forEach(doc => {
            const data = doc.data();
            invoices.push({
                id: doc.id,
                amount: data.amount,
                currency: data.currency || 'HUF',
                status: data.status,
                invoiceNumber: data.invoiceNumber,
                invoiceUrl: data.invoiceUrl,
                paidAt: data.paidAt,
                createdAt: data.createdAt,
                description: data.description || 'DMA Előfizetés'
            });
        });
        return {
            success: true,
            invoices
        };
    }
    catch (error) {
        v2_1.logger.error('Get invoices error:', error);
        throw new Error(error.message || 'Számlák lekérdezése sikertelen');
    }
});
/**
 * Apply promo code to subscription
 */
exports.applyPromoCode = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const { promoCode } = request.data;
        if (!promoCode) {
            throw new Error('Promóciós kód kötelező');
        }
        const userId = request.auth.uid;
        // Find promo code
        const promoSnapshot = await firestore
            .collection('promoCodes')
            .where('code', '==', promoCode.toUpperCase())
            .where('active', '==', true)
            .limit(1)
            .get();
        if (promoSnapshot.empty) {
            throw new Error('Érvénytelen promóciós kód');
        }
        const promoDoc = promoSnapshot.docs[0];
        const promoData = promoDoc.data();
        // Check if promo code is expired
        if (promoData.expiresAt) {
            const expiryDate = new Date(promoData.expiresAt);
            if (expiryDate < new Date()) {
                throw new Error('Ez a promóciós kód lejárt');
            }
        }
        // Check max uses
        if (promoData.maxUses && promoData.usedCount >= promoData.maxUses) {
            throw new Error('Ez a promóciós kód elfogyott');
        }
        // Check if user already used this promo code
        const usageSnapshot = await firestore
            .collection('promoCodeUsages')
            .where('userId', '==', userId)
            .where('promoCodeId', '==', promoDoc.id)
            .limit(1)
            .get();
        if (!usageSnapshot.empty) {
            throw new Error('Ezt a promóciós kódot már felhasználtad');
        }
        // Calculate subscription end date based on duration
        const durationMonths = parseInt(promoData.durationMonths) || 1;
        const subscriptionEnd = new Date();
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + durationMonths);
        // Create subscription with promo code
        const subscriptionData = {
            userId,
            status: 'active',
            planName: `DMA ${durationMonths} hónapos előfizetés`,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: subscriptionEnd.toISOString(),
            cancelAtPeriodEnd: false,
            promoCodeId: promoDoc.id,
            promoCode: promoCode.toUpperCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const subscriptionRef = await firestore.collection('subscriptions').add(subscriptionData);
        // Record promo code usage
        await firestore.collection('promoCodeUsages').add({
            userId,
            promoCodeId: promoDoc.id,
            promoCode: promoCode.toUpperCase(),
            subscriptionId: subscriptionRef.id,
            usedAt: new Date().toISOString()
        });
        // Increment promo code usage count
        await firestore.collection('promoCodes').doc(promoDoc.id).update({
            usedCount: admin.firestore.FieldValue.increment(1),
            updatedAt: new Date().toISOString()
        });
        v2_1.logger.info(`Promo code ${promoCode} applied for user ${userId}`);
        return {
            success: true,
            message: `Promóciós kód sikeresen alkalmazva! ${durationMonths} hónap ingyenes hozzáférést kaptál.`,
            subscription: {
                id: subscriptionRef.id,
                ...subscriptionData
            }
        };
    }
    catch (error) {
        v2_1.logger.error('Apply promo code error:', error);
        throw new Error(error.message || 'Promóciós kód alkalmazása sikertelen');
    }
});
//# sourceMappingURL=subscription.js.map