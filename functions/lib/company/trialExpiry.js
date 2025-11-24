"use strict";
/**
 * Trial Expiry Management Functions
 *
 * Handles automatic suspension of companies whose trials have expired
 * and sends warning emails before expiration.
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
exports.extendCompanyTrial = exports.getCompanyTrialStatus = exports.checkTrialExpiry = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const v2_2 = require("firebase-functions/v2");
const db = admin.firestore();
/**
 * Scheduled function to check and handle expired trials
 * Runs daily at 2:00 AM UTC
 */
exports.checkTrialExpiry = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *', // Every day at 2:00 AM UTC
    region: 'us-central1',
    timeZone: 'Europe/Budapest',
}, async () => {
    v2_2.logger.info('[checkTrialExpiry] Starting trial expiry check...');
    const now = admin.firestore.Timestamp.now();
    const threeDaysFromNow = admin.firestore.Timestamp.fromMillis(now.toMillis() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = admin.firestore.Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);
    try {
        // 1. Find and suspend expired trials
        const expiredTrialsQuery = await db
            .collection('companies')
            .where('plan', '==', 'trial')
            .where('status', '==', 'active')
            .where('trialEndsAt', '<=', now)
            .get();
        let suspendedCount = 0;
        for (const doc of expiredTrialsQuery.docs) {
            const company = doc.data();
            await doc.ref.update({
                status: 'suspended',
                suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
                suspendReason: 'trial_expired',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Send expiration email to billing contact
            try {
                await sendTrialExpiredEmail(company.billingEmail, {
                    companyName: company.name,
                });
            }
            catch (emailError) {
                v2_2.logger.warn(`[checkTrialExpiry] Failed to send expiry email to ${company.billingEmail}:`, emailError.message);
            }
            suspendedCount++;
            v2_2.logger.info(`[checkTrialExpiry] Suspended company ${doc.id} (${company.name}) - trial expired`);
        }
        // 2. Send 3-day warning emails
        const threeDayWarningQuery = await db
            .collection('companies')
            .where('plan', '==', 'trial')
            .where('status', '==', 'active')
            .where('trialEndsAt', '>', now)
            .where('trialEndsAt', '<=', threeDaysFromNow)
            .get();
        let warningsSent = 0;
        for (const doc of threeDayWarningQuery.docs) {
            const company = doc.data();
            // Check if we already sent a 3-day warning
            if (company.threeDayWarningSent)
                continue;
            try {
                await sendTrialWarningEmail(company.billingEmail, {
                    companyName: company.name,
                    daysRemaining: 3,
                    trialEndsAt: company.trialEndsAt.toDate().toLocaleDateString('hu-HU'),
                });
                await doc.ref.update({
                    threeDayWarningSent: true,
                    threeDayWarningSentAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                warningsSent++;
                v2_2.logger.info(`[checkTrialExpiry] Sent 3-day warning to ${company.billingEmail}`);
            }
            catch (emailError) {
                v2_2.logger.warn(`[checkTrialExpiry] Failed to send 3-day warning to ${company.billingEmail}:`, emailError.message);
            }
        }
        // 3. Send 7-day warning emails
        const sevenDayWarningQuery = await db
            .collection('companies')
            .where('plan', '==', 'trial')
            .where('status', '==', 'active')
            .where('trialEndsAt', '>', threeDaysFromNow)
            .where('trialEndsAt', '<=', sevenDaysFromNow)
            .get();
        for (const doc of sevenDayWarningQuery.docs) {
            const company = doc.data();
            // Check if we already sent a 7-day warning
            if (company.sevenDayWarningSent)
                continue;
            try {
                await sendTrialWarningEmail(company.billingEmail, {
                    companyName: company.name,
                    daysRemaining: 7,
                    trialEndsAt: company.trialEndsAt.toDate().toLocaleDateString('hu-HU'),
                });
                await doc.ref.update({
                    sevenDayWarningSent: true,
                    sevenDayWarningSentAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                warningsSent++;
                v2_2.logger.info(`[checkTrialExpiry] Sent 7-day warning to ${company.billingEmail}`);
            }
            catch (emailError) {
                v2_2.logger.warn(`[checkTrialExpiry] Failed to send 7-day warning to ${company.billingEmail}:`, emailError.message);
            }
        }
        v2_2.logger.info(`[checkTrialExpiry] Completed. Suspended: ${suspendedCount}, Warnings sent: ${warningsSent}`);
    }
    catch (error) {
        v2_2.logger.error('[checkTrialExpiry] Error:', error);
        throw error;
    }
});
/**
 * Manual function to check a specific company's trial status
 * Used for admin dashboard or debugging
 */
exports.getCompanyTrialStatus = v2_1.https.onCall({
    region: 'us-central1',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId } = request.data;
    if (!companyId) {
        throw new https_1.HttpsError('invalid-argument', 'Company ID required');
    }
    try {
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Company not found');
        }
        const company = companyDoc.data();
        const now = new Date();
        const trialEndsAt = company.trialEndsAt?.toDate();
        let daysRemaining = 0;
        let isExpired = false;
        if (trialEndsAt) {
            const diff = trialEndsAt.getTime() - now.getTime();
            daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
            isExpired = diff <= 0;
        }
        return {
            success: true,
            data: {
                plan: company.plan,
                status: company.status,
                trialEndsAt: trialEndsAt?.toISOString() || null,
                daysRemaining: Math.max(0, daysRemaining),
                isExpired,
                suspendedAt: company.suspendedAt?.toDate()?.toISOString() || null,
                suspendReason: company.suspendReason || null,
            },
        };
    }
    catch (error) {
        v2_2.logger.error('[getCompanyTrialStatus] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Extend a company's trial period (Admin only)
 */
exports.extendCompanyTrial = v2_1.https.onCall({
    region: 'us-central1',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    // Verify admin role
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
        throw new https_1.HttpsError('permission-denied', 'Admin access required');
    }
    const { companyId, days } = request.data;
    if (!companyId || !days || days <= 0 || days > 90) {
        throw new https_1.HttpsError('invalid-argument', 'Valid company ID and days (1-90) required');
    }
    try {
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Company not found');
        }
        const company = companyDoc.data();
        const currentTrialEnd = company.trialEndsAt?.toDate() || new Date();
        const newTrialEnd = new Date(Math.max(currentTrialEnd.getTime(), Date.now()));
        newTrialEnd.setDate(newTrialEnd.getDate() + days);
        await companyDoc.ref.update({
            trialEndsAt: admin.firestore.Timestamp.fromDate(newTrialEnd),
            status: 'active', // Reactivate if suspended
            suspendedAt: admin.firestore.FieldValue.delete(),
            suspendReason: admin.firestore.FieldValue.delete(),
            // Reset warning flags so they can be sent again if needed
            threeDayWarningSent: admin.firestore.FieldValue.delete(),
            sevenDayWarningSent: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            trialExtendedBy: request.auth.uid,
            trialExtendedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_2.logger.info(`[extendCompanyTrial] Extended trial for ${companyId} by ${days} days. New end: ${newTrialEnd.toISOString()}`);
        return {
            success: true,
            message: `Trial extended by ${days} days`,
            newTrialEndsAt: newTrialEnd.toISOString(),
        };
    }
    catch (error) {
        v2_2.logger.error('[extendCompanyTrial] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Send trial warning email
 */
async function sendTrialWarningEmail(to, data) {
    const sgMail = require('@sendgrid/mail');
    const functions = require('firebase-functions');
    const sendgridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
        v2_2.logger.warn('SendGrid API key not configured - skipping email');
        return { success: false, message: 'Email service not configured' };
    }
    sgMail.setApiKey(sendgridApiKey);
    const subject = `DMA próbaidőszak: ${data.daysRemaining} nap van hátra`;
    const isUrgent = data.daysRemaining <= 3;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: ${isUrgent ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                ${isUrgent ? '⚠️ Sürgős' : '⏰ Emlékeztető'}
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Próbaidőszak hamarosan lejár
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Kedves <strong>${data.companyName}</strong> csapata,
              </p>

              <div style="background-color: ${isUrgent ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isUrgent ? '#ef4444' : '#f59e0b'}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #333; font-size: 18px; font-weight: 600;">
                  A DMA próbaidőszaka <strong>${data.daysRemaining} nap</strong> múlva lejár.
                </p>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
                  Lejárat dátuma: ${data.trialEndsAt}
                </p>
              </div>

              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                A próbaidőszak lejárta után a hozzáférés felfüggesztésre kerül. Az előfizetés megvásárlásával folytathatja a képzéseket megszakítás nélkül.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://academion.hu/company/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Előfizetés aktiválása
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666666; font-size: 14px;">
                Kérdése van? Írjon nekünk: info@dma.hu
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
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
    await sgMail.send({
        to,
        from: { email: 'info@dma.hu', name: 'DMA' },
        subject,
        html: htmlContent,
    });
    return { success: true };
}
/**
 * Send trial expired email
 */
async function sendTrialExpiredEmail(to, data) {
    const sgMail = require('@sendgrid/mail');
    const functions = require('firebase-functions');
    const sendgridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
        v2_2.logger.warn('SendGrid API key not configured - skipping email');
        return { success: false, message: 'Email service not configured' };
    }
    sgMail.setApiKey(sendgridApiKey);
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                Próbaidőszak lejárt
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Kedves <strong>${data.companyName}</strong> csapata,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                A DMA próbaidőszaka lejárt, ezért a hozzáférés felfüggesztésre került.
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                A korábbi haladást és adatokat megőrizzük. Az előfizetés aktiválásával azonnal újra hozzáférhet minden funkcióhoz.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://academion.hu/company/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Előfizetés aktiválása
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666666; font-size: 14px;">
                Kérdése van? Írjon nekünk: info@dma.hu
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
    await sgMail.send({
        to,
        from: { email: 'info@dma.hu', name: 'DMA' },
        subject: 'DMA próbaidőszak lejárt',
        html: htmlContent,
    });
    return { success: true };
}
//# sourceMappingURL=trialExpiry.js.map