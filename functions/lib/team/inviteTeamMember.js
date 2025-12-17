"use strict";
/**
 * Invite Team Member Cloud Function
 *
 * Allows team owner to invite unlimited members via email.
 * Creates invitation record and sends email with invite link.
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
exports.inviteTeamMember = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const team_1 = require("../types/team");
const firestore = admin.firestore();
/**
 * Invite a team member
 * Callable function - requires authentication
 */
exports.inviteTeamMember = (0, https_1.onCall)({
    cors: true,
    region: 'europe-west1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { teamId, email } = request.data;
        const userId = request.auth.uid;
        v2_1.logger.info('[inviteTeamMember] Inviting member', { teamId, email, inviterId: userId });
        // 2. Validate input
        if (!teamId || !email) {
            throw new https_1.HttpsError('invalid-argument', 'Team ID és email cím szükséges');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new https_1.HttpsError('invalid-argument', 'Érvénytelen email cím');
        }
        // 3. Get team and verify permissions
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        // Check if user is team owner
        if (!(0, team_1.isTeamOwner)(team, userId)) {
            throw new https_1.HttpsError('permission-denied', 'Csak a csapat tulajdonosa hívhat meg tagokat');
        }
        // Check if subscription is active
        if (!(0, team_1.hasActiveSubscription)(team.subscriptionStatus)) {
            throw new https_1.HttpsError('failed-precondition', 'Az előfizetés nem aktív. Kérjük, frissítse az előfizetését.');
        }
        // 4. Check member limit (max 10 members)
        const MAX_TEAM_MEMBERS = 10;
        const activeMembersSnapshot = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .where('status', 'in', ['invited', 'active'])
            .get();
        if (activeMembersSnapshot.size >= MAX_TEAM_MEMBERS) {
            throw new https_1.HttpsError('resource-exhausted', `Elérted a maximális taglétszámot (${MAX_TEAM_MEMBERS} fő). Távolíts el meglévő tagokat új meghívásokhoz.`);
        }
        // 5. Check if email already invited or is a member
        const existingMemberSnapshot = await firestore
            .collection('teams')
            .doc(teamId)
            .collection('members')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        let existingMemberRef = null;
        if (!existingMemberSnapshot.empty) {
            const existingMember = existingMemberSnapshot.docs[0].data();
            if (existingMember.status === 'active') {
                throw new https_1.HttpsError('already-exists', 'Ez az email cím már csapattag');
            }
            else if (existingMember.status === 'invited') {
                throw new https_1.HttpsError('already-exists', 'Már kiküldtünk meghívót erre az email címre');
            }
            else if (existingMember.status === 'removed') {
                // Re-invite removed member - we'll update the existing document
                existingMemberRef = existingMemberSnapshot.docs[0].ref;
                v2_1.logger.info('[inviteTeamMember] Re-inviting previously removed member', { email });
            }
        }
        // 5b. Check if this email belongs to an existing user (for logging purposes)
        const existingUserSnapshot = await firestore
            .collection('users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        if (!existingUserSnapshot.empty) {
            const existingUserData = existingUserSnapshot.docs[0].data();
            // Check if user is already in another team
            if (existingUserData.teamId && existingUserData.teamId !== teamId) {
                v2_1.logger.info('[inviteTeamMember] User is in another team, but invite will still be sent', {
                    email,
                    existingTeamId: existingUserData.teamId,
                });
                // Note: We still send the invite - user will see error when trying to accept
            }
        }
        // 6. Get inviter details for email
        const inviterDoc = await firestore.collection('users').doc(userId).get();
        const inviterData = inviterDoc.data();
        const inviterName = inviterData
            ? `${inviterData.firstName || ''} ${inviterData.lastName || ''}`.trim()
            : 'A csapat tulajdonosa';
        // 7. Create or update invitation
        const inviteToken = (0, team_1.generateInviteToken)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        let memberRef;
        let isReInvite = false;
        if (existingMemberRef) {
            // Re-invite: update existing member document
            memberRef = existingMemberRef;
            isReInvite = true;
            await memberRef.update({
                status: 'invited',
                inviteToken,
                inviteExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                invitedAt: admin.firestore.FieldValue.serverTimestamp(),
                invitedBy: userId,
                hasSubscriptionAccess: false,
                // Clear any previous removal data
                removedAt: admin.firestore.FieldValue.delete(),
                userId: admin.firestore.FieldValue.delete(),
                joinedAt: admin.firestore.FieldValue.delete(),
            });
        }
        else {
            // New invite: create new member document
            memberRef = firestore
                .collection('teams')
                .doc(teamId)
                .collection('members')
                .doc();
            const memberData = {
                id: memberRef.id,
                teamId,
                email: email.toLowerCase(),
                status: 'invited',
                inviteToken,
                inviteExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                invitedAt: admin.firestore.FieldValue.serverTimestamp(),
                invitedBy: userId,
                hasSubscriptionAccess: false,
            };
            await memberRef.set(memberData);
        }
        // 8. Update team member count (only for new invites, not re-invites)
        if (!isReInvite) {
            await firestore.collection('teams').doc(teamId).update({
                memberCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        else {
            await firestore.collection('teams').doc(teamId).update({
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // 9. Send invitation email
        const appUrl = process.env.APP_URL || 'https://academion.hu';
        const inviteLink = `${appUrl}/invite/${inviteToken}`;
        await sendInvitationEmail({
            to: email,
            teamName: team.name,
            inviterName,
            inviteLink,
            expiryDays: 7,
        });
        v2_1.logger.info('[inviteTeamMember] Member invited successfully', {
            teamId,
            memberId: memberRef.id,
            email,
            isReInvite,
        });
        return {
            success: true,
            memberId: memberRef.id,
            message: isReInvite
                ? `Újra meghívó elküldve: ${email}`
                : `Meghívó elküldve: ${email}`,
        };
    }
    catch (error) {
        v2_1.logger.error('[inviteTeamMember] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Meghívó küldése sikertelen',
        };
    }
});
/**
 * Send team invitation email using unified email service
 */
async function sendInvitationEmail(data) {
    const { sendEmail } = require('../email/emailService');
    const { wrapInBaseTemplate, createHeading, createParagraph, createButtonRow, createAlertBox, generatePlainText, } = require('../email/templates/base');
    const subject = `Meghívás: Csatlakozz a(z) "${data.teamName}" csapatához`;
    // Build email content using base template
    const content = `
    ${createHeading('Csapat meghívó', 2)}
    ${createParagraph('Szia!')}
    ${createParagraph(`<strong>${data.inviterName}</strong> meghívott, hogy csatlakozz a(z) <strong>"${data.teamName}"</strong> csapatához a DMA Masterclass platformon.`)}
    ${createParagraph('Csapattagként <strong>korlátlan hozzáférést</strong> kapsz az összes prémium tartalomhoz - teljesen ingyen!')}

    ${createButtonRow({ text: 'Meghívás elfogadása', url: data.inviteLink, variant: 'primary' })}

    ${createAlertBox(`Ez a meghívó <strong>${data.expiryDays} napig</strong> érvényes.`, 'info')}

    ${createParagraph('Ha nem te kérted ezt a meghívót, egyszerűen hagyd figyelmen kívül ezt az emailt.', { muted: true })}
  `;
    const htmlContent = wrapInBaseTemplate(content, {
        showUnsubscribe: false, // Transactional email
        preheader: `${data.inviterName} meghívott a(z) ${data.teamName} csapatába`,
    });
    const textContent = generatePlainText({
        greeting: 'Szia!',
        paragraphs: [
            `${data.inviterName} meghívott, hogy csatlakozz a(z) "${data.teamName}" csapatához a DMA Masterclass platformon.`,
            'Csapattagként korlátlan hozzáférést kapsz az összes prémium tartalomhoz - teljesen ingyen!',
            `Ez a meghívó ${data.expiryDays} napig érvényes.`,
            'Ha nem te kérted ezt a meghívót, egyszerűen hagyd figyelmen kívül ezt az emailt.',
        ],
        ctaText: 'Meghívás elfogadása',
        ctaUrl: data.inviteLink,
        signOff: 'Üdvözlettel, A DMA csapat',
    });
    try {
        const result = await sendEmail({
            to: data.to,
            subject,
            html: htmlContent,
            text: textContent,
        });
        if (result.success) {
            v2_1.logger.info('[sendInvitationEmail] Email sent successfully', { to: data.to });
        }
        else {
            throw new Error(result.error || 'Failed to send email');
        }
    }
    catch (error) {
        v2_1.logger.error('[sendInvitationEmail] Error sending email:', error);
        throw new Error(`Failed to send invitation email: ${error.message}`);
    }
}
//# sourceMappingURL=inviteTeamMember.js.map