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
exports.dailySubscriptionReconciliation = exports.syncSubscriptionFromStripe = exports.applyPromoCode = exports.getSubscriptionInvoices = exports.reactivateSubscription = exports.cancelSubscription = exports.getSubscriptionStatus = void 0;
/**
 * Subscription Management Cloud Functions
 *
 * Handles subscription status checks, cancellations, and retention flows
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const stripe_1 = __importDefault(require("stripe"));
const companySubscriptionCanceled_1 = require("./email/templates/companySubscriptionCanceled");
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
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatusToInternal(stripeStatus) {
    switch (stripeStatus) {
        case 'active':
            return 'active';
        case 'trialing':
            return 'trialing';
        case 'past_due':
            return 'past_due';
        case 'canceled':
        case 'unpaid':
        case 'incomplete_expired':
            return 'canceled';
        case 'incomplete':
        case 'paused':
        default:
            return 'none';
    }
}
/**
 * Verify subscription status against Stripe and sync if different
 * Returns the verified status from Stripe
 */
async function verifyAndSyncStripeStatus(stripeSubscriptionId, firestoreStatus, updateTarget) {
    try {
        const stripeInstance = getStripeInstance();
        const stripeSub = await stripeInstance.subscriptions.retrieve(stripeSubscriptionId);
        const liveStatus = mapStripeStatusToInternal(stripeSub.status);
        v2_1.logger.info('🔍 [verifyStripeStatus] Stripe verification:', {
            stripeSubscriptionId,
            stripeStatus: stripeSub.status,
            mappedStatus: liveStatus,
            firestoreStatus: firestoreStatus || 'undefined',
            needsSync: liveStatus !== firestoreStatus,
        });
        // Sync if different
        if (liveStatus !== firestoreStatus) {
            v2_1.logger.info('🔄 [verifyStripeStatus] Syncing status mismatch:', {
                from: firestoreStatus,
                to: liveStatus,
                target: `${updateTarget.collection}/${updateTarget.docId}`,
            });
            await firestore.collection(updateTarget.collection).doc(updateTarget.docId).update({
                subscriptionStatus: liveStatus,
                lastStripeSync: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
        return { status: liveStatus, verified: true, subscription: stripeSub };
    }
    catch (error) {
        v2_1.logger.warn('⚠️ [verifyStripeStatus] Could not verify with Stripe:', {
            stripeSubscriptionId,
            error: error.message,
        });
        // If Stripe lookup fails, return Firestore status with verified: false
        const fallbackStatus = mapStripeStatusToInternal(firestoreStatus || 'none');
        return { status: fallbackStatus, verified: false };
    }
}
/**
 * Get user's subscription status
 * SCALABILITY: High-traffic function, configured for performance
 */
exports.getSubscriptionStatus = (0, https_1.onCall)({
    cors: true,
    region: 'europe-west1',
    memory: '256MiB',
    // minInstances removed to reduce baseline costs (~$0.22/day savings)
    maxInstances: 50,
    timeoutSeconds: 30,
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
        // PRIORITY 1: Check user's subscriptionStatus field (set by webhook when team is created)
        if (userData?.subscriptionStatus === 'active' || userData?.subscriptionStatus === 'trialing') {
            let status = userData.subscriptionStatus;
            let stripeVerified = false;
            // If user has a Stripe subscription ID, verify against Stripe (source of truth)
            const userStripeSubId = userData.stripeSubscriptionId;
            if (userStripeSubId) {
                const verification = await verifyAndSyncStripeStatus(userStripeSubId, userData.subscriptionStatus, { collection: 'users', docId: userId });
                status = verification.status;
                stripeVerified = verification.verified;
                // If Stripe says not active/trialing, skip this priority
                if (status !== 'active' && status !== 'trialing') {
                    v2_1.logger.info('🔍 [getSubscriptionStatus] PRIORITY 1 skipped - Stripe verified status is not active/trialing:', {
                        userId,
                        firestoreStatus: userData.subscriptionStatus,
                        stripeStatus: status,
                    });
                    // Continue to next priority instead of returning
                }
            }
            // Only return if status is still active/trialing after verification
            if (status === 'active' || status === 'trialing') {
                const isTrialing = status === 'trialing';
                // If user has teamId, get team subscription details
                if (userData.teamId) {
                    const teamDoc = await firestore.collection('teams').doc(userData.teamId).get();
                    if (teamDoc.exists) {
                        const teamData = teamDoc.data();
                        return {
                            success: true,
                            hasSubscription: true,
                            isActive: true,
                            hasActiveSubscription: true,
                            viaTeam: true,
                            stripeVerified,
                            hasUsedTrial: userData?.hasUsedTrial || false,
                            subscription: {
                                id: userData.stripeSubscriptionId || teamData?.stripeSubscriptionId || userData.teamId,
                                subscriptionId: teamData?.stripeSubscriptionId || userData.stripeSubscriptionId,
                                status: status,
                                planName: teamData?.subscriptionPlan || 'DMA Előfizetés',
                                currentPeriodStart: teamData?.subscriptionStartDate?.toDate?.() || null,
                                currentPeriodEnd: teamData?.subscriptionEndDate?.toDate?.() || null,
                                cancelAtPeriodEnd: false,
                                createdAt: teamData?.createdAt?.toDate?.() || null,
                                trialEnd: teamData?.trialEndDate?.toDate?.() || null,
                                isTrialing: isTrialing,
                            }
                        };
                    }
                }
                // User has subscriptionStatus but no team (shouldn't happen, but handle it)
                return {
                    success: true,
                    hasSubscription: true,
                    isActive: true,
                    hasActiveSubscription: true,
                    stripeVerified,
                    hasUsedTrial: userData?.hasUsedTrial || false,
                    subscription: {
                        id: userData.stripeSubscriptionId || 'direct',
                        subscriptionId: userData.stripeSubscriptionId,
                        status: status,
                        planName: 'DMA Előfizetés',
                        currentPeriodStart: null,
                        currentPeriodEnd: null,
                        cancelAtPeriodEnd: false,
                        createdAt: null,
                        trialEnd: null,
                        isTrialing: isTrialing,
                    }
                };
            }
        }
        // PRIORITY 2: Check for direct subscription in subscriptions collection (fallback)
        const subscriptionsSnapshot = await firestore
            .collection('subscriptions')
            .where('userId', '==', userId)
            .where('status', 'in', ['active', 'trialing'])
            .limit(1)
            .get();
        if (!subscriptionsSnapshot.empty) {
            const subscriptionDoc = subscriptionsSnapshot.docs[0];
            const subscriptionData = subscriptionDoc.data();
            let status = subscriptionData.status;
            let stripeVerified = false;
            // Verify against Stripe if we have a subscription ID
            const subStripeId = subscriptionData.stripeSubscriptionId;
            if (subStripeId) {
                const verification = await verifyAndSyncStripeStatus(subStripeId, subscriptionData.status, { collection: 'subscriptions', docId: subscriptionDoc.id });
                status = verification.status;
                stripeVerified = verification.verified;
                // If Stripe says not active/trialing, skip this priority
                if (status !== 'active' && status !== 'trialing') {
                    v2_1.logger.info('🔍 [getSubscriptionStatus] PRIORITY 2 skipped - Stripe verified status is not active/trialing:', {
                        userId,
                        subscriptionId: subscriptionDoc.id,
                        firestoreStatus: subscriptionData.status,
                        stripeStatus: status,
                    });
                    // Continue to next priority instead of returning
                }
            }
            // Only return if status is still active/trialing after verification
            if (status === 'active' || status === 'trialing') {
                return {
                    success: true,
                    hasSubscription: true,
                    isActive: true,
                    hasActiveSubscription: true,
                    stripeVerified,
                    hasUsedTrial: userData?.hasUsedTrial || false,
                    subscription: {
                        id: subscriptionDoc.id,
                        subscriptionId: subscriptionData.stripeSubscriptionId || subscriptionDoc.id,
                        status: status,
                        planName: subscriptionData.planName || 'DMA Előfizetés',
                        currentPeriodStart: subscriptionData.currentPeriodStart,
                        currentPeriodEnd: subscriptionData.currentPeriodEnd,
                        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
                        createdAt: subscriptionData.createdAt,
                        trialEnd: subscriptionData.trialEnd || null,
                        isTrialing: status === 'trialing',
                    }
                };
            }
        }
        // PRIORITY 3: Check team subscription status directly (not through subscriptions collection)
        const teamId = userData?.teamId;
        if (teamId) {
            const teamDoc = await firestore.collection('teams').doc(teamId).get();
            if (teamDoc.exists) {
                const teamData = teamDoc.data();
                // Check team's subscription status directly
                if (teamData?.subscriptionStatus === 'active' || teamData?.subscriptionStatus === 'trialing') {
                    let status = teamData.subscriptionStatus;
                    let stripeVerified = false;
                    // Verify against Stripe if we have a subscription ID
                    const teamStripeId = teamData.stripeSubscriptionId;
                    if (teamStripeId) {
                        const verification = await verifyAndSyncStripeStatus(teamStripeId, teamData.subscriptionStatus, { collection: 'teams', docId: teamId });
                        status = verification.status;
                        stripeVerified = verification.verified;
                        // If Stripe says not active/trialing, skip this priority
                        if (status !== 'active' && status !== 'trialing') {
                            v2_1.logger.info('🔍 [getSubscriptionStatus] PRIORITY 3 skipped - Stripe verified status is not active/trialing:', {
                                userId,
                                teamId,
                                firestoreStatus: teamData.subscriptionStatus,
                                stripeStatus: status,
                            });
                            // Continue to next priority instead of returning
                        }
                    }
                    // Only return if status is still active/trialing after verification
                    if (status === 'active' || status === 'trialing') {
                        return {
                            success: true,
                            hasSubscription: true,
                            isActive: true,
                            hasActiveSubscription: true,
                            inheritedFromTeam: true,
                            stripeVerified,
                            hasUsedTrial: userData?.hasUsedTrial || false,
                            subscription: {
                                id: teamData.stripeSubscriptionId || teamId,
                                subscriptionId: teamData.stripeSubscriptionId,
                                status: status,
                                planName: teamData.subscriptionPlan || 'DMA Csapat Előfizetés',
                                currentPeriodStart: teamData.subscriptionStartDate?.toDate?.() || null,
                                currentPeriodEnd: teamData.subscriptionEndDate?.toDate?.() || null,
                                cancelAtPeriodEnd: false,
                                createdAt: teamData.createdAt?.toDate?.() || null,
                                trialEnd: teamData.trialEndDate?.toDate?.() || null,
                                isTrialing: status === 'trialing',
                            }
                        };
                    }
                }
            }
        }
        // PRIORITY 4: Check company subscription status (B2B model)
        const companyId = userData?.companyId;
        v2_1.logger.info('🔍 [getSubscriptionStatus] Checking company subscription (PRIORITY 4):', {
            userId,
            companyId: companyId || 'NOT SET',
            hasCompanyId: !!companyId,
            userCompanyRole: userData?.companyRole || 'NOT SET',
        });
        if (companyId) {
            const companyDoc = await firestore.collection('companies').doc(companyId).get();
            v2_1.logger.info('🔍 [getSubscriptionStatus] Company document lookup:', {
                companyId,
                exists: companyDoc.exists,
            });
            if (companyDoc.exists) {
                const companyData = companyDoc.data();
                v2_1.logger.info('🔍 [getSubscriptionStatus] Company data:', {
                    companyId,
                    subscriptionStatus: companyData?.subscriptionStatus || 'NOT SET',
                    hasStripeSubscription: !!companyData?.stripeSubscriptionId,
                });
                // Check company's subscription status (Stripe handles trial via 7-day trial period)
                if (companyData?.subscriptionStatus === 'active' || companyData?.subscriptionStatus === 'trialing') {
                    let status = companyData.subscriptionStatus;
                    let stripeVerified = false;
                    // Verify against Stripe if we have a subscription ID
                    const companyStripeId = companyData.stripeSubscriptionId;
                    if (companyStripeId) {
                        const verification = await verifyAndSyncStripeStatus(companyStripeId, companyData.subscriptionStatus, { collection: 'companies', docId: companyId });
                        status = verification.status;
                        stripeVerified = verification.verified;
                        // If Stripe says not active/trialing, skip this priority
                        if (status !== 'active' && status !== 'trialing') {
                            v2_1.logger.info('🔍 [getSubscriptionStatus] PRIORITY 4 skipped - Stripe verified status is not active/trialing:', {
                                userId,
                                companyId,
                                firestoreStatus: companyData.subscriptionStatus,
                                stripeStatus: status,
                            });
                            // Continue to return no subscription
                        }
                    }
                    // Only return if status is still active/trialing after verification
                    if (status === 'active' || status === 'trialing') {
                        return {
                            success: true,
                            hasSubscription: true,
                            isActive: true,
                            hasActiveSubscription: true,
                            viaCompany: true,
                            stripeVerified,
                            hasUsedTrial: userData?.hasUsedTrial || false,
                            subscription: {
                                id: companyData.stripeSubscriptionId || companyId,
                                subscriptionId: companyData.stripeSubscriptionId,
                                status: status,
                                planName: companyData.plan || 'DMA Vállalati Előfizetés',
                                currentPeriodStart: companyData.subscriptionStartDate?.toDate?.() || null,
                                currentPeriodEnd: companyData.subscriptionEndDate?.toDate?.() || null,
                                cancelAtPeriodEnd: false,
                                createdAt: companyData.createdAt?.toDate?.() || null,
                                trialEnd: companyData.trialEndDate?.toDate?.() || null,
                                isTrialing: status === 'trialing',
                            }
                        };
                    }
                }
                // No active subscription - company needs to complete Stripe checkout
                // Stripe handles 7-day trial period, not the app
            }
        }
        // No active subscription
        return {
            success: true,
            hasSubscription: false,
            isActive: false,
            hasActiveSubscription: false,
            hasUsedTrial: userData?.hasUsedTrial || false,
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
    region: 'europe-west1',
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
        // Notify company employees if this is a company subscription (fire-and-forget)
        (async () => {
            try {
                // Check if user has a company
                const userDoc = await firestore.collection('users').doc(userId).get();
                const userData = userDoc.data();
                const companyId = userData?.companyId;
                if (companyId && userData?.companyRole === 'owner') {
                    // Get company name
                    const companyDoc = await firestore.collection('companies').doc(companyId).get();
                    const companyName = companyDoc.data()?.name || 'A cég';
                    // Get all active employees
                    const employeesSnapshot = await firestore
                        .collection('companies')
                        .doc(companyId)
                        .collection('employees')
                        .where('status', '==', 'active')
                        .get();
                    // Send notification to each employee
                    for (const employeeDoc of employeesSnapshot.docs) {
                        const employeeData = employeeDoc.data();
                        const employeeUserId = employeeData.userId;
                        if (employeeUserId) {
                            // Get employee's user data for email
                            const employeeUserDoc = await firestore.collection('users').doc(employeeUserId).get();
                            const employeeUserData = employeeUserDoc.data();
                            if (employeeUserData?.email) {
                                const employeeFirstName = employeeData.firstName || employeeUserData.firstName || 'Kollega';
                                await (0, companySubscriptionCanceled_1.sendCompanySubscriptionCanceledEmail)({
                                    employeeFirstName,
                                    employeeEmail: employeeUserData.email,
                                    companyName,
                                }).then((result) => {
                                    if (result.success) {
                                        v2_1.logger.info(`Company cancellation email sent to employee ${employeeUserId}`);
                                    }
                                    else {
                                        v2_1.logger.warn(`Failed to send cancellation email to employee ${employeeUserId}:`, result.error);
                                    }
                                });
                            }
                        }
                    }
                    v2_1.logger.info(`Notified ${employeesSnapshot.size} employees about subscription cancellation`);
                }
            }
            catch (notifyError) {
                v2_1.logger.warn('Error notifying employees about cancellation:', notifyError.message);
                // Don't throw - main cancellation was successful
            }
        })();
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
    region: 'europe-west1',
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
    region: 'europe-west1',
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
                description: data.description || 'DMA Előfizetés',
                stripePaymentIntentId: data.stripePaymentIntentId || data.paymentIntentId, // For szamlazz.hu invoice lookup
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
    region: 'europe-west1',
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
/**
 * Admin function to sync subscription status from Stripe
 * Allows admins to manually fix status mismatches
 */
exports.syncSubscriptionFromStripe = (0, https_1.onCall)({
    cors: true,
    region: 'europe-west1',
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const { targetUserId } = request.data;
        if (!targetUserId) {
            throw new Error('Target user ID is required');
        }
        // Check if caller is admin
        const callerDoc = await firestore.collection('users').doc(request.auth.uid).get();
        const callerData = callerDoc.data();
        if (callerData?.role !== 'admin') {
            throw new Error('Admin jogosultság szükséges');
        }
        v2_1.logger.info('[syncSubscriptionFromStripe] Starting sync', {
            targetUserId,
            calledBy: request.auth.uid,
        });
        const results = {
            synced: [],
            errors: [],
            beforeStatus: null,
            afterStatus: null,
        };
        // Get target user document
        const targetUserDoc = await firestore.collection('users').doc(targetUserId).get();
        if (!targetUserDoc.exists) {
            throw new Error('Felhasználó nem található');
        }
        const userData = targetUserDoc.data();
        results.beforeStatus = userData?.subscriptionStatus || 'none';
        // 1. Check user's direct stripeSubscriptionId
        if (userData?.stripeSubscriptionId) {
            try {
                const verification = await verifyAndSyncStripeStatus(userData.stripeSubscriptionId, userData.subscriptionStatus, { collection: 'users', docId: targetUserId });
                results.synced.push(`users/${targetUserId}: ${userData.subscriptionStatus} → ${verification.status}`);
                results.afterStatus = verification.status;
            }
            catch (err) {
                results.errors.push(`users/${targetUserId}: ${err.message}`);
            }
        }
        // 2. Check user's team subscription
        if (userData?.teamId) {
            const teamDoc = await firestore.collection('teams').doc(userData.teamId).get();
            if (teamDoc.exists) {
                const teamData = teamDoc.data();
                if (teamData?.stripeSubscriptionId) {
                    try {
                        const verification = await verifyAndSyncStripeStatus(teamData.stripeSubscriptionId, teamData.subscriptionStatus, { collection: 'teams', docId: userData.teamId });
                        results.synced.push(`teams/${userData.teamId}: ${teamData.subscriptionStatus} → ${verification.status}`);
                        // Update user's status based on team
                        if (verification.status !== results.afterStatus) {
                            results.afterStatus = verification.status;
                        }
                    }
                    catch (err) {
                        results.errors.push(`teams/${userData.teamId}: ${err.message}`);
                    }
                }
            }
        }
        // 3. Check user's company subscription
        if (userData?.companyId) {
            const companyDoc = await firestore.collection('companies').doc(userData.companyId).get();
            if (companyDoc.exists) {
                const companyData = companyDoc.data();
                if (companyData?.stripeSubscriptionId) {
                    try {
                        const verification = await verifyAndSyncStripeStatus(companyData.stripeSubscriptionId, companyData.subscriptionStatus, { collection: 'companies', docId: userData.companyId });
                        results.synced.push(`companies/${userData.companyId}: ${companyData.subscriptionStatus} → ${verification.status}`);
                        // Update user's status based on company
                        if (verification.status !== results.afterStatus) {
                            results.afterStatus = verification.status;
                        }
                    }
                    catch (err) {
                        results.errors.push(`companies/${userData.companyId}: ${err.message}`);
                    }
                }
            }
        }
        // 4. Check subscriptions collection for this user
        const subscriptionsSnapshot = await firestore
            .collection('subscriptions')
            .where('userId', '==', targetUserId)
            .get();
        for (const subDoc of subscriptionsSnapshot.docs) {
            const subData = subDoc.data();
            if (subData.stripeSubscriptionId) {
                try {
                    const verification = await verifyAndSyncStripeStatus(subData.stripeSubscriptionId, subData.status, { collection: 'subscriptions', docId: subDoc.id });
                    results.synced.push(`subscriptions/${subDoc.id}: ${subData.status} → ${verification.status}`);
                }
                catch (err) {
                    results.errors.push(`subscriptions/${subDoc.id}: ${err.message}`);
                }
            }
        }
        v2_1.logger.info('[syncSubscriptionFromStripe] Completed', {
            targetUserId,
            synced: results.synced.length,
            errors: results.errors.length,
        });
        return {
            success: true,
            message: `Sync completed. ${results.synced.length} updated, ${results.errors.length} errors.`,
            results,
        };
    }
    catch (error) {
        v2_1.logger.error('[syncSubscriptionFromStripe] Error:', error);
        throw new Error(error.message || 'Sync failed');
    }
});
/**
 * Scheduled daily reconciliation of subscription statuses
 * Runs every day at 3 AM UTC to sync Firestore with Stripe
 */
exports.dailySubscriptionReconciliation = (0, scheduler_1.onSchedule)({
    schedule: '0 3 * * *', // Every day at 3 AM UTC
    region: 'europe-west1',
    timeoutSeconds: 540, // 9 minutes max
    memory: '512MiB',
}, async () => {
    v2_1.logger.info('[dailySubscriptionReconciliation] Starting daily reconciliation');
    const stats = {
        usersChecked: 0,
        teamsChecked: 0,
        companiesChecked: 0,
        statusMismatches: 0,
        syncedDocuments: 0,
        errors: 0,
    };
    try {
        // 1. Reconcile users with active/trialing subscriptions
        const activeUsersSnapshot = await firestore
            .collection('users')
            .where('subscriptionStatus', 'in', ['active', 'trialing'])
            .get();
        v2_1.logger.info(`[dailySubscriptionReconciliation] Found ${activeUsersSnapshot.size} users with active/trialing status`);
        for (const userDoc of activeUsersSnapshot.docs) {
            stats.usersChecked++;
            const userData = userDoc.data();
            if (userData.stripeSubscriptionId) {
                try {
                    const verification = await verifyAndSyncStripeStatus(userData.stripeSubscriptionId, userData.subscriptionStatus, { collection: 'users', docId: userDoc.id });
                    if (verification.status !== userData.subscriptionStatus) {
                        stats.statusMismatches++;
                        stats.syncedDocuments++;
                        v2_1.logger.info('[dailySubscriptionReconciliation] User status synced', {
                            userId: userDoc.id,
                            from: userData.subscriptionStatus,
                            to: verification.status,
                        });
                    }
                }
                catch (err) {
                    stats.errors++;
                    v2_1.logger.warn('[dailySubscriptionReconciliation] User verification failed', {
                        userId: userDoc.id,
                        error: err.message,
                    });
                }
            }
        }
        // 2. Reconcile teams with active/trialing subscriptions
        const activeTeamsSnapshot = await firestore
            .collection('teams')
            .where('subscriptionStatus', 'in', ['active', 'trialing'])
            .get();
        v2_1.logger.info(`[dailySubscriptionReconciliation] Found ${activeTeamsSnapshot.size} teams with active/trialing status`);
        for (const teamDoc of activeTeamsSnapshot.docs) {
            stats.teamsChecked++;
            const teamData = teamDoc.data();
            if (teamData.stripeSubscriptionId) {
                try {
                    const verification = await verifyAndSyncStripeStatus(teamData.stripeSubscriptionId, teamData.subscriptionStatus, { collection: 'teams', docId: teamDoc.id });
                    if (verification.status !== teamData.subscriptionStatus) {
                        stats.statusMismatches++;
                        stats.syncedDocuments++;
                        v2_1.logger.info('[dailySubscriptionReconciliation] Team status synced', {
                            teamId: teamDoc.id,
                            from: teamData.subscriptionStatus,
                            to: verification.status,
                        });
                    }
                }
                catch (err) {
                    stats.errors++;
                    v2_1.logger.warn('[dailySubscriptionReconciliation] Team verification failed', {
                        teamId: teamDoc.id,
                        error: err.message,
                    });
                }
            }
        }
        // 3. Reconcile companies with active/trialing subscriptions
        const activeCompaniesSnapshot = await firestore
            .collection('companies')
            .where('subscriptionStatus', 'in', ['active', 'trialing'])
            .get();
        v2_1.logger.info(`[dailySubscriptionReconciliation] Found ${activeCompaniesSnapshot.size} companies with active/trialing status`);
        for (const companyDoc of activeCompaniesSnapshot.docs) {
            stats.companiesChecked++;
            const companyData = companyDoc.data();
            if (companyData.stripeSubscriptionId) {
                try {
                    const verification = await verifyAndSyncStripeStatus(companyData.stripeSubscriptionId, companyData.subscriptionStatus, { collection: 'companies', docId: companyDoc.id });
                    if (verification.status !== companyData.subscriptionStatus) {
                        stats.statusMismatches++;
                        stats.syncedDocuments++;
                        v2_1.logger.info('[dailySubscriptionReconciliation] Company status synced', {
                            companyId: companyDoc.id,
                            from: companyData.subscriptionStatus,
                            to: verification.status,
                        });
                    }
                }
                catch (err) {
                    stats.errors++;
                    v2_1.logger.warn('[dailySubscriptionReconciliation] Company verification failed', {
                        companyId: companyDoc.id,
                        error: err.message,
                    });
                }
            }
        }
        v2_1.logger.info('[dailySubscriptionReconciliation] Reconciliation completed', stats);
    }
    catch (error) {
        v2_1.logger.error('[dailySubscriptionReconciliation] Fatal error:', error);
    }
});
//# sourceMappingURL=subscription.js.map