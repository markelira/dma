/**
 * Invite Team Member Cloud Function
 *
 * Allows team owner to invite unlimited members via email.
 * Creates invitation record and sends email with invite link.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  Team,
  TeamMember,
  InviteTeamMemberInput,
  InviteTeamMemberResponse,
  generateInviteToken,
  hasActiveSubscription,
  isTeamOwner,
} from '../types/team';

const firestore = admin.firestore();

/**
 * Invite a team member
 * Callable function - requires authentication
 */
export const inviteTeamMember = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<InviteTeamMemberResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId, email } = request.data as { teamId: string; email: string };
    const userId = request.auth.uid;

    logger.info('[inviteTeamMember] Inviting member', { teamId, email, inviterId: userId });

    // 2. Validate input
    if (!teamId || !email) {
      throw new HttpsError('invalid-argument', 'Team ID és email cím szükséges');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError('invalid-argument', 'Érvénytelen email cím');
    }

    // 3. Get team and verify permissions
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    // Check if user is team owner
    if (!isTeamOwner(team, userId)) {
      throw new HttpsError('permission-denied', 'Csak a csapat tulajdonosa hívhat meg tagokat');
    }

    // Check if subscription is active
    if (!hasActiveSubscription(team.subscriptionStatus)) {
      throw new HttpsError(
        'failed-precondition',
        'Az előfizetés nem aktív. Kérjük, frissítse az előfizetését.'
      );
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
      throw new HttpsError(
        'resource-exhausted',
        `Elérted a maximális taglétszámot (${MAX_TEAM_MEMBERS} fő). Távolíts el meglévő tagokat új meghívásokhoz.`
      );
    }

    // 5. Check if email already invited or is a member
    const existingMemberSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    let existingMemberRef: admin.firestore.DocumentReference | null = null;

    if (!existingMemberSnapshot.empty) {
      const existingMember = existingMemberSnapshot.docs[0].data() as TeamMember;

      if (existingMember.status === 'active') {
        throw new HttpsError('already-exists', 'Ez az email cím már csapattag');
      } else if (existingMember.status === 'invited') {
        throw new HttpsError('already-exists', 'Már kiküldtünk meghívót erre az email címre');
      } else if (existingMember.status === 'removed') {
        // Re-invite removed member - we'll update the existing document
        existingMemberRef = existingMemberSnapshot.docs[0].ref;
        logger.info('[inviteTeamMember] Re-inviting previously removed member', { email });
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
        logger.info('[inviteTeamMember] User is in another team, but invite will still be sent', {
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
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    let memberRef: admin.firestore.DocumentReference;
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
    } else {
      // New invite: create new member document
      memberRef = firestore
        .collection('teams')
        .doc(teamId)
        .collection('members')
        .doc();

      const memberData: TeamMember = {
        id: memberRef.id,
        teamId,
        email: email.toLowerCase(),
        status: 'invited',
        inviteToken,
        inviteExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        invitedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
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
    } else {
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

    logger.info('[inviteTeamMember] Member invited successfully', {
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

  } catch (error: any) {
    logger.error('[inviteTeamMember] Error:', error);

    if (error instanceof HttpsError) {
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
async function sendInvitationEmail(data: {
  to: string;
  teamName: string;
  inviterName: string;
  inviteLink: string;
  expiryDays: number;
}): Promise<void> {
  const { sendEmail } = require('../email/emailService');
  const {
    wrapInBaseTemplate,
    createHeading,
    createParagraph,
    createButtonRow,
    createAlertBox,
    generatePlainText,
  } = require('../email/templates/base');

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
      logger.info('[sendInvitationEmail] Email sent successfully', { to: data.to });
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error: any) {
    logger.error('[sendInvitationEmail] Error sending email:', error);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}
