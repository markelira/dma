/**
 * Create Company
 * Sets up company with owner admin
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  Company,
  CreateCompanyInput,
  CompanyAdmin,
  OWNER_PERMISSIONS,
} from '../types/company';

const db = admin.firestore();

/**
 * Generate URL-friendly slug from company name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit to 50 characters
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .collection('companies')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (existing.empty) {
      return slug;
    }

    // Add counter and try again
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Prevent infinite loop
    if (counter > 1000) {
      throw new Error('Could not generate unique slug');
    }
  }
}

/**
 * Create Company Function
 */
export const createCompany = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 5, // Limit concurrent company creations
    timeoutSeconds: 120, // 2 minutes timeout
    cors: true,
  },
  async (request: CallableRequest<CreateCompanyInput>) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be logged in to create a company'
      );
    }

    const { name, billingEmail } = request.data;
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;
    const userName = request.auth.token.name || 'Company Admin';

    // Validation
    if (!name || name.trim().length < 2) {
      throw new HttpsError(
        'invalid-argument',
        'Company name must be at least 2 characters'
      );
    }

    if (!billingEmail) {
      throw new HttpsError(
        'invalid-argument',
        'Billing email is required'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingEmail)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid billing email format'
      );
    }

    try {
      // 1. Check if user already owns a company (limit to 1 for MVP)
      const existingCompany = await db
        .collectionGroup('admins')
        .where('userId', '==', userId)
        .where('role', '==', 'owner')
        .limit(1)
        .get();

      if (!existingCompany.empty) {
        throw new HttpsError(
          'failed-precondition',
          'You already own a company. Contact support to create additional companies.'
        );
      }

      // 2. Generate unique slug
      const baseSlug = generateSlug(name);
      const slug = await ensureUniqueSlug(baseSlug);

      // 3. Calculate trial end date (14 days)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // 4. Create company document
      const companyData: Omit<Company, 'id'> = {
        name: name.trim(),
        slug,
        billingEmail: billingEmail.toLowerCase(),
        plan: 'trial',
        status: 'active',
        trialEndsAt: admin.firestore.Timestamp.fromDate(trialEndsAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const companyRef = await db.collection('companies').add(companyData);
      const companyId = companyRef.id;

      // 5. Create owner admin
      const adminData: Omit<CompanyAdmin, 'id'> = {
        userId,
        companyId,
        email: userEmail || billingEmail,
        name: userName,
        role: 'owner',
        permissions: OWNER_PERMISSIONS,
        status: 'active',
        addedBy: userId,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .set(adminData);

      // 6. Send welcome email (plain text for MVP)
      await sendWelcomeEmail(billingEmail, {
        companyName: name,
        dashboardUrl: `${process.env.APP_URL || 'https://academion.hu'}/company/dashboard`,
      });

      return {
        success: true,
        companyId,
        slug,
        message: 'Company created successfully!',
      };
    } catch (error: any) {
      console.error('Error creating company:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Send Welcome Email via SendGrid
 */
async function sendWelcomeEmail(
  to: string,
  data: {
    companyName: string;
    dashboardUrl: string;
  }
) {
  const sgMail = require('@sendgrid/mail');
  const functions = require('firebase-functions');

  // Get SendGrid API key
  const sendgridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;

  if (!sendgridApiKey) {
    console.error('SendGrid API key not configured - skipping welcome email');
    return { success: false, message: 'Email service not configured' };
  }

  sgMail.setApiKey(sendgridApiKey);

  const subject = '🎉 Üdvözlünk az DMA Céges Dashboardon!';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Üdvözlünk az Elirán</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                🎉 Üdvözlünk az Elirán!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Gratulálunk!
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                A <strong>${data.companyName}</strong> sikeresen létrehozva az DMA platformon.
              </p>

              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1b5e20; font-size: 15px; line-height: 1.6;">
                  <strong>✨ 14 napos próbaidőszak aktiválva!</strong><br>
                  Minden funkcióhoz teljes hozzáférésed van - kezdj el alkalmazottakat hozzáadni és képzéseket rendelni még ma.
                </p>
              </div>

              <p style="margin: 20px 0 10px; color: #333333; font-size: 16px; font-weight: 600;">
                Most már tudsz:
              </p>

              <ul style="margin: 0 0 25px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Alkalmazottakat hozzáadni a csapatodhoz</li>
                <li>Masterclass-okat rendelni számukra</li>
                <li>Valós időben követni a haladásukat</li>
                <li>Riportokat exportálni az eredményekről</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Irány a Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Tipp:</strong> Kezdd azzal, hogy meghívod az első alkalmazottaidat, majd rendeld meg számukra a megfelelő képzéseket. Kérdésed van? Írj nekünk bármikor az info@dma.hu címre!
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Készen állsz forradalmasítani a csapatod tudását? Kezdjük! 🚀
              </p>
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
Üdvözlünk az Elirán!

A ${data.companyName} sikeresen létrehozva az DMA platformon.

✨ 14 napos próbaidőszak aktiválva!
Minden funkcióhoz teljes hozzáférésed van.

Most már tudsz:
- Alkalmazottakat hozzáadni a csapatodhoz
- Masterclass-okat rendelni számukra
- Valós időben követni a haladásukat
- Riportokat exportálni az eredményekről

Irány a Dashboard: ${data.dashboardUrl}

💡 Tipp: Kezdd azzal, hogy meghívod az első alkalmazottaidat, majd rendeld meg számukra a megfelelő képzéseket.

Készen állsz forradalmasítani a csapatod tudását? Kezdjük! 🚀

Üdvözlettel,
Az DMA csapata
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

    console.log(`Welcome email sent successfully to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    // Don't throw - just log the error and continue
    // Company creation should not fail if email fails
    return { success: false, message: error.message };
  }
}
