"use strict";
/**
 * Accept Team Invite Cloud Function
 *
 * Allows users to accept team invitation via invite token.
 * Updates team member status and grants subscription access.
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
exports.leaveTeam = exports.declineTeamInvite = exports.acceptTeamInvite = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const team_1 = require("../types/team");
const firestore = admin.firestore();
/**
 * Accept a team invitation
 * Callable function - requires authentication
 */
exports.acceptTeamInvite = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges a meghívás elfogadásához');
        }
        const { inviteToken } = request.data;
        const userId = request.auth.uid;
        v2_1.logger.info('[acceptTeamInvite] Accepting invite', { userId, inviteToken });
        // 2. Validate input
        if (!inviteToken) {
            throw new https_1.HttpsError('invalid-argument', 'Meghívó token szükséges');
        }
        // 3. Find invitation by token
        const membersSnapshot = await firestore
            .collectionGroup('members')
            .where('inviteToken', '==', inviteToken)
            .where('status', '==', 'invited')
            .limit(1)
            .get();
        if (membersSnapshot.empty) {
            throw new https_1.HttpsError('not-found', 'Érvénytelen vagy lejárt meghívó');
        }
        const memberDoc = membersSnapshot.docs[0];
        const member = { id: memberDoc.id, ...memberDoc.data() };
        const teamId = member.teamId;
        // 4. Check if invite is expired
        if (member.inviteExpiresAt && (0, team_1.isInviteExpired)(member.inviteExpiresAt)) {
            throw new https_1.HttpsError('failed-precondition', 'Ez a meghívó lejárt');
        }
        // 5. Get team and check subscription status
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        if (!(0, team_1.hasActiveSubscription)(team.subscriptionStatus)) {
            throw new https_1.HttpsError('failed-precondition', 'A csapat előfizetése nem aktív. Kérjük, vedd fel a kapcsolatot a csapat tulajdonosával.');
        }
        // 6. Check if user is already in another team
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData?.teamId && userData.teamId !== teamId) {
            throw new https_1.HttpsError('failed-precondition', 'Már tag vagy egy másik csapatban. Előbb ki kell lépned az aktuális csapatodból.');
        }
        // 7. Get user details for team member record
        const userName = userData
            ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
            : undefined;
        // 8. Update team member document
        await memberDoc.ref.update({
            userId,
            name: userName || member.email,
            status: 'active',
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            hasSubscriptionAccess: (0, team_1.hasActiveSubscription)(team.subscriptionStatus),
            inviteToken: admin.firestore.FieldValue.delete(),
            inviteExpiresAt: admin.firestore.FieldValue.delete(),
        });
        // 9. Update user document
        await firestore.collection('users').doc(userId).update({
            teamId,
            subscriptionStatus: team.subscriptionStatus,
            updatedAt: new Date().toISOString(),
        });
        v2_1.logger.info('[acceptTeamInvite] Invite accepted successfully', {
            userId,
            teamId,
            memberId: memberDoc.id,
        });
        return {
            success: true,
            teamId,
            teamName: team.name,
            message: `Sikeresen csatlakoztál a(z) "${team.name}" csapatához!`,
        };
    }
    catch (error) {
        v2_1.logger.error('[acceptTeamInvite] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Meghívás elfogadása sikertelen',
        };
    }
});
/**
 * Decline/Reject a team invitation
 * Callable function - requires authentication (optional - can be unauthenticated)
 */
exports.declineTeamInvite = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { inviteToken } = request.data;
        v2_1.logger.info('[declineTeamInvite] Declining invite', { inviteToken });
        // 1. Validate input
        if (!inviteToken) {
            throw new https_1.HttpsError('invalid-argument', 'Meghívó token szükséges');
        }
        // 2. Find invitation by token
        const membersSnapshot = await firestore
            .collectionGroup('members')
            .where('inviteToken', '==', inviteToken)
            .where('status', '==', 'invited')
            .limit(1)
            .get();
        if (membersSnapshot.empty) {
            throw new https_1.HttpsError('not-found', 'Érvénytelen vagy lejárt meghívó');
        }
        const memberDoc = membersSnapshot.docs[0];
        const member = memberDoc.data();
        const teamId = member.teamId;
        // 3. Delete the invitation
        await memberDoc.ref.delete();
        // 4. Decrement team member count
        await firestore.collection('teams').doc(teamId).update({
            memberCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info('[declineTeamInvite] Invite declined successfully', {
            teamId,
            memberId: memberDoc.id,
        });
        return {
            success: true,
            message: 'Meghívás elutasítva',
        };
    }
    catch (error) {
        v2_1.logger.error('[declineTeamInvite] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Meghívás elutasítása sikertelen',
        };
    }
});
/**
 * Leave a team
 * Callable function - requires authentication
 */
exports.leaveTeam = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        v2_1.logger.info('[leaveTeam] User leaving team', { userId });
        // 2. Get user's team
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData?.teamId) {
            throw new https_1.HttpsError('failed-precondition', 'Nem vagy tag egy csapatban');
        }
        const teamId = userData.teamId;
        // 3. Check if user is team owner
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        const team = teamDoc.data();
        if (team.ownerId === userId) {
            throw new https_1.HttpsError('failed-precondition', 'A csapat tulajdonosa nem hagyhatja el a csapatot. Először törölnie kell a csapatot vagy át kell adnia a tulajdonjogot.');
        }
        // 4. Find member document
        const memberSnapshot = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .where('userId', '==', userId)
            .limit(1)
            .get();
        if (memberSnapshot.empty) {
            throw new https_1.HttpsError('not-found', 'Csapattag nem található');
        }
        const memberDoc = memberSnapshot.docs[0];
        // 5. Update member status to 'removed'
        await memberDoc.ref.update({
            status: 'removed',
            removedAt: admin.firestore.FieldValue.serverTimestamp(),
            hasSubscriptionAccess: false,
        });
        // 6. Update user document
        await firestore.collection('users').doc(userId).update({
            teamId: admin.firestore.FieldValue.delete(),
            subscriptionStatus: 'none',
            updatedAt: new Date().toISOString(),
        });
        // 7. Decrement team member count
        await firestore.collection('teams').doc(teamId).update({
            memberCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info('[leaveTeam] User left team successfully', { userId, teamId });
        return {
            success: true,
            message: 'Sikeresen kiléptél a csapatból',
        };
    }
    catch (error) {
        v2_1.logger.error('[leaveTeam] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Kilépés sikertelen',
        };
    }
});
//# sourceMappingURL=acceptTeamInvite.js.map