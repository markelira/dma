/**
 * Send Manual Reminder to At-Risk Employees
 * MVP: Admin can manually send reminder emails to employees who are falling behind
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface SendReminderInput {
  companyId: string;
  employeeId: string;
  masterclassId?: string;
}

/**
 * Send reminder email to employee
 */
export const sendEmployeeReminder = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    maxInstances: 10, // Limit concurrent executions
    timeoutSeconds: 60, // 1 minute timeout
    cors: true,
  },
  async (request: CallableRequest<SendReminderInput>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, employeeId, masterclassId } = request.data;
    const userId = request.auth.uid;

    if (!companyId || !employeeId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
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

      // 2. Get employee data
      const employeeDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        throw new HttpsError('not-found', 'Employee not found');
      }

      const employeeData = employeeDoc.data();

      if (!employeeData) {
        throw new HttpsError('not-found', 'Employee data not found');
      }

      // 3. Get company data
      const companyDoc = await db.collection('companies').doc(companyId).get();
      const companyData = companyDoc.data();
      const companyName = companyData?.name || 'Your Company';

      // 4. Get masterclass data if specified
      let masterclassTitle = 'your assigned masterclass';
      if (masterclassId) {
        const masterclassDoc = await db
          .collection('course-content')
          .doc(masterclassId)
          .get();

        if (masterclassDoc.exists) {
          masterclassTitle = masterclassDoc.data()?.title || masterclassTitle;
        }
      }

      // 5. Send reminder email
      await sendReminderEmail(employeeData.email, {
        firstName: employeeData.firstName,
        companyName,
        masterclassTitle,
        dashboardUrl: `${process.env.APP_URL || 'https://academion.hu'}/dashboard`,
      });

      // 6. Log activity
      await db.collection('companies').doc(companyId).collection('activity').add({
        type: 'reminder_sent',
        employeeId,
        employeeName: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
        masterclassId: masterclassId || null,
        sentBy: userId,
        sentByEmail: request.auth.token.email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `Reminder sent to employee ${employeeId} in company ${companyId}`
      );

      return {
        success: true,
        message: `Reminder sent to ${employeeData.firstName}`,
      };
    } catch (error: any) {
      console.error('Error sending reminder:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Send reminder email via SendGrid
 */
async function sendReminderEmail(
  to: string,
  data: {
    firstName: string;
    companyName: string;
    masterclassTitle: string;
    dashboardUrl: string;
  }
) {
  const sgMail = require('@sendgrid/mail');
  const functions = require('firebase-functions');

  // Get SendGrid API key
  const sendgridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;

  if (!sendgridApiKey) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }

  sgMail.setApiKey(sendgridApiKey);

  const subject = `🔔 Emlékeztető: Folytasd a ${data.masterclassTitle} tanulását`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tanulási emlékeztető</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔔 Tanulási Emlékeztető
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Szia <strong>${data.firstName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                A(z) <strong>${data.companyName}</strong> csapata észrevette, hogy egy ideje nem dolgoztál a <strong>${data.masterclassTitle}</strong> képzésen.
              </p>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.6;">
                  <strong>💡 Tipp:</strong> Csak napi 15 perc elég ahhoz, hogy lendületben maradj és a lehető legtöbbet hozd ki a képzésből!
                </p>
              </div>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Folytasd ott, ahol abbahagytad:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Folytatom a tanulást →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Tudjuk, hogy elfoglalt vagy, de az időbefektetés megéri - a csapat számít rád! 💪
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Üdvözlettel,<br>
                <strong>${data.companyName} & Az DMA csapata</strong>
              </p>
              <p style="margin: 15px 0 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} DMA. Minden jog fenntartva.
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

A(z) ${data.companyName} csapata észrevette, hogy egy ideje nem dolgoztál a ${data.masterclassTitle} képzésen.

💡 Tipp: Csak napi 15 perc elég ahhoz, hogy lendületben maradj és a lehető legtöbbet hozd ki a képzésből!

Folytasd ott, ahol abbahagytad:
${data.dashboardUrl}

Tudjuk, hogy elfoglalt vagy, de az időbefektetés megéri - a csapat számít rád! 💪

Üdvözlettel,
${data.companyName} & Az DMA csapata
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

    console.log(`Reminder email sent successfully to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending reminder email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw new Error(`Failed to send reminder email: ${error.message}`);
  }
}
