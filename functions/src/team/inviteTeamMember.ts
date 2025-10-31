/**
 * Invite Team Member Cloud Function
 *
 * Allows team owner to invite unlimited members via email.
 * Creates invitation record and sends email with invite link.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as nodemailer from 'nodemailer';
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

    // 4. Check if email already invited or is a member
    const existingMemberSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingMemberSnapshot.empty) {
      const existingMember = existingMemberSnapshot.docs[0].data() as TeamMember;

      if (existingMember.status === 'active') {
        throw new HttpsError('already-exists', 'Ez az email cím már csapattag');
      } else if (existingMember.status === 'invited') {
        throw new HttpsError('already-exists', 'Már kiküldtünk meghívót erre az email címre');
      }
    }

    // 5. Get inviter details for email
    const inviterDoc = await firestore.collection('users').doc(userId).get();
    const inviterData = inviterDoc.data();
    const inviterName = inviterData
      ? `${inviterData.firstName || ''} ${inviterData.lastName || ''}`.trim()
      : 'A csapat tulajdonosa';

    // 6. Create invitation
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const memberRef = firestore
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

    // 7. Update team member count
    await firestore.collection('teams').doc(teamId).update({
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 8. Send invitation email
    const inviteLink = `https://dma.hu/invite/${inviteToken}`;

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
    });

    return {
      success: true,
      memberId: memberRef.id,
      message: `Meghívó elküldve: ${email}`,
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
  <title>Csapat meghívó - DMA.hu</title>
</head>
<body style="font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2C3E54; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                Csapat meghívó
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Szia!
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>${data.inviterName}</strong> meghívott, hogy csatlakozz a(z) <strong>"${data.teamName}"</strong> csapatához a DMA.hu platformon.
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Csapattagként <strong>korlátlan hozzáférést</strong> kapsz az összes videókurzushoz és tartalomhoz. Teljesen ingyen, nincs plusz költség!
              </p>

              <!-- CTA Button -->
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

              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">
                Ha a gomb nem működik, másold be ezt a linket a böngésződbe:<br>
                <a href="${data.inviteLink}" style="color: #2C3E54; word-break: break-all;">${data.inviteLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                Üdvözlettel,<br>
                <strong>DMA.hu csapata</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2024 DMA.hu. Minden jog fenntartva.
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

${data.inviterName} meghívott, hogy csatlakozz a(z) "${data.teamName}" csapatához a DMA.hu platformon.

Csapattagként korlátlan hozzáférést kapsz az összes videókurzushoz és tartalomhoz.

Kattints az alábbi linkre a meghívás elfogadásához:
${data.inviteLink}

Ez a meghívó ${data.expiryDays} napig érvényes.

Üdvözlettel,
DMA.hu csapata
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@dma.hu',
      to: data.to,
      subject: `Meghívás: Csatlakozz a(z) "${data.teamName}" csapatához`,
      text: textContent,
      html: htmlContent,
    });

    logger.info('[sendInvitationEmail] Email sent successfully', { to: data.to });

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
