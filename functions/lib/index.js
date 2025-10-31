"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveTeam = exports.declineTeamInvite = exports.acceptTeamInvite = exports.inviteTeamMember = exports.seedCategories = exports.getInstructors = exports.getCategories = exports.getSignedUploadUrl = exports.deleteCourse = exports.publishCourse = exports.updateCourse = exports.createCourse = exports.muxWebhook = exports.testVideoUpload = exports.getMuxAssetStatus = exports.getMuxUploadUrl = exports.sendEmployeeReminder = exports.generateCSVReport = exports.getEmployeeProgressDetail = exports.getCompanyDashboard = exports.getCompanyPurchases = exports.purchaseCompanyMasterclass = exports.getCompanyMasterclasses = exports.unassignEmployeeFromMasterclass = exports.assignEmployeeToMasterclass = exports.completeCompanyOnboarding = exports.createCompanyMasterclass = exports.enrollEmployeesInMasterclass = exports.acceptEmployeeInvite = exports.verifyEmployeeInvite = exports.addEmployee = exports.createCompany = exports.respondToSupportTicket = exports.createSupportTicket = exports.getAuditLogStats = exports.getAuditLogs = exports.verifyEmail = exports.enrollInCourse = exports.getCoursesCallable = exports.getCourse = exports.updateUserRole = exports.getStats = exports.getUsers = exports.sendEmailVerification = exports.validateResetToken = exports.resetPassword = exports.requestPasswordReset = exports.firebaseLogin = exports.echo = exports.healthCheck = void 0;
exports.createUserProfile = exports.resendVerificationCode = exports.verifyEmailCode = exports.sendEmailVerificationCode = exports.stripeWebhook = exports.createCustomer = exports.createCheckoutSession = exports.validatePromoCode = exports.deletePromoCode = exports.getPromoCodes = exports.createPromoCode = exports.applyPromoCode = exports.getSubscriptionInvoices = exports.reactivateSubscription = exports.cancelSubscription = exports.getSubscriptionStatus = exports.getTeamMembers = exports.checkSubscriptionAccess = exports.getTeamDashboard = exports.resendTeamInvite = exports.removeTeamMember = void 0;
/**
 * Minimal Firebase Functions for Development
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const nodemailer = __importStar(require("nodemailer"));
const uuid_1 = require("uuid");
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const auth = admin.auth();
const firestore = admin.firestore();
// Email configuration - lazy initialization
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@academion.hu';
let sendGridInitialized = false;
/**
 * Initialize SendGrid (lazy initialization)
 */
function initializeSendGrid() {
    if (!sendGridInitialized) {
        const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
        if (SENDGRID_API_KEY) {
            mail_1.default.setApiKey(SENDGRID_API_KEY);
            sendGridInitialized = true;
            console.log('SendGrid initialized for email sending');
            return true;
        }
        return false;
    }
    return true;
}
// Email transporter configuration
const createTransporter = async () => {
    // Check for Brevo/SendinBlue credentials first (easiest to set up)
    const brevoUser = process.env.BREVO_SMTP_USER;
    const brevoKey = process.env.BREVO_SMTP_KEY;
    if (brevoUser && brevoKey) {
        console.log('Using Brevo/SendinBlue for email sending');
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
    // Check if we have Gmail credentials
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (gmailUser && gmailAppPassword) {
        console.log('Using Gmail for email sending');
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailAppPassword,
            },
        });
    }
    // Fallback to Ethereal Email for development
    console.log('Using Ethereal Email for development (no credentials found)');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};
exports.healthCheck = (0, https_1.onRequest)({
    cors: true,
    region: 'us-central1',
}, (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
exports.echo = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, (request) => {
    return {
        success: true,
        data: request.data,
        timestamp: new Date().toISOString()
    };
});
/**
 * Firebase login - exchange Firebase ID token for user data
 */
exports.firebaseLogin = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { idToken } = request.data;
        if (!idToken) {
            throw new Error('ID token kötelező.');
        }
        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Get user data from Firestore
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            // Create a new user document if it doesn't exist
            const authUser = await auth.getUser(uid);
            const newUserData = {
                id: uid,
                email: authUser.email || '',
                firstName: authUser.displayName?.split(' ')[0] || '',
                lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
                role: 'STUDENT',
                profilePictureUrl: authUser.photoURL || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await firestore.collection('users').doc(uid).set(newUserData);
            return {
                success: true,
                user: newUserData,
                token: idToken
            };
        }
        const userData = userDoc.data();
        if (!userData) {
            throw new Error('Felhasználói adatok nem találhatók.');
        }
        return {
            success: true,
            user: {
                id: uid,
                email: userData.email || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                role: userData.role || 'STUDENT',
                profilePictureUrl: userData.profilePictureUrl || null,
                bio: userData.bio || null,
                title: userData.title || null,
                institution: userData.institution || null,
                createdAt: userData.createdAt || null,
                updatedAt: userData.updatedAt || null,
            },
            token: idToken
        };
    }
    catch (error) {
        v2_1.logger.error('Firebase login error:', error);
        throw new Error(error.message || 'Bejelentkezési hiba történt.');
    }
});
/**
 * Request password reset - sends email with reset link
 */
exports.requestPasswordReset = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { email } = request.data;
        if (!email) {
            throw new Error('Email cím kötelező.');
        }
        // Rate limiting: Check password reset attempts in the last hour
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        const recentAttempts = await firestore
            .collection('passwordResetAttempts')
            .where('email', '==', email.toLowerCase())
            .where('attemptedAt', '>=', oneHourAgo.toISOString())
            .get();
        if (recentAttempts.size >= 3) {
            v2_1.logger.warn(`Rate limit exceeded for email: ${email}`);
            throw new Error('Túl sok jelszó visszaállítási kérés. Kérjük, próbálja újra 1 óra múlva.');
        }
        // Log this attempt
        await firestore.collection('passwordResetAttempts').add({
            email: email.toLowerCase(),
            attemptedAt: new Date().toISOString(),
            ipAddress: request.rawRequest?.ip || 'unknown'
        });
        // Check if user exists
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        }
        catch (error) {
            // Don't reveal if email exists or not for security
            return {
                success: true,
                message: 'Ha a megadott email cím regisztrálva van, küldtünk egy jelszó-visszaállítási linket.'
            };
        }
        // Generate reset token
        const resetToken = (0, uuid_1.v4)();
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 1); // Token expires in 1 hour
        // Store reset token in Firestore
        await firestore.collection('passwordResets').doc(resetToken).set({
            userId: userRecord.uid,
            email: email,
            createdAt: new Date().toISOString(),
            expiresAt: resetExpiry.toISOString(),
            used: false
        });
        // Prepare reset link
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
        // World-class HTML email template matching DMA brand
        const htmlContent = `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Jelszó visszaállítás - DMA Platform</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 16px 0 rgba(16, 23, 42, 0.08); max-width: 600px; width: 100%;">

          <!-- Header with DMA Navy brand color -->
          <tr>
            <td style="background-color: #2C3E54; padding: 40px 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                DMA Platform
              </h1>
              <p style="margin: 8px 0 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">
                Jelszó visszaállítás
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 32px;">

              <!-- Greeting -->
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Kedves Felhasználó!
              </h2>

              <!-- Message -->
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Jelszó visszaállítási kérelmet kaptunk az Ön <strong>DMA Platform</strong> fiókjához.
              </p>

              <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                A jelszó visszaállításához kattintson az alábbi gombra:
              </p>

              <!-- CTA Button with blue gradient -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(to top, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); letter-spacing: 0.3px;">
                      Új jelszó beállítása
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <div style="background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; color: #1E40AF; font-size: 14px; font-weight: 600;">
                  Vagy másold be ezt a linket a böngészőbe:
                </p>
                <p style="margin: 0; color: #1E40AF; font-size: 13px; word-break: break-all; line-height: 1.5;">
                  ${resetLink}
                </p>
              </div>

              <!-- Security info -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.5;">
                  <strong>⏱️ Fontos:</strong> Ez a link <strong>1 óráig</strong> érvényes biztonsági okokból.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Ha nem Ön kérte a jelszó visszaállítást, kérjük hagyja figyelmen kívül ezt az emailt. Fiókja biztonságban van.
              </p>

              <!-- Signature -->
              <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Üdvözlettel,<br>
                <strong style="color: #2C3E54;">A DMA Platform csapata</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; line-height: 1.5;">
                Ez egy automatikus üzenet, kérjük ne válaszoljon rá.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © 2025 DMA Platform. Minden jog fenntartva.
              </p>
            </td>
          </tr>

        </table>

        <!-- Spacer for email clients -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 20px 32px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">
                Ha problémád van a gombbal, másold be a fenti linket a böngésződbe.
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
        // Try SendGrid first if available
        if (initializeSendGrid()) {
            try {
                const msg = {
                    to: email,
                    from: FROM_EMAIL,
                    subject: 'Jelszó visszaállítás - DMA Platform',
                    html: htmlContent,
                };
                await mail_1.default.send(msg);
                v2_1.logger.info('Email sent via SendGrid to:', email);
                return {
                    success: true,
                    message: 'Ha a megadott email cím regisztrálva van, küldtünk egy jelszó visszaállítási linket.'
                };
            }
            catch (error) {
                v2_1.logger.error('SendGrid error, falling back to SMTP:', error);
            }
        }
        // Use nodemailer (Brevo, Gmail, or Ethereal)
        const transporter = await createTransporter();
        const fromEmail = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@dma.hu';
        const mailOptions = {
            from: `"DMA Platform" <${fromEmail}>`,
            to: email,
            subject: 'Jelszó visszaállítás - DMA Platform',
            html: htmlContent
        };
        const info = await transporter.sendMail(mailOptions);
        // For development, log the preview URL
        v2_1.logger.info('Email sent:', {
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info)
        });
        return {
            success: true,
            message: 'Ha a megadott email cím regisztrálva van, küldtünk egy jelszó-visszaállítási linket.',
            // In development, return the preview URL
            previewUrl: nodemailer.getTestMessageUrl(info)
        };
    }
    catch (error) {
        v2_1.logger.error('Password reset request error:', error);
        throw new Error(error.message || 'Hiba történt a jelszó visszaállítási kérelem során.');
    }
});
/**
 * Reset password with token
 */
exports.resetPassword = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { token, newPassword } = request.data;
        if (!token || !newPassword) {
            throw new Error('Token és új jelszó kötelező.');
        }
        if (newPassword.length < 6) {
            throw new Error('A jelszónak legalább 6 karakternek kell lennie.');
        }
        // Get reset token from Firestore
        const resetDoc = await firestore.collection('passwordResets').doc(token).get();
        if (!resetDoc.exists) {
            throw new Error('Érvénytelen vagy lejárt token.');
        }
        const resetData = resetDoc.data();
        if (!resetData) {
            throw new Error('Érvénytelen token adat.');
        }
        // Check if token is already used
        if (resetData.used) {
            throw new Error('Ez a token már fel lett használva.');
        }
        // Check if token is expired
        const expiresAt = new Date(resetData.expiresAt);
        if (expiresAt < new Date()) {
            throw new Error('A token lejárt.');
        }
        // Update user password
        await auth.updateUser(resetData.userId, {
            password: newPassword
        });
        // Mark token as used
        await firestore.collection('passwordResets').doc(token).update({
            used: true,
            usedAt: new Date().toISOString()
        });
        return {
            success: true,
            message: 'A jelszó sikeresen megváltozott.'
        };
    }
    catch (error) {
        v2_1.logger.error('Password reset error:', error);
        throw new Error(error.message || 'Hiba történt a jelszó visszaállítása során.');
    }
});
/**
 * Validate reset token
 */
exports.validateResetToken = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { token } = request.data;
        if (!token) {
            throw new Error('Token kötelező.');
        }
        // Get reset token from Firestore
        const resetDoc = await firestore.collection('passwordResets').doc(token).get();
        if (!resetDoc.exists) {
            return {
                success: false,
                valid: false,
                message: 'Érvénytelen token.'
            };
        }
        const resetData = resetDoc.data();
        if (!resetData) {
            return {
                success: false,
                valid: false,
                message: 'Érvénytelen token adat.'
            };
        }
        // Check if token is already used
        if (resetData.used) {
            return {
                success: false,
                valid: false,
                message: 'Ez a token már fel lett használva.'
            };
        }
        // Check if token is expired
        const expiresAt = new Date(resetData.expiresAt);
        if (expiresAt < new Date()) {
            return {
                success: false,
                valid: false,
                message: 'A token lejárt.'
            };
        }
        return {
            success: true,
            valid: true,
            email: resetData.email,
            message: 'Token érvényes.'
        };
    }
    catch (error) {
        v2_1.logger.error('Token validation error:', error);
        return {
            success: false,
            valid: false,
            message: error.message || 'Hiba történt a token ellenőrzése során.'
        };
    }
});
/**
 * Send email verification
 */
exports.sendEmailVerification = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { email, userId } = request.data;
        if (!email || !userId) {
            throw new Error('Email és userId kötelező.');
        }
        // Generate verification token
        const verificationToken = (0, uuid_1.v4)();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours
        // Store verification token in Firestore
        await firestore.collection('emailVerifications').doc(verificationToken).set({
            userId: userId,
            email: email,
            createdAt: new Date().toISOString(),
            expiresAt: tokenExpiry.toISOString(),
            used: false
        });
        // Prepare verification link
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
        // World-class HTML email template matching DMA brand
        const htmlContent = `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email cím megerősítése - DMA Platform</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 16px 0 rgba(16, 23, 42, 0.08); max-width: 600px; width: 100%;">

          <!-- Header with DMA Navy brand color -->
          <tr>
            <td style="background-color: #2C3E54; padding: 40px 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                DMA Platform
              </h1>
              <p style="margin: 8px 0 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">
                Email cím megerősítése
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 32px;">

              <!-- Greeting -->
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Üdvözöljük a DMA Platformon!
              </h2>

              <!-- Message -->
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Köszönjük, hogy csatlakozott hozzánk! Már csak egy lépés van hátra.
              </p>

              <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Kérjük, erősítse meg az email címét az alábbi gombra kattintva:
              </p>

              <!-- CTA Button with blue gradient -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(to top, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); letter-spacing: 0.3px;">
                      Email cím megerősítése
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <div style="background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; color: #1E40AF; font-size: 14px; font-weight: 600;">
                  Vagy másold be ezt a linket a böngészőbe:
                </p>
                <p style="margin: 0; color: #1E40AF; font-size: 13px; word-break: break-all; line-height: 1.5;">
                  ${verificationLink}
                </p>
              </div>

              <!-- Expiry info -->
              <div style="background-color: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #0C4A6E; font-size: 14px; line-height: 1.5;">
                  <strong>✨ Info:</strong> Ez a megerősítő link <strong>24 óráig</strong> érvényes.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Ha nem Ön regisztrált a DMA platformon, kérjük hagyja figyelmen kívül ezt az emailt.
              </p>

              <!-- Signature -->
              <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Üdvözlettel,<br>
                <strong style="color: #2C3E54;">A DMA Platform csapata</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; line-height: 1.5;">
                Ez egy automatikus üzenet, kérjük ne válaszoljon rá.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © 2025 DMA Platform. Minden jog fenntartva.
              </p>
            </td>
          </tr>

        </table>

        <!-- Spacer for email clients -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 20px 32px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">
                Ha problémád van a gombbal, másold be a fenti linket a böngésződbe.
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
        // Try SendGrid first if available
        if (initializeSendGrid()) {
            try {
                const msg = {
                    to: email,
                    from: FROM_EMAIL,
                    subject: 'Email cím megerősítése - Academion',
                    html: htmlContent,
                };
                await mail_1.default.send(msg);
                v2_1.logger.info('Verification email sent via SendGrid to:', email);
                return {
                    success: true,
                    message: 'Megerősítő email elküldve.'
                };
            }
            catch (error) {
                v2_1.logger.error('SendGrid error, falling back to SMTP:', error);
            }
        }
        // Use nodemailer (Brevo, Gmail, or Ethereal)
        const transporter = await createTransporter();
        const fromEmail = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@dma.hu';
        const mailOptions = {
            from: `"DMA Platform" <${fromEmail}>`,
            to: email,
            subject: 'Email cím megerősítése - DMA',
            html: htmlContent
        };
        const info = await transporter.sendMail(mailOptions);
        v2_1.logger.info('Verification email sent:', {
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info)
        });
        return {
            success: true,
            message: 'Megerősítő email elküldve.',
            previewUrl: nodemailer.getTestMessageUrl(info)
        };
    }
    catch (error) {
        v2_1.logger.error('Send verification email error:', error);
        throw new Error(error.message || 'Hiba történt az email küldése során.');
    }
});
/**
 * Get all users (Admin only)
 */
exports.getUsers = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Check if user is admin
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        // Get requesting user data to check if admin
        const requestingUserDoc = await firestore.collection('users').doc(request.auth.uid).get();
        const requestingUserData = requestingUserDoc.data();
        if (!requestingUserData || requestingUserData.role !== 'ADMIN') {
            throw new Error('Adminisztrátori jogosultság szükséges.');
        }
        // Get all users from Firestore
        const usersSnapshot = await firestore.collection('users').get();
        const users = [];
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                email: userData.email || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                role: userData.role || 'STUDENT',
                createdAt: userData.createdAt || new Date().toISOString(),
                lastLoginAt: userData.lastLoginAt || null,
                isActive: userData.isActive !== false, // Default to true
                profilePictureUrl: userData.profilePictureUrl || null,
                emailVerified: userData.emailVerified || false,
                institution: userData.institution || null,
                bio: userData.bio || null,
            });
        });
        // Sort by creation date (newest first)
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
            success: true,
            users: users
        };
    }
    catch (error) {
        v2_1.logger.error('Get users error:', error);
        throw new Error(error.message || 'Hiba történt a felhasználók lekérdezése során.');
    }
});
/**
 * Get platform statistics (Admin only)
 */
exports.getStats = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Check if user is admin
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        // Get requesting user data to check if admin
        const requestingUserDoc = await firestore.collection('users').doc(request.auth.uid).get();
        const requestingUserData = requestingUserDoc.data();
        if (!requestingUserData || requestingUserData.role !== 'ADMIN') {
            throw new Error('Adminisztrátori jogosultság szükséges.');
        }
        // Get all users from Firestore for statistics
        const usersSnapshot = await firestore.collection('users').get();
        let totalUsers = 0;
        let activeUsers = 0;
        let students = 0;
        let instructors = 0;
        let admins = 0;
        let newUsersThisMonth = 0;
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            totalUsers++;
            // Count by role
            if (userData.role === 'STUDENT')
                students++;
            else if (userData.role === 'INSTRUCTOR')
                instructors++;
            else if (userData.role === 'ADMIN')
                admins++;
            // Count active users (logged in within last 30 days)
            if (userData.lastLoginAt) {
                const lastLogin = new Date(userData.lastLoginAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                if (lastLogin > thirtyDaysAgo) {
                    activeUsers++;
                }
            }
            // Count new users this month
            if (userData.createdAt) {
                const createdDate = new Date(userData.createdAt);
                if (createdDate >= thisMonthStart) {
                    newUsersThisMonth++;
                }
            }
        });
        // Get courses count
        const coursesSnapshot = await firestore.collection('courses').get();
        const courseCount = coursesSnapshot.size;
        return {
            success: true,
            stats: {
                userCount: totalUsers,
                activeUsers: activeUsers,
                newUsersThisMonth: newUsersThisMonth,
                students: students,
                instructors: instructors,
                admins: admins,
                courseCount: courseCount,
            }
        };
    }
    catch (error) {
        v2_1.logger.error('Get stats error:', error);
        throw new Error(error.message || 'Hiba történt a statisztikák lekérdezése során.');
    }
});
/**
 * Update user role (Admin only)
 */
exports.updateUserRole = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { userId, role } = request.data;
        if (!userId || !role) {
            throw new Error('UserId és role kötelező.');
        }
        // Check if user is admin
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        // Get requesting user data to check if admin
        const requestingUserDoc = await firestore.collection('users').doc(request.auth.uid).get();
        const requestingUserData = requestingUserDoc.data();
        if (!requestingUserData || requestingUserData.role !== 'ADMIN') {
            throw new Error('Adminisztrátori jogosultság szükséges.');
        }
        // Validate role
        if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
            throw new Error('Érvénytelen szerepkör.');
        }
        // Update user role in Firestore
        await firestore.collection('users').doc(userId).update({
            role: role,
            updatedAt: new Date().toISOString()
        });
        v2_1.logger.info(`User role updated: ${userId} -> ${role}`);
        return {
            success: true,
            message: 'Felhasználói szerepkör sikeresen frissítve.'
        };
    }
    catch (error) {
        v2_1.logger.error('Update user role error:', error);
        throw new Error(error.message || 'Hiba történt a szerepkör frissítése során.');
    }
});
/**
 * Get course by ID or slug
 */
exports.getCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { courseId: inputCourseId } = request.data || {};
        let courseId = inputCourseId;
        v2_1.logger.info('[getCourse] Called with courseId:', courseId);
        if (!courseId) {
            throw new Error('Kurzus azonosító kötelező');
        }
        // Attempt to fetch by ID
        let courseDoc = await firestore.collection('courses').doc(courseId).get();
        // Fallback: if not found, query by slug field
        if (!courseDoc.exists) {
            v2_1.logger.info('[getCourse] Trying slug fallback for:', courseId);
            const slugQuery = await firestore
                .collection('courses')
                .where('slug', '==', courseId)
                .limit(1)
                .get();
            if (!slugQuery.empty) {
                courseDoc = slugQuery.docs[0];
                courseId = courseDoc.id;
                v2_1.logger.info('[getCourse] Found by slug, using document ID:', courseId);
            }
            else {
                v2_1.logger.error('[getCourse] Course not found by ID or slug:', courseId);
                throw new Error('Kurzus nem található');
            }
        }
        const courseData = courseDoc.data();
        // Get instructor data
        let instructor = null;
        if (courseData?.instructorId) {
            const instructorDoc = await firestore.collection('users').doc(courseData.instructorId).get();
            if (instructorDoc.exists) {
                const instructorData = instructorDoc.data();
                instructor = {
                    id: instructorDoc.id,
                    firstName: instructorData?.firstName || 'Ismeretlen',
                    lastName: instructorData?.lastName || 'Oktató',
                    title: instructorData?.title || null,
                    bio: instructorData?.bio || null,
                    profilePictureUrl: instructorData?.profilePictureUrl || null,
                };
            }
        }
        // Get category data
        let category = null;
        if (courseData?.categoryId) {
            const categoryDoc = await firestore.collection('categories').doc(courseData.categoryId).get();
            if (categoryDoc.exists) {
                const categoryData = categoryDoc.data();
                category = {
                    id: categoryDoc.id,
                    name: categoryData?.name || 'Ismeretlen kategória',
                };
            }
        }
        // Get modules and lessons
        let modules = [];
        try {
            const modulesSnapshot = await firestore
                .collection('courses')
                .doc(courseId)
                .collection('modules')
                .orderBy('order', 'asc')
                .get();
            for (const moduleDoc of modulesSnapshot.docs) {
                const moduleData = moduleDoc.data();
                // Get lessons for this module
                const lessonsSnapshot = await firestore
                    .collection('courses')
                    .doc(courseId)
                    .collection('modules')
                    .doc(moduleDoc.id)
                    .collection('lessons')
                    .orderBy('order', 'asc')
                    .get();
                const lessons = lessonsSnapshot.docs.map(lessonDoc => ({
                    id: lessonDoc.id,
                    ...lessonDoc.data()
                }));
                modules.push({
                    id: moduleDoc.id,
                    ...moduleData,
                    lessons
                });
            }
        }
        catch (error) {
            v2_1.logger.warn('[getCourse] Error loading modules:', error);
            // Continue without modules
        }
        // Build course object
        const course = {
            id: courseDoc.id,
            ...courseData,
            instructor,
            category,
            modules
        };
        v2_1.logger.info('[getCourse] Successfully returning course:', courseData?.title || 'Unknown');
        return {
            success: true,
            course
        };
    }
    catch (error) {
        v2_1.logger.error('[getCourse] Error:', error);
        return {
            success: false,
            error: error.message || 'Kurzus betöltése sikertelen'
        };
    }
});
/**
 * Get all courses with optional filters
 */
exports.getCoursesCallable = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[getCoursesCallable] Called');
        // Simple query - get all courses
        const snapshot = await firestore.collection('courses').get();
        const courses = [];
        for (const doc of snapshot.docs) {
            const courseData = doc.data();
            // Get instructor data
            let instructor = null;
            if (courseData?.instructorId) {
                const instructorDoc = await firestore.collection('users').doc(courseData.instructorId).get();
                if (instructorDoc.exists) {
                    const instructorData = instructorDoc.data();
                    instructor = {
                        id: instructorDoc.id,
                        firstName: instructorData?.firstName || 'Ismeretlen',
                        lastName: instructorData?.lastName || 'Oktató',
                        profilePictureUrl: instructorData?.profilePictureUrl || null,
                    };
                }
            }
            // Get category data
            let category = null;
            if (courseData?.categoryId) {
                const categoryDoc = await firestore.collection('categories').doc(courseData.categoryId).get();
                if (categoryDoc.exists) {
                    const categoryData = categoryDoc.data();
                    category = {
                        id: categoryDoc.id,
                        name: categoryData?.name || 'Ismeretlen kategória',
                    };
                }
            }
            courses.push({
                id: doc.id,
                ...courseData,
                instructor,
                category
            });
        }
        v2_1.logger.info(`[getCoursesCallable] Found ${courses.length} courses`);
        return {
            success: true,
            courses,
            total: courses.length
        };
    }
    catch (error) {
        v2_1.logger.error('[getCoursesCallable] Error:', error);
        return {
            success: false,
            error: error.message || 'Ismeretlen hiba történt'
        };
    }
});
/**
 * Enroll in course (free enrollment)
 */
exports.enrollInCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { courseId } = request.data || {};
        if (!courseId) {
            throw new Error('Kurzus azonosító kötelező');
        }
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges a kurzusra való feliratkozáshoz');
        }
        const userId = request.auth.uid;
        // Check if course exists
        const courseDoc = await firestore.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) {
            throw new Error('Kurzus nem található');
        }
        // Check if already enrolled
        const enrollmentId = `${userId}_${courseId}`;
        const existingEnrollment = await firestore.collection('enrollments').doc(enrollmentId).get();
        if (existingEnrollment.exists) {
            return {
                success: true,
                message: 'Már beiratkozott erre a kurzusra',
                enrollmentId,
                alreadyEnrolled: true
            };
        }
        // Create enrollment
        const enrollmentData = {
            userId,
            courseId,
            enrolledAt: new Date().toISOString(),
            progress: 0,
            status: 'ACTIVE',
            completedLessons: [],
            lastAccessedAt: new Date().toISOString()
        };
        await firestore.collection('enrollments').doc(enrollmentId).set(enrollmentData);
        // Update course enrollment count
        await firestore.collection('courses').doc(courseId).update({
            enrollmentCount: admin.firestore.FieldValue.increment(1)
        });
        v2_1.logger.info(`User ${userId} enrolled in course ${courseId}`);
        return {
            success: true,
            message: 'Sikeres beiratkozás!',
            enrollmentId,
            courseId,
            userId,
            alreadyEnrolled: false
        };
    }
    catch (error) {
        v2_1.logger.error('[enrollInCourse] Error:', error);
        throw new Error(error.message || 'Beiratkozás sikertelen');
    }
});
/**
 * Verify email with token
 */
exports.verifyEmail = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { token } = request.data;
        if (!token) {
            throw new Error('Token kötelező.');
        }
        // Get verification token from Firestore
        const verificationDoc = await firestore.collection('emailVerifications').doc(token).get();
        if (!verificationDoc.exists) {
            throw new Error('Érvénytelen vagy lejárt token.');
        }
        const verificationData = verificationDoc.data();
        if (!verificationData) {
            throw new Error('Érvénytelen token adat.');
        }
        // Check if token is already used - if yes, still return success
        if (verificationData.used) {
            // Check if user is already verified
            const userDoc = await firestore.collection('users').doc(verificationData.userId).get();
            const userData = userDoc.data();
            if (userData && userData.emailVerified === true) {
                // Already verified, return success
                return {
                    success: true,
                    message: 'Az email cím már meg volt erősítve.',
                    alreadyVerified: true
                };
            }
            throw new Error('Ez a token már fel lett használva.');
        }
        // Check if token is expired
        const expiresAt = new Date(verificationData.expiresAt);
        if (expiresAt < new Date()) {
            throw new Error('A token lejárt.');
        }
        // Update user's emailVerified status in Firestore
        await firestore.collection('users').doc(verificationData.userId).update({
            emailVerified: true,
            emailVerifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        // Mark token as used
        await firestore.collection('emailVerifications').doc(token).update({
            used: true,
            usedAt: new Date().toISOString()
        });
        return {
            success: true,
            message: 'Az email cím sikeresen megerősítve.',
            alreadyVerified: false
        };
    }
    catch (error) {
        v2_1.logger.error('Email verification error:', error);
        throw new Error(error.message || 'Hiba történt az email megerősítése során.');
    }
});
// Export audit log functions
var auditLog_1 = require("./auditLog");
Object.defineProperty(exports, "getAuditLogs", { enumerable: true, get: function () { return auditLog_1.getAuditLogs; } });
Object.defineProperty(exports, "getAuditLogStats", { enumerable: true, get: function () { return auditLog_1.getAuditLogStats; } });
// Export support functions
var support_1 = require("./support");
Object.defineProperty(exports, "createSupportTicket", { enumerable: true, get: function () { return support_1.createSupportTicket; } });
Object.defineProperty(exports, "respondToSupportTicket", { enumerable: true, get: function () { return support_1.respondToSupportTicket; } });
// Export Company Admin Dashboard functions
var createCompany_1 = require("./company/createCompany");
Object.defineProperty(exports, "createCompany", { enumerable: true, get: function () { return createCompany_1.createCompany; } });
var employeeInvite_1 = require("./company/employeeInvite");
Object.defineProperty(exports, "addEmployee", { enumerable: true, get: function () { return employeeInvite_1.addEmployee; } });
Object.defineProperty(exports, "verifyEmployeeInvite", { enumerable: true, get: function () { return employeeInvite_1.verifyEmployeeInvite; } });
Object.defineProperty(exports, "acceptEmployeeInvite", { enumerable: true, get: function () { return employeeInvite_1.acceptEmployeeInvite; } });
var enrollEmployees_1 = require("./company/enrollEmployees");
Object.defineProperty(exports, "enrollEmployeesInMasterclass", { enumerable: true, get: function () { return enrollEmployees_1.enrollEmployeesInMasterclass; } });
var createMasterclass_1 = require("./company/createMasterclass");
Object.defineProperty(exports, "createCompanyMasterclass", { enumerable: true, get: function () { return createMasterclass_1.createCompanyMasterclass; } });
var completeOnboarding_1 = require("./company/completeOnboarding");
Object.defineProperty(exports, "completeCompanyOnboarding", { enumerable: true, get: function () { return completeOnboarding_1.completeCompanyOnboarding; } });
var masterclassEnrollment_1 = require("./company/masterclassEnrollment");
Object.defineProperty(exports, "assignEmployeeToMasterclass", { enumerable: true, get: function () { return masterclassEnrollment_1.assignEmployeeToMasterclass; } });
Object.defineProperty(exports, "unassignEmployeeFromMasterclass", { enumerable: true, get: function () { return masterclassEnrollment_1.unassignEmployeeFromMasterclass; } });
Object.defineProperty(exports, "getCompanyMasterclasses", { enumerable: true, get: function () { return masterclassEnrollment_1.getCompanyMasterclasses; } });
var purchaseMasterclass_1 = require("./company/purchaseMasterclass");
Object.defineProperty(exports, "purchaseCompanyMasterclass", { enumerable: true, get: function () { return purchaseMasterclass_1.purchaseCompanyMasterclass; } });
Object.defineProperty(exports, "getCompanyPurchases", { enumerable: true, get: function () { return purchaseMasterclass_1.getCompanyPurchases; } });
var progressTracking_1 = require("./company/progressTracking");
Object.defineProperty(exports, "getCompanyDashboard", { enumerable: true, get: function () { return progressTracking_1.getCompanyDashboard; } });
Object.defineProperty(exports, "getEmployeeProgressDetail", { enumerable: true, get: function () { return progressTracking_1.getEmployeeProgressDetail; } });
var generateCSVReport_1 = require("./company/generateCSVReport");
Object.defineProperty(exports, "generateCSVReport", { enumerable: true, get: function () { return generateCSVReport_1.generateCSVReport; } });
var sendReminder_1 = require("./company/sendReminder");
Object.defineProperty(exports, "sendEmployeeReminder", { enumerable: true, get: function () { return sendReminder_1.sendEmployeeReminder; } });
// Export Mux video functions
var muxActions_1 = require("./muxActions");
Object.defineProperty(exports, "getMuxUploadUrl", { enumerable: true, get: function () { return muxActions_1.getMuxUploadUrl; } });
Object.defineProperty(exports, "getMuxAssetStatus", { enumerable: true, get: function () { return muxActions_1.getMuxAssetStatus; } });
Object.defineProperty(exports, "testVideoUpload", { enumerable: true, get: function () { return muxActions_1.testVideoUpload; } });
var muxWebhook_1 = require("./muxWebhook");
Object.defineProperty(exports, "muxWebhook", { enumerable: true, get: function () { return muxWebhook_1.muxWebhook; } });
// Export course management functions
var courseManagement_1 = require("./courseManagement");
Object.defineProperty(exports, "createCourse", { enumerable: true, get: function () { return courseManagement_1.createCourse; } });
Object.defineProperty(exports, "updateCourse", { enumerable: true, get: function () { return courseManagement_1.updateCourse; } });
Object.defineProperty(exports, "publishCourse", { enumerable: true, get: function () { return courseManagement_1.publishCourse; } });
Object.defineProperty(exports, "deleteCourse", { enumerable: true, get: function () { return courseManagement_1.deleteCourse; } });
// Export file actions
var fileActions_1 = require("./fileActions");
Object.defineProperty(exports, "getSignedUploadUrl", { enumerable: true, get: function () { return fileActions_1.getSignedUploadUrl; } });
/**
 * Get all categories
 * Auto-creates default categories if none exist
 */
exports.getCategories = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[getCategories] Called');
        let snapshot = await firestore.collection('categories').orderBy('name', 'asc').get();
        // If no categories exist, create default ones
        if (snapshot.empty) {
            v2_1.logger.info('[getCategories] No categories found, creating defaults...');
            const defaultCategories = [
                { name: 'Üzleti és Menedzsment', slug: 'uzleti-es-menedzsment', description: 'Üzleti vezetés, stratégia, projektmenedzsment', icon: '💼', order: 1, active: true },
                { name: 'Marketing és Értékesítés', slug: 'marketing-es-ertekesites', description: 'Digitális marketing, közösségi média, értékesítési technikák', icon: '📈', order: 2, active: true },
                { name: 'Programozás és Fejlesztés', slug: 'programozas-es-fejlesztes', description: 'Webfejlesztés, mobilappok, szoftverfejlesztés', icon: '💻', order: 3, active: true },
                { name: 'Design és Kreativitás', slug: 'design-es-kreativitas', description: 'Grafikai tervezés, UX/UI, kreatív alkotás', icon: '🎨', order: 4, active: true },
                { name: 'Személyes Fejlődés', slug: 'szemelyes-fejlodes', description: 'Önismeret, kommunikáció, produktivitás', icon: '🌱', order: 5, active: true },
                { name: 'Pénzügyek és Befektetés', slug: 'penzugyek-es-befektetes', description: 'Befektetés, vagyonkezelés, pénzügyi tervezés', icon: '💰', order: 6, active: true },
                { name: 'Egészség és Wellness', slug: 'egeszseg-es-wellness', description: 'Fitness, táplálkozás, mentális egészség', icon: '💪', order: 7, active: true },
                { name: 'Nyelvek', slug: 'nyelvek', description: 'Nyelvtanulás, kommunikáció idegen nyelveken', icon: '🌍', order: 8, active: true },
                { name: 'Jog és Compliance', slug: 'jog-es-compliance', description: 'Jogszabályok, adatvédelem, megfelelőség', icon: '⚖️', order: 9, active: true },
                { name: 'Data Science és AI', slug: 'data-science-es-ai', description: 'Adatelemzés, gépi tanulás, mesterséges intelligencia', icon: '🤖', order: 10, active: true },
                { name: 'HR és Toborzás', slug: 'hr-es-toborzas', description: 'Emberi erőforrás menedzsment, toborzás, onboarding', icon: '👥', order: 11, active: true },
                { name: 'Fotózás és Videózás', slug: 'fotozas-es-videozas', description: 'Fotográfia, videókészítés, vágás', icon: '📸', order: 12, active: true }
            ];
            const batch = firestore.batch();
            for (const category of defaultCategories) {
                const docRef = firestore.collection('categories').doc();
                batch.set(docRef, {
                    ...category,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            await batch.commit();
            v2_1.logger.info('[getCategories] Created 12 default categories');
            // Re-fetch categories
            snapshot = await firestore.collection('categories').orderBy('name', 'asc').get();
        }
        const categories = [];
        snapshot.forEach(doc => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        v2_1.logger.info(`[getCategories] Returning ${categories.length} categories`);
        return {
            success: true,
            categories
        };
    }
    catch (error) {
        v2_1.logger.error('[getCategories] Error:', error);
        return {
            success: false,
            error: error.message || 'Kategóriák betöltése sikertelen'
        };
    }
});
/**
 * Get all instructors (ADMIN/INSTRUCTOR only)
 */
exports.getInstructors = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[getInstructors] Called');
        // Check authentication
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        // Check if user has permission (ADMIN or INSTRUCTOR)
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData || !['ADMIN', 'INSTRUCTOR'].includes(userData.role)) {
            throw new Error('Nincs jogosultságod az oktatók listázásához');
        }
        // Get all users with INSTRUCTOR or ADMIN role
        const snapshot = await firestore
            .collection('users')
            .where('role', 'in', ['INSTRUCTOR', 'ADMIN'])
            .get();
        const instructors = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            instructors.push({
                id: doc.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                profilePictureUrl: data.profilePictureUrl || null,
                title: data.title || null,
                bio: data.bio || null,
            });
        });
        v2_1.logger.info(`[getInstructors] Found ${instructors.length} instructors`);
        return {
            success: true,
            instructors
        };
    }
    catch (error) {
        v2_1.logger.error('[getInstructors] Error:', error);
        return {
            success: false,
            error: error.message || 'Oktatók betöltése sikertelen'
        };
    }
});
/**
 * Seed default categories (ADMIN only)
 */
exports.seedCategories = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[seedCategories] Called');
        // Check authentication
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges');
        }
        // Check if user is ADMIN
        const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
        const userData = userDoc.data();
        if (!userData || userData.role !== 'ADMIN') {
            throw new Error('Csak ADMIN futtathatja ezt a funkciót');
        }
        const categories = [
            { name: 'Üzleti és Menedzsment', slug: 'uzleti-es-menedzsment', description: 'Üzleti vezetés, stratégia, projektmenedzsment', icon: '💼', order: 1 },
            { name: 'Marketing és Értékesítés', slug: 'marketing-es-ertekesites', description: 'Digitális marketing, közösségi média, értékesítési technikák', icon: '📈', order: 2 },
            { name: 'Programozás és Fejlesztés', slug: 'programozas-es-fejlesztes', description: 'Webfejlesztés, mobilappok, szoftverfejlesztés', icon: '💻', order: 3 },
            { name: 'Design és Kreativitás', slug: 'design-es-kreativitas', description: 'Grafikai tervezés, UX/UI, kreatív alkotás', icon: '🎨', order: 4 },
            { name: 'Személyes Fejlődés', slug: 'szemelyes-fejlodes', description: 'Önismeret, kommunikáció, produktivitás', icon: '🌱', order: 5 },
            { name: 'Pénzügyek és Befektetés', slug: 'penzugyek-es-befektetes', description: 'Befektetés, vagyonkezelés, pénzügyi tervezés', icon: '💰', order: 6 },
            { name: 'Egészség és Wellness', slug: 'egeszseg-es-wellness', description: 'Fitness, táplálkozás, mentális egészség', icon: '💪', order: 7 },
            { name: 'Nyelvek', slug: 'nyelvek', description: 'Nyelvtanulás, kommunikáció idegen nyelveken', icon: '🌍', order: 8 },
            { name: 'Jog és Compliance', slug: 'jog-es-compliance', description: 'Jogszabályok, adatvédelem, megfelelőség', icon: '⚖️', order: 9 },
            { name: 'Data Science és AI', slug: 'data-science-es-ai', description: 'Adatelemzés, gépi tanulás, mesterséges intelligencia', icon: '🤖', order: 10 },
            { name: 'HR és Toborzás', slug: 'hr-es-toborzas', description: 'Emberi erőforrás menedzsment, toborzás, onboarding', icon: '👥', order: 11 },
            { name: 'Fotózás és Videózás', slug: 'fotozas-es-videozas', description: 'Fotográfia, videókészítés, vágás', icon: '📸', order: 12 }
        ];
        let added = 0;
        let skipped = 0;
        for (const category of categories) {
            // Check if exists
            const existing = await firestore.collection('categories')
                .where('slug', '==', category.slug)
                .limit(1)
                .get();
            if (!existing.empty) {
                skipped++;
                continue;
            }
            // Add category
            await firestore.collection('categories').add({
                ...category,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            added++;
        }
        v2_1.logger.info(`[seedCategories] Added ${added}, skipped ${skipped} categories`);
        return {
            success: true,
            added,
            skipped,
            message: `${added} kategória hozzáadva, ${skipped} már létezett`
        };
    }
    catch (error) {
        v2_1.logger.error('[seedCategories] Error:', error);
        return {
            success: false,
            error: error.message || 'Kategóriák feltöltése sikertelen'
        };
    }
});
// ============================================
// TEAM MANAGEMENT FUNCTIONS
// ============================================
// Export all team management functions
var team_1 = require("./team");
Object.defineProperty(exports, "inviteTeamMember", { enumerable: true, get: function () { return team_1.inviteTeamMember; } });
Object.defineProperty(exports, "acceptTeamInvite", { enumerable: true, get: function () { return team_1.acceptTeamInvite; } });
Object.defineProperty(exports, "declineTeamInvite", { enumerable: true, get: function () { return team_1.declineTeamInvite; } });
Object.defineProperty(exports, "leaveTeam", { enumerable: true, get: function () { return team_1.leaveTeam; } });
Object.defineProperty(exports, "removeTeamMember", { enumerable: true, get: function () { return team_1.removeTeamMember; } });
Object.defineProperty(exports, "resendTeamInvite", { enumerable: true, get: function () { return team_1.resendTeamInvite; } });
Object.defineProperty(exports, "getTeamDashboard", { enumerable: true, get: function () { return team_1.getTeamDashboard; } });
Object.defineProperty(exports, "checkSubscriptionAccess", { enumerable: true, get: function () { return team_1.checkSubscriptionAccess; } });
Object.defineProperty(exports, "getTeamMembers", { enumerable: true, get: function () { return team_1.getTeamMembers; } });
// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================
// Export subscription management functions
var subscription_1 = require("./subscription");
Object.defineProperty(exports, "getSubscriptionStatus", { enumerable: true, get: function () { return subscription_1.getSubscriptionStatus; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return subscription_1.cancelSubscription; } });
Object.defineProperty(exports, "reactivateSubscription", { enumerable: true, get: function () { return subscription_1.reactivateSubscription; } });
Object.defineProperty(exports, "getSubscriptionInvoices", { enumerable: true, get: function () { return subscription_1.getSubscriptionInvoices; } });
Object.defineProperty(exports, "applyPromoCode", { enumerable: true, get: function () { return subscription_1.applyPromoCode; } });
// ============================================
// PROMO CODE MANAGEMENT
// ============================================
// Export promo code management functions
var promoCode_1 = require("./promoCode");
Object.defineProperty(exports, "createPromoCode", { enumerable: true, get: function () { return promoCode_1.createPromoCode; } });
Object.defineProperty(exports, "getPromoCodes", { enumerable: true, get: function () { return promoCode_1.getPromoCodes; } });
Object.defineProperty(exports, "deletePromoCode", { enumerable: true, get: function () { return promoCode_1.deletePromoCode; } });
Object.defineProperty(exports, "validatePromoCode", { enumerable: true, get: function () { return promoCode_1.validatePromoCode; } });
// ============================================
// PAYMENT FUNCTIONS
// ============================================
// Export payment Cloud Functions
var createCheckoutSession_1 = require("./payment/createCheckoutSession");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return createCheckoutSession_1.createCheckoutSession; } });
var createCustomer_1 = require("./payment/createCustomer");
Object.defineProperty(exports, "createCustomer", { enumerable: true, get: function () { return createCustomer_1.createCustomer; } });
// ============================================
// STRIPE WEBHOOK
// ============================================
// Export Stripe webhook handler
var webhook_1 = require("./stripe/webhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return webhook_1.stripeWebhook; } });
// ============================================
// EMAIL VERIFICATION
// ============================================
// Export email verification functions
var emailVerification_1 = require("./emailVerification");
Object.defineProperty(exports, "sendEmailVerificationCode", { enumerable: true, get: function () { return emailVerification_1.sendEmailVerificationCode; } });
Object.defineProperty(exports, "verifyEmailCode", { enumerable: true, get: function () { return emailVerification_1.verifyEmailCode; } });
Object.defineProperty(exports, "resendVerificationCode", { enumerable: true, get: function () { return emailVerification_1.resendVerificationCode; } });
// ============================================
// USER PROFILE
// ============================================
// Export user profile management
var createUserProfile_1 = require("./createUserProfile");
Object.defineProperty(exports, "createUserProfile", { enumerable: true, get: function () { return createUserProfile_1.createUserProfile; } });
//# sourceMappingURL=index.js.map