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
import { sendEmail } from './email/emailService';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createCodeDisplay,
  createAlertBox,
} from './email/templates/base';

const firestore = admin.firestore();

/**
 * Generate a 4-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Create verification email HTML template using base template
 */
function createVerificationEmailTemplate(code: string): string {
  const content = `
    ${createHeading('Erősítsd meg az email címed', 2)}
    ${createParagraph('A regisztrációd befejezéséhez add meg az alábbi 4 jegyű kódot:')}
    ${createCodeDisplay(code)}
    ${createAlertBox('Ez a kód <strong>15 percig</strong> érvényes.', 'info')}
    ${createParagraph('Ha nem te kezdeményezted ezt a regisztrációt, kérjük hagyd figyelmen kívül ezt az emailt.', { muted: true })}
  `;

  return wrapInBaseTemplate(content, {
    showUnsubscribe: false, // Transactional email
    preheader: `A megerősítő kódod: ${code}`,
  });
}

/**
 * Send Email Verification Code
 *
 * Generates a 4-digit code, stores in Firestore, and sends via email
 * Rate limited: 5 codes per hour per email
 * Code expires in 15 minutes
 */
export const sendEmailVerificationCode = onCall({
  cors: true,
  region: 'europe-west1',
  invoker: 'public', // Allow allUsers IAM permission for Cloud Run
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Get email directly from auth token (works even if Firestore document doesn't exist yet)
    const email = request.auth.token.email as string;
    if (!email) {
      throw new Error('Email cím nem található az auth tokenben');
    }

    // Check if already verified (optional check, don't fail if document doesn't exist yet)
    let alreadyVerified = false;
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.emailVerified === true) {
          alreadyVerified = true;
        }
      }
    } catch (error) {
      // Document doesn't exist yet (user just registered), continue with verification
      logger.info(`User document not yet available for ${userId}, proceeding with verification`);
    }

    if (alreadyVerified) {
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

    // Send email with verification code using unified email service
    try {
      const emailContent = createVerificationEmailTemplate(code);

      const result = await sendEmail({
        to: email,
        subject: 'Email megerősítés - DMA Masterclass',
        html: emailContent,
      });

      if (result.success) {
        logger.info(`Verification email sent to ${email}`);
        return {
          success: true,
          message: 'Elküldtük az email megerősítő kódot',
          codeId: verificationCodeRef.id,
          expiresAt: expiresAt.toISOString()
        };
      } else {
        logger.error('Email send failed:', result.error);
        // Even if email fails, code is stored in Firestore
        return {
          success: true,
          warning: 'Kód generálva, de email küldés sikertelen',
          codeId: verificationCodeRef.id,
          expiresAt: expiresAt.toISOString()
        };
      }
    } catch (emailError: any) {
      logger.error('Email service error:', emailError);
      // Code is still stored, return with warning
      return {
        success: true,
        warning: 'Email szolgáltatás hiba',
        codeId: verificationCodeRef.id,
        code: process.env.NODE_ENV === 'development' ? code : undefined, // Only show code in dev
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
  cors: true,
  region: 'europe-west1',
  invoker: 'public', // Allow allUsers IAM permission for Cloud Run
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

    // Code is valid! Update Firebase Auth user emailVerified flag
    await admin.auth().updateUser(userId, {
      emailVerified: true
    });
    logger.info(`Firebase Auth emailVerified flag updated for user ${userId}`);

    // Update user document in Firestore
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
  cors: true,
  region: 'europe-west1',
  invoker: 'public', // Allow allUsers IAM permission for Cloud Run
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
