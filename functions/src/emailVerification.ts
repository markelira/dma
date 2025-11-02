/**
 * Email Verification Code System
 *
 * Handles 4-digit OTP email verification with hard block enforcement
 * Users must verify email before accessing platform features
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as z from 'zod';
import sgMail from '@sendgrid/mail';

const firestore = admin.firestore();

// Lazy SendGrid initialization
let sendGridInitialized = false;

function initializeSendGrid(): boolean {
  if (!sendGridInitialized) {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      sgMail.setApiKey(SENDGRID_API_KEY);
      sendGridInitialized = true;
      logger.info('SendGrid initialized for verification emails');
      return true;
    }
    logger.warn('SENDGRID_API_KEY not set, email sending will fail');
    return false;
  }
  return true;
}

/**
 * Generate a 4-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Create verification email HTML template
 */
function createVerificationEmailTemplate(code: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email megerősítés - DMA Platform</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main container -->
        <table width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with DMA Navy -->
          <tr>
            <td style="background: linear-gradient(135deg, #2C3E54 0%, #3d5269 100%); padding: 48px 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                DMA Platform
              </h1>
              <p style="margin: 12px 0 0 0; color: #E5E7EB; font-size: 16px; font-weight: 400;">
                Digital Marketing Academy
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 48px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                Erősítsd meg az email címed
              </h2>
              <p style="margin: 0 0 32px 0; color: #6B7280; font-size: 16px; line-height: 24px; text-align: center;">
                A regisztrációd befejezéséhez add meg az alábbi 4 jegyű kódot:
              </p>

              <!-- 4-digit code display -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(to top, #2563eb, #3b82f6); padding: 24px 64px; border-radius: 12px; box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);">
                      <span style="color: #ffffff; font-size: 48px; font-weight: 700; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; color: #6B7280; font-size: 14px; line-height: 20px; text-align: center;">
                Ez a kód <strong style="color: #111827;">15 percig</strong> érvényes.
              </p>
              <p style="margin: 16px 0 0 0; color: #9CA3AF; font-size: 14px; line-height: 20px; text-align: center;">
                Ha nem te kezdeményezted ezt a regisztrációt, kérjük hagyd figyelmen kívül ezt az emailt.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #E5E7EB;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
                Email cím: <strong style="color: #111827;">${email}</strong>
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 18px;">
                © 2025 DMA Platform. Minden jog fenntartva.<br/>
                Digital Marketing Academy - Professzionális online képzések
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
}

/**
 * Send Email Verification Code
 *
 * Generates a 4-digit code, stores in Firestore, and sends via email
 * Rate limited: 5 codes per hour per email
 * Code expires in 15 minutes
 */
export const sendEmailVerificationCode = onCall({
  cors: [
    'https://www.academion.hu',
    'https://academion.hu',
    'https://dma-nine-delta.vercel.app',
    'http://localhost:3000'
  ],
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Get user document
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('Felhasználói adatok nem találhatók');
    }

    const email = userData.email;

    // Check if already verified
    if (userData.emailVerified === true) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'Az email cím már megerősítve'
      };
    }

    // Rate limiting: Check how many codes were sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodesSnapshot = await firestore
      .collection('emailVerificationCodes')
      .where('userId', '==', userId)
      .where('createdAt', '>', oneHourAgo)
      .get();

    if (recentCodesSnapshot.size >= 5) {
      throw new Error('Túl sok kód kérés. Próbáld újra 1 óra múlva.');
    }

    // Invalidate any existing active codes for this user
    const existingCodesSnapshot = await firestore
      .collection('emailVerificationCodes')
      .where('userId', '==', userId)
      .where('used', '==', false)
      .get();

    const batch = firestore.batch();
    existingCodesSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        used: true,
        invalidatedAt: new Date().toISOString()
      });
    });
    await batch.commit();

    // Generate new 4-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code in Firestore
    const verificationCodeData = {
      userId,
      email,
      code,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      attempts: 0,
      locked: false,
      maxAttempts: 3
    };

    const verificationCodeRef = await firestore
      .collection('emailVerificationCodes')
      .add(verificationCodeData);

    logger.info(`Verification code created for user ${userId}: ${verificationCodeRef.id}`);

    // Send email with verification code
    const sendGridReady = initializeSendGrid();

    if (sendGridReady) {
      try {
        const emailContent = createVerificationEmailTemplate(code, email);

        const msg = {
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@dma.hu',
          subject: 'Email megerősítés - DMA Platform',
          html: emailContent
        };

        await sgMail.send(msg);
        logger.info(`Verification email sent to ${email}`);

        return {
          success: true,
          message: 'Elküldtük az email megerősítő kódot',
          codeId: verificationCodeRef.id,
          expiresAt: expiresAt.toISOString()
        };
      } catch (emailError: any) {
        logger.error('SendGrid error:', emailError);

        // Even if email fails, code is stored in Firestore
        // User can still use it if they somehow get the code
        return {
          success: true,
          warning: 'Kód generálva, de email küldés sikertelen',
          codeId: verificationCodeRef.id,
          expiresAt: expiresAt.toISOString()
        };
      }
    } else {
      // SendGrid not configured, but code is still stored
      logger.warn('SendGrid not configured, code stored but email not sent');

      return {
        success: true,
        warning: 'SendGrid nincs konfigurálva',
        codeId: verificationCodeRef.id,
        code: code, // Include code in response for emulator testing
        expiresAt: expiresAt.toISOString()
      };
    }

  } catch (error: any) {
    logger.error('Send verification code error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen paraméterek',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Megerősítő kód küldése sikertelen'
    };
  }
});

/**
 * Verify Email Code
 *
 * Validates the 4-digit code entered by user
 * Max 3 attempts per code, then locked
 */
export const verifyEmailCode = onCall({
  cors: [
    'https://www.academion.hu',
    'https://academion.hu',
    'https://dma-nine-delta.vercel.app',
    'http://localhost:3000'
  ],
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const { code } = request.data;

    if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
      throw new Error('Érvénytelen kód formátum');
    }

    const userId = request.auth.uid;

    // Find active verification code for this user
    const verificationCodesSnapshot = await firestore
      .collection('emailVerificationCodes')
      .where('userId', '==', userId)
      .where('code', '==', code)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (verificationCodesSnapshot.empty) {
      // Increment attempts on all active codes for this user
      const activeCodesSnapshot = await firestore
        .collection('emailVerificationCodes')
        .where('userId', '==', userId)
        .where('used', '==', false)
        .get();

      const batch = firestore.batch();
      activeCodesSnapshot.forEach(doc => {
        const data = doc.data();
        const newAttempts = (data.attempts || 0) + 1;
        const shouldLock = newAttempts >= 3;

        batch.update(doc.ref, {
          attempts: newAttempts,
          locked: shouldLock,
          lastAttemptAt: new Date().toISOString()
        });
      });
      await batch.commit();

      throw new Error('Hibás kód');
    }

    const verificationDoc = verificationCodesSnapshot.docs[0];
    const verificationData = verificationDoc.data();

    // Check if locked
    if (verificationData.locked) {
      throw new Error('A kód zárolva lett. Kérj új kódot.');
    }

    // Check if expired
    const expiryDate = new Date(verificationData.expiresAt);
    if (expiryDate < new Date()) {
      // Mark as used
      await firestore
        .collection('emailVerificationCodes')
        .doc(verificationDoc.id)
        .update({ used: true, expiredAt: new Date().toISOString() });

      throw new Error('A kód lejárt. Kérj új kódot.');
    }

    // Code is valid! Update user document
    await firestore.collection('users').doc(userId).update({
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Mark code as used
    await firestore
      .collection('emailVerificationCodes')
      .doc(verificationDoc.id)
      .update({
        used: true,
        usedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString()
      });

    logger.info(`Email verified successfully for user ${userId}`);

    return {
      success: true,
      message: 'Email sikeresen megerősítve!',
      verified: true
    };

  } catch (error: any) {
    logger.error('Verify email code error:', error);

    return {
      success: false,
      error: error.message || 'Kód ellenőrzése sikertelen'
    };
  }
});

/**
 * Resend Verification Code
 *
 * Invalidates old code and sends a new one
 * Cooldown: 60 seconds between requests
 */
export const resendVerificationCode = onCall({
  cors: [
    'https://www.academion.hu',
    'https://academion.hu',
    'https://dma-nine-delta.vercel.app',
    'http://localhost:3000'
  ],
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Check cooldown: last code must be at least 60 seconds old
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recentCodeSnapshot = await firestore
      .collection('emailVerificationCodes')
      .where('userId', '==', userId)
      .where('createdAt', '>', sixtySecondsAgo)
      .limit(1)
      .get();

    if (!recentCodeSnapshot.empty) {
      const lastCode = recentCodeSnapshot.docs[0].data();
      const createdAt = new Date(lastCode.createdAt);
      const waitSeconds = Math.ceil((60 - (Date.now() - createdAt.getTime()) / 1000));

      throw new Error(`Várj még ${waitSeconds} másodpercet mielőtt új kódot kérsz`);
    }

    // Call sendEmailVerificationCode (it handles invalidation and rate limiting)
    const result = await sendEmailVerificationCode.run(request);

    return result;

  } catch (error: any) {
    logger.error('Resend verification code error:', error);

    return {
      success: false,
      error: error.message || 'Új kód küldése sikertelen'
    };
  }
});
