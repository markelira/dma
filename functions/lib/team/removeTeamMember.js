"use strict";
/**
 * Remove Team Member Cloud Function
 *
 * Allows team owner to remove members from the team.
 * Revokes subscription access immediately.
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
exports.resendTeamInvite = exports.removeTeamMember = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const team_1 = require("../types/team");
const firestore = admin.firestore();
/**
 * Remove a team member
 * Callable function - requires authentication
 */
exports.removeTeamMember = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { teamId, memberId } = request.data;
        const userId = request.auth.uid;
        v2_1.logger.info('[removeTeamMember] Removing member', { teamId, memberId, removedBy: userId });
        // 2. Validate input
        if (!teamId || !memberId) {
            throw new https_1.HttpsError('invalid-argument', 'Team ID és member ID szükséges');
        }
        // 3. Get team and verify permissions
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        // Check if user is team owner
        if (!(0, team_1.isTeamOwner)(team, userId)) {
            throw new https_1.HttpsError('permission-denied', 'Csak a csapat tulajdonosa távolíthat el tagokat');
        }
        // 4. Get team member
        const memberDoc = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .doc(memberId)
            .get();
        if (!memberDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapattag nem található');
        }
        const member = { id: memberDoc.id, ...memberDoc.data() };
        // 5. Cannot remove team owner
        if (member.userId === team.ownerId) {
            throw new https_1.HttpsError('failed-precondition', 'A csapat tulajdonosát nem lehet eltávolítani');
        }
        // 6. Update member status
        await memberDoc.ref.update({
            status: 'removed',
            removedAt: admin.firestore.FieldValue.serverTimestamp(),
            hasSubscriptionAccess: false,
        });
        // 7. Update user document if member has accepted invite
        if (member.userId) {
            await firestore.collection('users').doc(member.userId).update({
                teamId: admin.firestore.FieldValue.delete(),
                subscriptionStatus: 'none',
                updatedAt: new Date().toISOString(),
            });
        }
        // 8. Decrement team member count
        await firestore.collection('teams').doc(teamId).update({
            memberCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info('[removeTeamMember] Member removed successfully', {
            teamId,
            memberId,
            memberEmail: member.email,
        });
        return {
            success: true,
            message: `Csapattag eltávolítva: ${member.email}`,
        };
    }
    catch (error) {
        v2_1.logger.error('[removeTeamMember] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Csapattag eltávolítása sikertelen',
        };
    }
});
/**
 * Resend team invitation
 * Callable function - requires authentication
 */
exports.resendTeamInvite = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { teamId, memberId } = request.data;
        const userId = request.auth.uid;
        v2_1.logger.info('[resendTeamInvite] Resending invite', { teamId, memberId });
        // 2. Validate input
        if (!teamId || !memberId) {
            throw new https_1.HttpsError('invalid-argument', 'Team ID és member ID szükséges');
        }
        // 3. Get team and verify permissions
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        if (!(0, team_1.isTeamOwner)(team, userId)) {
            throw new https_1.HttpsError('permission-denied', 'Csak a csapat tulajdonosa küldhet meghívót');
        }
        // 4. Get team member
        const memberDoc = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .doc(memberId)
            .get();
        if (!memberDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapattag nem található');
        }
        const member = { id: memberDoc.id, ...memberDoc.data() };
        // 5. Check if member is invited (not active)
        if (member.status !== 'invited') {
            throw new https_1.HttpsError('failed-precondition', 'Ez a tag már elfogadta a meghívást');
        }
        // 6. Extend invitation expiry
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 7);
        await memberDoc.ref.update({
            inviteExpiresAt: admin.firestore.Timestamp.fromDate(newExpiryDate),
        });
        // 7. TODO: Resend invitation email
        // Implementation depends on email service setup
        v2_1.logger.info('[resendTeamInvite] Invite resent successfully', {
            teamId,
            memberId,
            email: member.email,
        });
        return {
            success: true,
            message: `Meghívó újraküldve: ${member.email}`,
        };
    }
    catch (error) {
        v2_1.logger.error('[resendTeamInvite] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Meghívó újraküldése sikertelen',
        };
    }
});
//# sourceMappingURL=removeTeamMember.js.map