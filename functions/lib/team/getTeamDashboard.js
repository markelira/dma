"use strict";
/**
 * Get Team Dashboard Cloud Function
 *
 * Fetches complete team data including members, stats, and subscription info
 * for display in the team management dashboard.
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
exports.getTeamMembers = exports.checkSubscriptionAccess = exports.getTeamDashboard = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const firestore = admin.firestore();
/**
 * Get team dashboard data
 * Callable function - requires authentication
 */
exports.getTeamDashboard = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        v2_1.logger.info('[getTeamDashboard] Fetching dashboard', { userId });
        // 2. Get user's team
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData?.teamId) {
            throw new https_1.HttpsError('failed-precondition', 'Nem vagy tag egy csapatban');
        }
        const teamId = userData.teamId;
        // 3. Get team data
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        // 4. Check if user is team owner or member
        const isOwner = team.ownerId === userId;
        // 5. Get team members
        const membersSnapshot = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .where('status', 'in', ['invited', 'active'])
            .orderBy('invitedAt', 'desc')
            .get();
        const members = membersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        // 6. Get owner details
        const ownerDoc = await firestore.collection('users').doc(team.ownerId).get();
        const ownerData = ownerDoc.data();
        const owner = {
            id: team.ownerId,
            name: ownerData
                ? `${ownerData.firstName || ''} ${ownerData.lastName || ''}`.trim()
                : team.ownerName,
            email: team.ownerEmail,
        };
        // 7. Calculate stats
        const activeMembers = members.filter((m) => m.status === 'active').length;
        const invitedMembers = members.filter((m) => m.status === 'invited').length;
        const stats = {
            totalMembers: members.length,
            activeMembers,
            invitedMembers,
        };
        // 8. Format subscription data
        const subscription = {
            status: team.subscriptionStatus,
            plan: team.subscriptionPlan,
            startDate: team.subscriptionStartDate.toDate().toISOString(),
            endDate: team.subscriptionEndDate.toDate().toISOString(),
            isActive: team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing',
        };
        // 9. Build dashboard data
        const dashboardData = {
            team,
            members,
            owner,
            stats,
            subscription,
        };
        v2_1.logger.info('[getTeamDashboard] Dashboard fetched successfully', {
            teamId,
            memberCount: members.length,
        });
        return {
            success: true,
            data: dashboardData,
        };
    }
    catch (error) {
        v2_1.logger.error('[getTeamDashboard] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Csapat dashboard betöltése sikertelen',
        };
    }
});
/**
 * Check if user has subscription access
 * Callable function - requires authentication
 */
exports.checkSubscriptionAccess = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            return {
                success: true,
                hasAccess: false,
                reason: 'not_authenticated',
            };
        }
        const userId = request.auth.uid;
        v2_1.logger.info('[checkSubscriptionAccess] Checking access', { userId });
        // 2. Get user data
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            return {
                success: true,
                hasAccess: false,
                reason: 'user_not_found',
            };
        }
        // 3. Check if user is team owner with active subscription
        if (userData.isTeamOwner && userData.subscriptionStatus === 'active') {
            v2_1.logger.info('[checkSubscriptionAccess] Team owner with active subscription', { userId });
            return {
                success: true,
                hasAccess: true,
                reason: 'team_owner',
                subscriptionStatus: userData.subscriptionStatus,
            };
        }
        // 4. Check if user is team member with inherited access
        if (userData.teamId) {
            const teamDoc = await firestore.collection('teams').doc(userData.teamId).get();
            if (teamDoc.exists) {
                const team = teamDoc.data();
                const hasAccess = team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing';
                v2_1.logger.info('[checkSubscriptionAccess] Team member', {
                    userId,
                    teamId: userData.teamId,
                    hasAccess,
                    teamStatus: team.subscriptionStatus,
                });
                return {
                    success: true,
                    hasAccess,
                    reason: hasAccess ? 'team_member' : 'subscription_inactive',
                    teamName: team.name,
                    subscriptionStatus: team.subscriptionStatus,
                };
            }
        }
        // 5. No subscription access
        v2_1.logger.info('[checkSubscriptionAccess] No subscription access', { userId });
        return {
            success: true,
            hasAccess: false,
            reason: 'no_subscription',
        };
    }
    catch (error) {
        v2_1.logger.error('[checkSubscriptionAccess] Error:', error);
        return {
            success: false,
            hasAccess: false,
            reason: 'error',
        };
    }
});
/**
 * Get team members (simplified version for non-owners)
 * Returns basic member info without sensitive data
 */
exports.getTeamMembers = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        // 2. Get user's team
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData?.teamId) {
            throw new https_1.HttpsError('failed-precondition', 'Nem vagy tag egy csapatban');
        }
        const teamId = userData.teamId;
        // 3. Get active team members only
        const membersSnapshot = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .where('status', '==', 'active')
            .get();
        const members = membersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                joinedAt: data.joinedAt?.toDate().toISOString(),
                isActive: data.status === 'active',
            };
        });
        return {
            success: true,
            members,
        };
    }
    catch (error) {
        v2_1.logger.error('[getTeamMembers] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Csapattagok betöltése sikertelen',
        };
    }
});
//# sourceMappingURL=getTeamDashboard.js.map