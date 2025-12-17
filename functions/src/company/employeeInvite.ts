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
    region: 'europe-west1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<AddEmployeeData>) => {
    console.log('📧 [addEmployee] Function called', {
      hasAuth: !!request.auth,
      userId: request.auth?.uid,
      data: { ...request.data, email: request.data?.email?.substring(0, 5) + '...' },
    });

    if (!request.auth) {
      console.log('❌ [addEmployee] No auth - rejecting');
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { companyId, email, firstName, lastName, jobTitle } = request.data;
    const userId = request.auth.uid;

    console.log('📧 [addEmployee] Processing invite for:', { companyId, email, firstName, lastName });

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

      // 2b. Check if email already exists in Firebase Auth
      try {
        await admin.auth().getUserByEmail(email.toLowerCase());
        // If we get here, user exists - throw error
        throw new HttpsError(
          'already-exists',
          'Ez az email cím már regisztrálva van. A felhasználó a beállításokban csatlakozhat a céghez.'
        );
      } catch (authError: any) {
        // user-not-found is expected and good - means we can invite
        if (authError.code !== 'auth/user-not-found' && !(authError instanceof HttpsError)) {
          console.error('[addEmployee] Error checking email in Auth:', authError);
          throw new HttpsError('internal', 'Failed to verify email availability');
        }
        // Re-throw our HttpsError if that's what it is
        if (authError instanceof HttpsError) {
          throw authError;
        }
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

      console.log('✅ [addEmployee] Employee document created:', employeeRef.id);

      // 5. Get company name for email
      const companyDoc = await db.collection('companies').doc(companyId).get();
      const companyName = companyDoc.data()?.name || 'DMA';

      // 6. Send invitation email via SendGrid (non-blocking)
      // Link directly to registration with email prefilled - user gets auto-linked when registering
      const inviteUrl = `${process.env.APP_URL || 'https://masterclass.dma.hu'}/register?invite=${inviteToken}&email=${encodeURIComponent(email.toLowerCase())}`;
      console.log('📨 [addEmployee] Attempting to send email...', {
        to: email,
        companyName,
        inviteUrl: inviteUrl.substring(0, 80) + '...',
        hasSendgridKey: !!process.env.SENDGRID_API_KEY,
      });

      try {
        const emailResult = await sendInvitationEmail(email, {
          firstName,
          companyName,
          inviteUrl,
        });
        console.log('✅ [addEmployee] Invitation email sent to', email, 'Result:', emailResult);
      } catch (emailError: any) {
        console.error('❌ [addEmployee] Failed to send invitation email to', email, ':', emailError.message);
        // Don't throw - employee was still added successfully
      }

      console.log('🎉 [addEmployee] Complete - returning success');
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
    region: 'europe-west1',
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
    region: 'europe-west1',
    memory: '256MiB',
    cors: true,
  },
  async (request: CallableRequest<{ token: string }>) => {
    console.log('🎫 [acceptEmployeeInvite] Function called', {
      hasAuth: !!request.auth,
      userId: request.auth?.uid,
      userEmail: request.auth?.token?.email,
      tokenProvided: !!request.data?.token,
      tokenPrefix: request.data?.token?.substring(0, 10) + '...',
    });

    if (!request.auth) {
      console.log('❌ [acceptEmployeeInvite] No auth - rejecting');
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { token } = request.data;
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;

    if (!token) {
      console.log('❌ [acceptEmployeeInvite] No token provided');
      throw new HttpsError(
        'invalid-argument',
        'Invite token is required'
      );
    }

    console.log('🔄 [acceptEmployeeInvite] Starting transaction to accept invite...');
    // 🔴 CRITICAL FIX: Use transaction to prevent double-use of token
    const result = await db.runTransaction(async (transaction) => {
      // 1. Find employee by token
      const employeeQuery = await db
        .collectionGroup('employees')
        .where('inviteToken', '==', token)
        .limit(1)
        .get();

      if (employeeQuery.empty) {
        console.log('❌ [acceptEmployeeInvite] Token not found in any employee document');
        throw new HttpsError('not-found', 'Invalid invite token');
      }

      const employeeDocRef = employeeQuery.docs[0].ref;
      const employeeDoc = await transaction.get(employeeDocRef);
      const employeeData = employeeDoc.data() as CompanyEmployee;

      console.log('✅ [acceptEmployeeInvite] Found employee document:', {
        employeeId: employeeDocRef.id,
        employeeEmail: employeeData.email,
        employeeStatus: employeeData.status,
        companyId: employeeData.companyId,
      });

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

      console.log('✅ [acceptEmployeeInvite] Transaction: Updating employee status to active');
      return {
        success: true,
        companyId: employeeData.companyId,
        employeeId: employeeDocRef.id,
      };
    });

    console.log('✅ [acceptEmployeeInvite] Transaction completed successfully:', result);

    // 6. Set custom user claims for COMPANY_EMPLOYEE role
    console.log('🔑 [acceptEmployeeInvite] Setting custom claims for user...');
    try {
      await admin.auth().setCustomUserClaims(userId, {
        role: 'COMPANY_EMPLOYEE',
        companyId: result.companyId,
      });
      console.log('✅ [acceptEmployeeInvite] Custom claims set for employee', userId);
    } catch (claimsError: any) {
      console.error('❌ [acceptEmployeeInvite] Error setting custom claims:', claimsError);
      // Don't throw - invite was already accepted successfully
    }

    // 7. Update user document with company info (for dashboard display)
    console.log('📝 [acceptEmployeeInvite] Updating user document with company info...');
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
      console.error('⚠️ [acceptEmployeeInvite] CRITICAL: Failed to update user document:', {
        userId,
        companyId: result.companyId,
        error: userError.message,
        code: userError.code,
      });
      // Don't throw - invite was already accepted successfully
      // But this failure means subscription check won't find companyId!
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
  const { sendEmail } = require('../email/emailService');
  const {
    wrapInBaseTemplate,
    createHeading,
    createParagraph,
    createButtonRow,
    createFeatureList,
    createAlertBox,
    generatePlainText,
  } = require('../email/templates/base');

  const subject = `${data.companyName} meghívott a DMA Masterclass-ra`;

  // Build email content using base template
  const content = `
    ${createHeading('Csatlakozz a csapathoz!', 2)}
    ${createParagraph(`Szia <strong>${data.firstName}</strong>,`)}
    ${createParagraph(`A(z) <strong>${data.companyName}</strong> meghívott, hogy csatlakozz hozzájuk a DMA Masterclass platformon.`)}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Mit kapsz:
        </p>
      </td>
    </tr>
    ${createFeatureList([
      'Hozzáférés az összes prémium tartalomhoz',
      'Interaktív gyakorlatok és feladatok',
      'Szakértői támogatás',
      'Tanúsítvány a sikeres befejezés után',
    ])}

    ${createButtonRow({ text: 'Regisztrálj és csatlakozz', url: data.inviteUrl, variant: 'primary' })}

    ${createAlertBox('Ez a meghívó <strong>7 napon belül</strong> jár le.', 'warning')}

    ${createParagraph('Ha nem te kérted ezt a meghívót, egyszerűen hagyd figyelmen kívül ezt az emailt.', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: false, // Transactional email
    preheader: `${data.companyName} meghívott a DMA Masterclass platformra`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${data.firstName},`,
    paragraphs: [
      `A(z) ${data.companyName} meghívott, hogy csatlakozz hozzájuk a DMA Masterclass platformon.`,
      'Mit kapsz:',
      '- Hozzáférés az összes prémium tartalomhoz',
      '- Interaktív gyakorlatok és feladatok',
      '- Szakértői támogatás',
      '- Tanúsítvány a sikeres befejezés után',
      'Ez a meghívó 7 napon belül jár le.',
      'Ha nem te kérted ezt a meghívót, egyszerűen hagyd figyelmen kívül ezt az emailt.',
    ],
    ctaText: 'Regisztrálj és csatlakozz',
    ctaUrl: data.inviteUrl,
    signOff: 'Üdvözlettel, A DMA csapat',
  });

  try {
    const result = await sendEmail({
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (result.success) {
      console.log(`Invitation email sent successfully to ${to}`);
      return { success: true };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}
