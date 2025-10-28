"use strict";
/**
 * Team Subscription Types for Cloud Functions
 *
 * Backend types for team management, subscription inheritance,
 * and Stripe integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSubscriptionEndDate = calculateSubscriptionEndDate;
exports.calculateTrialEndDate = calculateTrialEndDate;
exports.hasActiveSubscription = hasActiveSubscription;
exports.isTeamOwner = isTeamOwner;
exports.generateInviteToken = generateInviteToken;
exports.isInviteExpired = isInviteExpired;
exports.stripePriceIdToPlan = stripePriceIdToPlan;
exports.planToStripePriceId = planToStripePriceId;
// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Calculate subscription end date based on plan
 */
function calculateSubscriptionEndDate(startDate, plan) {
    const endDate = new Date(startDate);
    switch (plan) {
        case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case '6-month':
            endDate.setMonth(endDate.getMonth() + 6);
            break;
        case '12-month':
            endDate.setMonth(endDate.getMonth() + 12);
            break;
    }
    return endDate;
}
/**
 * Calculate trial end date (7 days from start)
 */
function calculateTrialEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    return endDate;
}
/**
 * Check if subscription is active
 */
function hasActiveSubscription(status) {
    return status === 'active' || status === 'trialing';
}
/**
 * Check if user is team owner
 */
function isTeamOwner(team, userId) {
    return team.ownerId === userId;
}
/**
 * Generate secure invite token
 */
function generateInviteToken() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
}
/**
 * Check if invite token is expired
 */
function isInviteExpired(expiresAt) {
    return expiresAt.toDate() < new Date();
}
/**
 * Map Stripe price ID to subscription plan
 */
function stripePriceIdToPlan(priceId) {
    const priceMap = {
        'price_1QWPDjRvOWrujGVHxdaSOcJZ': 'monthly',
        'price_1QWPFQRvOWrujGVHHd8gxLzx': '6-month',
        'price_1QWPFqRvOWrujGVHcDUG2Y9W': '12-month',
    };
    return priceMap[priceId] || 'monthly';
}
/**
 * Get Stripe price ID from plan
 */
function planToStripePriceId(plan) {
    const planMap = {
        'monthly': 'price_1QWPDjRvOWrujGVHxdaSOcJZ',
        '6-month': 'price_1QWPFQRvOWrujGVHHd8gxLzx',
        '12-month': 'price_1QWPFqRvOWrujGVHcDUG2Y9W',
    };
    return planMap[plan];
}
//# sourceMappingURL=team.js.map