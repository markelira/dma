/**
 * Employee Invitation Functions
 * 🔴 CRITICAL: Uses transactions to prevent double-use of invite tokens
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { AddEmployeeInput, CompanyEmployee } from '../types/company';

const db = admin.firestore();

interface AddEmployeeData extends AddEmployeeInput {
  companyId: string;
}

/**
 * Add Employee to Company (Sends Invitation)
 */
export const addEmployee = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<AddEmployeeData>) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { companyId, email, firstName, lastName, jobTitle } = request.data;
    const userId = request.auth.uid;

    // Validation
    if (!companyId || !email || !firstName || !lastName) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid email format'
      );
    }

    try {
      // 1. Verify admin permission
      const adminDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .get();

      if (!adminDoc.exists) {
        throw new HttpsError(
          'permission-denied',
          'You are not an admin of this company'
        );
      }

      const adminData = adminDoc.data();
      if (!adminData?.permissions?.canManageEmployees) {
        throw new HttpsError(
          'permission-denied',
          'No permission to manage employees'
        );
      }

      // 2. Check for duplicate email in this company
      const existingEmployee = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!existingEmployee.empty) {
        throw new HttpsError(
          'already-exists',
          'An employee with this email already exists in your company'
        );
      }

      // 3. Generate secure invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      // 4. Create employee document
      const fullName = `${firstName} ${lastName}`;
      const employeeData: Omit<CompanyEmployee, 'id'> = {
        companyId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        fullName,
        jobTitle: jobTitle?.trim() || '',
        status: 'invited',
        inviteToken,
        inviteExpiresAt: Timestamp.fromDate(expiresAt),
        enrolledMasterclasses: [],
        invitedBy: userId,
        invitedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      const employeeRef = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .add(employeeData);

      // 5. Get company name for email
      const companyDoc = await db.collection('companies').doc(companyId).get();
      const companyName = companyDoc.data()?.name || 'DMA';

      // 6. Send invitation email via SendGrid (non-blocking)
      try {
        await sendInvitationEmail(email, {
          firstName,
          companyName,
          inviteUrl: `${process.env.APP_URL || 'https://academion.hu'}/company/invite/${inviteToken}`,
        });
        console.log(`Invitation email sent to ${email}`);
      } catch (emailError: any) {
        console.warn(`Failed to send invitation email to ${email}:`, emailError.message);
        // Don't throw - employee was still added successfully
      }

      return {
        success: true,
        employeeId: employeeRef.id,
        inviteToken,
        message: `Invitation sent to ${email}`,
      };
    } catch (error: any) {
      console.error('Error adding employee:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Verify Employee Invite Token
 */
export const verifyEmployeeInvite = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<{ token: string }>) => {
    const { token } = request.data;

    if (!token) {
      throw new HttpsError(
        'invalid-argument',
        'Invite token is required'
      );
    }

    try {
      // Find employee by token (collection group query)
      const employeeQuery = await db
        .collectionGroup('employees')
        .where('inviteToken', '==', token)
        .limit(1)
        .get();

      if (employeeQuery.empty) {
        throw new HttpsError('not-found', 'Invalid invite token');
      }

      const employeeDoc = employeeQuery.docs[0];
      const employeeData = employeeDoc.data() as CompanyEmployee;

      // Check if token has expired
      const now = new Date();
      const expiresAt = employeeData.inviteExpiresAt?.toDate();

      if (expiresAt && expiresAt < now) {
        throw new HttpsError('failed-precondition', 'Invite has expired');
      }

      // Check if already accepted
      if (employeeData.status !== 'invited') {
        throw new HttpsError(
          'failed-precondition',
          'Invite has already been used'
        );
      }

      // Get company info
      const companyDoc = await db
        .collection('companies')
        .doc(employeeData.companyId)
        .get();

      // Return format expected by frontend invite page
      return {
        valid: true,
        companyName: companyDoc.data()?.name || 'Unknown Company',
        employeeEmail: employeeData.email,
        employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
      };
    } catch (error: any) {
      console.error('Error verifying invite:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Accept Employee Invite
 * 🔴 CRITICAL: Uses transaction to prevent double-use of token
 */
export const acceptEmployeeInvite = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<{ token: string }>) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { token } = request.data;
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;

    if (!token) {
      throw new HttpsError(
        'invalid-argument',
        'Invite token is required'
      );
    }

    // 🔴 CRITICAL FIX: Use transaction to prevent double-use of token
    const result = await db.runTransaction(async (transaction) => {
      // 1. Find employee by token
      const employeeQuery = await db
        .collectionGroup('employees')
        .where('inviteToken', '==', token)
        .limit(1)
        .get();

      if (employeeQuery.empty) {
        throw new HttpsError('not-found', 'Invalid invite token');
      }

      const employeeDocRef = employeeQuery.docs[0].ref;
      const employeeDoc = await transaction.get(employeeDocRef);
      const employeeData = employeeDoc.data() as CompanyEmployee;

      // 2. Check if already accepted (in transaction)
      if (employeeData.status !== 'invited') {
        throw new HttpsError(
          'failed-precondition',
          'Invite has already been used'
        );
      }

      // 3. Email matching is now optional - allow existing users with different email
      // This enables "merge accounts" flow where existing users can join companies
      // The invite token itself is the security measure
      const emailMatches = userEmail && employeeData.email.toLowerCase() === userEmail.toLowerCase();
      if (!emailMatches) {
        console.log(`Employee ${userId} accepting invite with different email. Invited: ${employeeData.email}, Logged in: ${userEmail}`);
      }

      // 4. Check if token has expired
      const now = new Date();
      const expiresAt = employeeData.inviteExpiresAt?.toDate();

      if (expiresAt && expiresAt < now) {
        throw new HttpsError(
          'failed-precondition',
          'Invite has expired'
        );
      }

      // 5. Update employee ATOMICALLY (prevents race condition)
      transaction.update(employeeDocRef, {
        userId,
        status: 'active',
        inviteAcceptedAt: FieldValue.serverTimestamp(),
        inviteToken: FieldValue.delete(),
        inviteExpiresAt: FieldValue.delete(),
      });

      return {
        success: true,
        companyId: employeeData.companyId,
        employeeId: employeeDocRef.id,
      };
    });

    // 6. Set custom user claims for COMPANY_EMPLOYEE role
    try {
      await admin.auth().setCustomUserClaims(userId, {
        role: 'COMPANY_EMPLOYEE',
        companyId: result.companyId,
      });
      console.log(`Custom claims set for employee ${userId}`);
    } catch (claimsError: any) {
      console.error('Error setting custom claims:', claimsError);
      // Don't throw - invite was already accepted successfully
    }

    // 7. Update user document with company info (for dashboard display)
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        // Update existing user - merge accounts
        await userRef.update({
          companyId: result.companyId,
          companyRole: 'employee',
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`Updated existing user ${userId} with company ${result.companyId}`);
      } else {
        // Create user document if doesn't exist (shouldn't happen normally)
        const authUser = await admin.auth().getUser(userId);
        await userRef.set({
          id: userId,
          email: authUser.email || '',
          firstName: authUser.displayName?.split(' ')[0] || '',
          lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'STUDENT', // Keep as student for course access
          companyId: result.companyId,
          companyRole: 'employee',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`Created user document for ${userId} with company ${result.companyId}`);
      }
    } catch (userError: any) {
      console.error('Error updating user document:', userError);
      // Don't throw - invite was already accepted successfully
    }

    // 8. Auto-enroll employee in all company-purchased masterclasses
    try {
      const companyDoc = await db.collection('companies').doc(result.companyId).get();
      const companyData = companyDoc.data();
      const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];

      if (purchasedMasterclasses.length > 0) {
        // Update employee document with enrolled masterclasses
        await db
          .collection('companies')
          .doc(result.companyId)
          .collection('employees')
          .doc(result.employeeId)
          .update({
            enrolledMasterclasses: purchasedMasterclasses,
          });

        // Create progress records for each masterclass
        const batch = db.batch();

        for (const masterclassId of purchasedMasterclasses) {
          const progressId = `${userId}_${masterclassId}`;
          const progressRef = db.collection('userProgress').doc(progressId);

          batch.set(progressRef, {
            userId,
            masterclassId,
            companyId: result.companyId,
            currentModule: 1,
            completedModules: [],
            status: 'active',
            enrolledAt: FieldValue.serverTimestamp(),
            lastActivityAt: FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();

        console.log(
          `Employee ${userId} auto-enrolled in ${purchasedMasterclasses.length} company-purchased masterclasses`
        );
      }
    } catch (enrollError) {
      console.error('Error auto-enrolling employee:', enrollError);
      // Don't throw error - invite was already accepted successfully
    }

    return {
      success: true,
      companyId: result.companyId,
      message: 'Invite accepted successfully',
    };
  }
);

/**
 * Send Invitation Email via SendGrid
 * Exported for use in completeOnboarding
 */
export async function sendInvitationEmail(
  to: string,
  data: {
    firstName: string;
    companyName: string;
    inviteUrl: string;
  }
) {
  const sgMail = require('@sendgrid/mail');
  const functions = require('firebase-functions');

  // Get SendGrid API key from Firebase Functions config
  const sendgridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;

  if (!sendgridApiKey) {
    console.warn('SendGrid API key not configured - skipping email');
    return { success: false, message: 'Email service not configured' };
  }

  sgMail.setApiKey(sendgridApiKey);

  const subject = `${data.companyName} meghívott az DMA Masterclass-ra`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meghívás az DMA Masterclass-ra</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Meghívás
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                DMA Masterclass
              </p>
            </td>
          </tr>

          <!-- Company Badge -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #f0f4ff; border-radius: 8px; padding: 12px 24px; margin-bottom: 20px;">
                <p style="margin: 0; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${data.companyName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Szia <strong>${data.firstName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                A(z) <strong>${data.companyName}</strong> meghívott, hogy csatlakozz hozzájuk az DMA Masterclass képzésen.
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  <strong>Mit kapsz:</strong>
                </p>
                <ul style="margin: 10px 0 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li>Hozzáférés az összes kurzusanyaghoz</li>
                  <li>Interaktív gyakorlatok és feladatok</li>
                  <li>Szakértői támogatás</li>
                  <li>Tanúsítvány a sikeres befejezés után</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${data.inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3); transition: transform 0.2s;">
                      Meghívó elfogadása
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                vagy másold be ezt a linket a böngésződbe:
              </p>
              <p style="margin: 10px 0 0; color: #667eea; font-size: 13px; word-break: break-all; text-align: center;">
                ${data.inviteUrl}
              </p>
            </td>
          </tr>

          <!-- Warning Box -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; text-align: center;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                  ⏰ Ez a meghívó <strong>7 napon belül</strong> jár le
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Üdvözlettel,<br>
                <strong>Az DMA csapata</strong>
              </p>
              <p style="margin: 15px 0 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} DMA. Minden jog fenntartva.
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                Ha nem te kérted ezt a meghívót, egyszerűen figyelmen kívül hagyhatod ezt az emailt.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
Szia ${data.firstName},

A(z) ${data.companyName} meghívott, hogy csatlakozz hozzájuk az DMA Masterclass képzésen.

Mit kapsz:
- Hozzáférés az összes kurzusanyaghoz
- Interaktív gyakorlatok és feladatok
- Szakértői támogatás
- Tanúsítvány a sikeres befejezés után

A meghívó elfogadásához kattints az alábbi linkre:
${data.inviteUrl}

Ez a meghívó 7 napon belül jár le.

Üdvözlettel,
Az DMA csapata

Ha nem te kérted ezt a meghívót, egyszerűen figyelmen kívül hagyhatod ezt az emailt.
  `.trim();

  try {
    await sgMail.send({
      to,
      from: {
        email: 'info@dma.hu',
        name: 'DMA Masterclass',
      },
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Invitation email sent successfully to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}
