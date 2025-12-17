"use strict";
/**
 * Trial Reminder Scheduled Function
 *
 * Runs daily at 10:00 AM Budapest time
 * Sends reminder emails to users whose trial ends in 3 days
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTrialReminders = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const trialEnding_1 = require("../email/templates/trialEnding");
const firestore = admin.firestore();
// Stripe price IDs mapped to amounts (in HUF)
const PRICE_AMOUNTS = {
    // Add your actual Stripe price IDs and amounts here
    'price_starter_monthly': 14990,
    'price_professional_monthly': 29990,
    'price_enterprise_monthly': 49990,
    // Default fallback
    'default': 14990,
};
/**
 * Get price amount for a Stripe price ID
 */
function getPriceAmount(priceId) {
    if (!priceId)
        return PRICE_AMOUNTS['default'];
    return PRICE_AMOUNTS[priceId] || PRICE_AMOUNTS['default'];
}
/**
 * Scheduled function that runs daily at 10:00 AM Budapest time
 * Sends trial ending reminders to users whose trial ends in 3 days
 */
exports.sendTrialReminders = (0, scheduler_1.onSchedule)({
    schedule: '0 10 * * *', // Daily at 10:00 AM
    timeZone: 'Europe/Budapest',
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 300, // 5 minutes
}, async (event) => {
    try {
        v2_1.logger.info('[sendTrialReminders] Starting trial reminder check');
        // Calculate the date range for 3 days from now
        const now = new Date();
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        // Set time to start and end of day for the target date
        const dayStart = new Date(threeDaysFromNow);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(threeDaysFromNow);
        dayEnd.setHours(23, 59, 59, 999);
        v2_1.logger.info('[sendTrialReminders] Checking for trials ending between', {
            start: dayStart.toISOString(),
            end: dayEnd.toISOString(),
        });
        // Query subscriptions with trialing status and trial ending in 3 days
        // Check subscriptions collection
        const subscriptionsSnapshot = await firestore
            .collection('subscriptions')
            .where('status', '==', 'trialing')
            .get();
        let emailsSent = 0;
        let emailsFailed = 0;
        const processedUsers = new Set();
        for (const doc of subscriptionsSnapshot.docs) {
            const subscriptionData = doc.data();
            // Parse trial end date
            let trialEnd = null;
            if (subscriptionData.trialEnd) {
                if (typeof subscriptionData.trialEnd === 'string') {
                    trialEnd = new Date(subscriptionData.trialEnd);
                }
                else if (subscriptionData.trialEnd.toDate) {
                    trialEnd = subscriptionData.trialEnd.toDate();
                }
            }
            // Skip if no trial end or not in our target range
            if (!trialEnd || trialEnd < dayStart || trialEnd > dayEnd) {
                continue;
            }
            const userId = subscriptionData.userId;
            // Skip if we already processed this user
            if (!userId || processedUsers.has(userId)) {
                continue;
            }
            processedUsers.add(userId);
            try {
                // Get user data
                const userDoc = await firestore.collection('users').doc(userId).get();
                const userData = userDoc.data();
                if (!userData?.email) {
                    v2_1.logger.warn('[sendTrialReminders] User has no email', { userId });
                    continue;
                }
                // Format trial end date
                const trialEndFormatted = trialEnd.toLocaleDateString('hu-HU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                // Calculate days remaining
                const msPerDay = 24 * 60 * 60 * 1000;
                const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / msPerDay);
                // Send email
                const result = await (0, trialEnding_1.sendTrialEndingEmail)({
                    firstName: userData.firstName || 'Felhasználó',
                    email: userData.email,
                    planName: subscriptionData.planName || 'DMA Előfizetés',
                    trialEndDate: trialEndFormatted,
                    daysRemaining,
                    amount: getPriceAmount(subscriptionData.stripePriceId),
                    currency: 'huf',
                });
                if (result.success) {
                    emailsSent++;
                    v2_1.logger.info('[sendTrialReminders] Email sent', { userId, email: userData.email });
                }
                else {
                    emailsFailed++;
                    v2_1.logger.error('[sendTrialReminders] Failed to send email', {
                        userId,
                        error: result.error,
                    });
                }
            }
            catch (userError) {
                emailsFailed++;
                v2_1.logger.error('[sendTrialReminders] Error processing user', {
                    userId,
                    error: userError.message,
                });
            }
        }
        // Also check companies with trialing status
        const companiesSnapshot = await firestore
            .collection('companies')
            .where('subscriptionStatus', '==', 'trialing')
            .get();
        for (const doc of companiesSnapshot.docs) {
            const companyData = doc.data();
            // Parse trial end date
            let trialEnd = null;
            if (companyData.trialEndDate) {
                if (companyData.trialEndDate.toDate) {
                    trialEnd = companyData.trialEndDate.toDate();
                }
                else if (typeof companyData.trialEndDate === 'string') {
                    trialEnd = new Date(companyData.trialEndDate);
                }
            }
            // Skip if no trial end or not in our target range
            if (!trialEnd || trialEnd < dayStart || trialEnd > dayEnd) {
                continue;
            }
            try {
                // Get company admin (owner) to send email
                const adminsSnapshot = await firestore
                    .collection('companies')
                    .doc(doc.id)
                    .collection('admins')
                    .where('isOwner', '==', true)
                    .limit(1)
                    .get();
                if (adminsSnapshot.empty) {
                    continue;
                }
                const adminData = adminsSnapshot.docs[0].data();
                const userId = adminsSnapshot.docs[0].id;
                // Skip if we already processed this user
                if (processedUsers.has(userId)) {
                    continue;
                }
                processedUsers.add(userId);
                const userDoc = await firestore.collection('users').doc(userId).get();
                const userData = userDoc.data();
                if (!userData?.email) {
                    continue;
                }
                // Format trial end date
                const trialEndFormatted = trialEnd.toLocaleDateString('hu-HU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                // Calculate days remaining
                const msPerDay = 24 * 60 * 60 * 1000;
                const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / msPerDay);
                // Send email
                const result = await (0, trialEnding_1.sendTrialEndingEmail)({
                    firstName: userData.firstName || 'Felhasználó',
                    email: userData.email,
                    planName: `${companyData.name} - Céges előfizetés`,
                    trialEndDate: trialEndFormatted,
                    daysRemaining,
                    amount: getPriceAmount(companyData.stripePriceId),
                    currency: 'huf',
                });
                if (result.success) {
                    emailsSent++;
                    v2_1.logger.info('[sendTrialReminders] Company email sent', {
                        companyId: doc.id,
                        email: userData.email,
                    });
                }
                else {
                    emailsFailed++;
                }
            }
            catch (companyError) {
                emailsFailed++;
                v2_1.logger.error('[sendTrialReminders] Error processing company', {
                    companyId: doc.id,
                    error: companyError.message,
                });
            }
        }
        v2_1.logger.info('[sendTrialReminders] Completed', {
            emailsSent,
            emailsFailed,
            totalProcessed: processedUsers.size,
        });
    }
    catch (error) {
        v2_1.logger.error('[sendTrialReminders] Fatal error:', error);
        throw error;
    }
});
//# sourceMappingURL=trialReminder.js.map