/**
 * Remove Team Member Cloud Function
 *
 * Allows team owner to remove members from the team.
 * Revokes subscription access immediately.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as nodemailer from 'nodemailer';
import {
  Team,
  TeamMember,
  RemoveTeamMemberInput,
  RemoveTeamMemberResponse,
  isTeamOwner,
} from '../types/team';

const firestore = admin.firestore();

/**
 * Remove a team member
 * Callable function - requires authentication
 */
export const removeTeamMember = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<RemoveTeamMemberResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId, memberId } = request.data as { teamId: string; memberId: string };
    const userId = request.auth.uid;

    logger.info('[removeTeamMember] Removing member', { teamId, memberId, removedBy: userId });

    // 2. Validate input
    if (!teamId || !memberId) {
      throw new HttpsError('invalid-argument', 'Team ID és member ID szükséges');
    }

    // 3. Get team and verify permissions
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    // Check if user is team owner
    if (!isTeamOwner(team, userId)) {
      throw new HttpsError('permission-denied', 'Csak a csapat tulajdonosa távolíthat el tagokat');
    }

    // 4. Get team member
    const memberDoc = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      throw new HttpsError('not-found', 'Csapattag nem található');
    }

    const member = { id: memberDoc.id, ...memberDoc.data() } as TeamMember;

    // 5. Cannot remove team owner
    if (member.userId === team.ownerId) {
      throw new HttpsError('failed-precondition', 'A csapat tulajdonosát nem lehet eltávolítani');
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

    logger.info('[removeTeamMember] Member removed successfully', {
      teamId,
      memberId,
      memberEmail: member.email,
    });

    return {
      success: true,
      message: `Csapattag eltávolítva: ${member.email}`,
    };

  } catch (error: any) {
    logger.error('[removeTeamMember] Error:', error);

    if (error instanceof HttpsError) {
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
export const resendTeamInvite = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId, memberId } = request.data as { teamId: string; memberId: string };
    const userId = request.auth.uid;

    logger.info('[resendTeamInvite] Resending invite', { teamId, memberId });

    // 2. Validate input
    if (!teamId || !memberId) {
      throw new HttpsError('invalid-argument', 'Team ID és member ID szükséges');
    }

    // 3. Get team and verify permissions
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    if (!isTeamOwner(team, userId)) {
      throw new HttpsError('permission-denied', 'Csak a csapat tulajdonosa küldhet meghívót');
    }

    // 4. Get team member
    const memberDoc = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      throw new HttpsError('not-found', 'Csapattag nem található');
    }

    const member = { id: memberDoc.id, ...memberDoc.data() } as TeamMember;

    // 5. Check if member is invited (not active)
    if (member.status !== 'invited') {
      throw new HttpsError('failed-precondition', 'Ez a tag már elfogadta a meghívást');
    }

    // 6. Extend invitation expiry
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);

    await memberDoc.ref.update({
      inviteExpiresAt: admin.firestore.Timestamp.fromDate(newExpiryDate),
    });

    // 7. Get inviter details for email
    const inviterDoc = await firestore.collection('users').doc(userId).get();
    const inviterData = inviterDoc.data();
    const inviterName = inviterData
      ? `${inviterData.firstName || ''} ${inviterData.lastName || ''}`.trim()
      : 'A csapat tulajdonosa';

    // 8. Resend invitation email
    const appUrl = process.env.APP_URL || 'https://masterclass.dma.hu';
    const inviteLink = `${appUrl}/invite/${member.inviteToken}`;

    await sendInvitationEmail({
      to: member.email,
      teamName: team.name,
      inviterName,
      inviteLink,
      expiryDays: 7,
    });

    logger.info('[resendTeamInvite] Invite resent successfully', {
      teamId,
      memberId,
      email: member.email,
    });

    return {
      success: true,
      message: `Meghívó újraküldve: ${member.email}`,
    };

  } catch (error: any) {
    logger.error('[resendTeamInvite] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Meghívó újraküldése sikertelen',
    };
  }
});

/**
 * Send team invitation email
 */
async function sendInvitationEmail(data: {
  to: string;
  teamName: string;
  inviterName: string;
  inviteLink: string;
  expiryDays: number;
}): Promise<void> {
  try {
    const transporter = await createEmailTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Csapat meghívó - DMA</title>
</head>
<body style="font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #2C3E54; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                Meghívó emlékeztető
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Szia!
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>${data.inviterName}</strong> újra meghívott a(z) <strong>"${data.teamName}"</strong> csapatához.
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Csapattagként <strong>korlátlan hozzáférést</strong> kapsz az összes kurzushoz.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.inviteLink}" style="background-color: #2C3E54; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                      Meghívás elfogadása
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Ez a meghívó <strong>${data.expiryDays} napig</strong> érvényes.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                Üdvözlettel,<br>
                <strong>DMA csapata</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Szia!

${data.inviterName} újra meghívott a(z) "${data.teamName}" csapatához.

Csapattagként korlátlan hozzáférést kapsz az összes kurzushoz.

Kattints az alábbi linkre a meghívás elfogadásához:
${data.inviteLink}

Ez a meghívó ${data.expiryDays} napig érvényes.

Üdvözlettel,
DMA csapata
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@dma.hu',
      to: data.to,
      subject: `Emlékeztető: Csatlakozz a(z) "${data.teamName}" csapatához`,
      text: textContent,
      html: htmlContent,
    });

    logger.info('[sendInvitationEmail] Resend email sent successfully', { to: data.to });

  } catch (error: any) {
    logger.error('[sendInvitationEmail] Error sending email:', error);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}

/**
 * Create email transporter
 */
async function createEmailTransporter() {
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoKey = process.env.BREVO_SMTP_KEY;

  if (brevoUser && brevoKey) {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
    });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailAppPassword) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  throw new Error('No email service configured');
}
