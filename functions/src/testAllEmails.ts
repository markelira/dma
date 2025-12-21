/**
 * Test All Emails Function
 * Sends all email templates to info@dma.hu for testing
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

// Import all email template functions
import { sendEmail } from './email/emailService';
import { sendWelcomeEmail } from './email/templates/welcome';
import { sendEmployeeWelcomeEmail } from './email/templates/employeeWelcome';
import { sendRegistrationReminder1DayEmail } from './email/templates/registrationReminder1Day';
import { sendRegistrationReminderEmail } from './email/templates/registrationReminder';
import { sendSubscriptionStartedEmail } from './email/templates/subscriptionStarted';
import { sendEmployeeJoinedEmail } from './email/templates/employeeJoined';
import { sendNewContentAvailableEmail } from './email/templates/newContentAvailable';
import { sendInactivityReminderEmail } from './email/templates/inactivityReminder';
import { sendSubscriptionCanceledEmail } from './email/templates/subscriptionCanceled';
import { sendCompanySubscriptionCanceledEmail } from './email/templates/companySubscriptionCanceled';
import { sendNotifyBossEmail } from './email/templates/notifyBossEmail';
import { sendInvitationEmail } from './company/employeeInvite';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createCodeDisplay,
  createAlertBox,
} from './email/templates/base';

const TEST_EMAIL = 'info@dma.hu';
const TEST_FIRST_NAME = 'Teszt';

/**
 * Test all email templates
 * Requires admin authentication
 */
export const testAllEmails = https.onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 120,
    cors: true,
  },
  async (request: CallableRequest) => {
    // Only allow authenticated admin users
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const results: Array<{ email: string; subject: string; success: boolean; error?: string }> = [];

    console.log('🧪 Starting email test - sending all templates to', TEST_EMAIL);

    // 1. Email Verification Code - "Erősítsd meg az e-mail címed"
    try {
      const code = '1234';
      const verificationContent = `
        ${createHeading('Erősítsd meg az email címed', 2)}
        ${createParagraph('A regisztrációd befejezéséhez add meg az alábbi 4 jegyű kódot:')}
        ${createCodeDisplay(code)}
        ${createAlertBox('Ez a kód <strong>15 percig</strong> érvényes.', 'info')}
        ${createParagraph('Ha nem te kezdeményezted ezt a regisztrációt, kérjük hagyd figyelmen kívül ezt az emailt.', { muted: true })}
      `;
      const htmlContent = wrapInBaseTemplate(verificationContent, {
        showUnsubscribe: false,
        preheader: `A megerősítő kódod: ${code}`,
      });

      const result = await sendEmail({
        to: TEST_EMAIL,
        subject: 'Erősítsd meg az e-mail címed - DMA Masterclass',
        html: htmlContent,
      });
      results.push({ email: '1. Verification', subject: 'Erősítsd meg az e-mail címed', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '1. Verification', subject: 'Erősítsd meg az e-mail címed', success: false, error: error.message });
    }

    // 2. Welcome Email (Boss) - "Üdv a Struktúraépítők között"
    try {
      const result = await sendWelcomeEmail({
        firstName: TEST_FIRST_NAME,
        email: TEST_EMAIL,
      });
      results.push({ email: '2. Welcome (Boss)', subject: 'Üdv a Struktúraépítők között', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '2. Welcome (Boss)', subject: 'Üdv a Struktúraépítők között', success: false, error: error.message });
    }

    // 3. Welcome Email (Employee) - "Üdv a Struktúraépítők között"
    try {
      const result = await sendEmployeeWelcomeEmail({
        firstName: TEST_FIRST_NAME,
        email: TEST_EMAIL,
        companyName: 'Teszt Cég Kft.',
      });
      results.push({ email: '3. Welcome (Employee)', subject: 'Üdv a Struktúraépítők között', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '3. Welcome (Employee)', subject: 'Üdv a Struktúraépítők között', success: false, error: error.message });
    }

    // 4. Registration Reminder 1 Day - "RE: Üdv a Struktúraépítők között"
    try {
      const result = await sendRegistrationReminder1DayEmail({
        email: TEST_EMAIL,
      });
      results.push({ email: '4. Reminder 1-Day', subject: 'RE: Üdv a Struktúraépítők között', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '4. Reminder 1-Day', subject: 'RE: Üdv a Struktúraépítők között', success: false, error: error.message });
    }

    // 5. Registration Reminder 7 Days - "7 nap telt el, és kezdünk aggódni"
    try {
      const result = await sendRegistrationReminderEmail({
        email: TEST_EMAIL,
      });
      results.push({ email: '5. Reminder 7-Day', subject: '7 nap telt el, és kezdünk aggódni', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '5. Reminder 7-Day', subject: '7 nap telt el, és kezdünk aggódni', success: false, error: error.message });
    }

    // 6. Subscription Started - "Sikeres fizetés"
    try {
      const result = await sendSubscriptionStartedEmail({
        firstName: TEST_FIRST_NAME,
        email: TEST_EMAIL,
        planName: 'Struktúraépítő Előfizetés',
        isTrialing: false,
      });
      results.push({ email: '6. Subscription Started', subject: 'Sikeres fizetés', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '6. Subscription Started', subject: 'Sikeres fizetés', success: false, error: error.message });
    }

    // 7. Employee Invite - "Meghívód érkezett"
    try {
      const result = await sendInvitationEmail(TEST_EMAIL, {
        firstName: TEST_FIRST_NAME,
        companyName: 'Teszt Cég Kft.',
        inviteUrl: 'https://masterclass.dma.hu/register?invite=test-token',
      });
      results.push({ email: '7. Employee Invite', subject: 'Meghívód érkezett', success: result.success });
    } catch (error: any) {
      results.push({ email: '7. Employee Invite', subject: 'Meghívód érkezett', success: false, error: error.message });
    }

    // 8. Employee Joined - "Munkatársad csatlakozott"
    try {
      const result = await sendEmployeeJoinedEmail({
        adminFirstName: TEST_FIRST_NAME,
        adminEmail: TEST_EMAIL,
        employeeFullName: 'Új Munkatárs',
      });
      results.push({ email: '8. Employee Joined', subject: 'Munkatársad csatlakozott', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '8. Employee Joined', subject: 'Munkatársad csatlakozott', success: false, error: error.message });
    }

    // 9. New Content Available - "Új tartalom elérhető"
    try {
      const result = await sendNewContentAvailableEmail({
        firstName: TEST_FIRST_NAME,
        email: TEST_EMAIL,
        courseTitle: 'Teszt Kurzus - Hogyan Építs Struktúrát',
        courseId: 'test-course-id',
      });
      results.push({ email: '9. New Content', subject: 'Új tartalom elérhető', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '9. New Content', subject: 'Új tartalom elérhető', success: false, error: error.message });
    }

    // 10. Inactivity Reminder - "Hiányzol..."
    try {
      const result = await sendInactivityReminderEmail({
        firstName: TEST_FIRST_NAME,
        email: TEST_EMAIL,
      });
      results.push({ email: '10. Inactivity', subject: 'Hiányzol...', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '10. Inactivity', subject: 'Hiányzol...', success: false, error: error.message });
    }

    // 11. Subscription Canceled (Boss) - "Itt a vége"
    try {
      const result = await sendSubscriptionCanceledEmail({
        firstName: TEST_FIRST_NAME,
        email: TEST_EMAIL,
        planName: 'Struktúraépítő Előfizetés',
        accessUntil: '2024-12-31',
      });
      results.push({ email: '11. Sub Canceled (Boss)', subject: 'Itt a vége', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '11. Sub Canceled (Boss)', subject: 'Itt a vége', success: false, error: error.message });
    }

    // 12. Company Subscription Canceled (Employee) - "Bocsi, semmi személyes"
    try {
      const result = await sendCompanySubscriptionCanceledEmail({
        employeeFirstName: TEST_FIRST_NAME,
        employeeEmail: TEST_EMAIL,
        companyName: 'Teszt Cég Kft.',
      });
      results.push({ email: '12. Sub Canceled (Employee)', subject: 'Bocsi, semmi személyes', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '12. Sub Canceled (Employee)', subject: 'Bocsi, semmi személyes', success: false, error: error.message });
    }

    // 13. Notify Boss - "Fizetésnap"
    try {
      const result = await sendNotifyBossEmail({
        adminFirstName: TEST_FIRST_NAME,
        adminEmail: TEST_EMAIL,
        employeeFullName: 'Munkatárs Neve',
      });
      results.push({ email: '13. Notify Boss', subject: 'Fizetésnap', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '13. Notify Boss', subject: 'Fizetésnap', success: false, error: error.message });
    }

    // 14. Password Reset - Note: Firebase Auth handles this automatically
    // Creating a custom template to match the style
    try {
      const resetUrl = 'https://masterclass.dma.hu/reset-password?token=test';
      const resetContent = `
        ${createHeading('Jelszó visszaállítása', 2)}
        ${createParagraph('Jelszó visszaállítási kérelmet kaptunk a fiókoddal kapcsolatban.')}
        ${createParagraph('Kattints az alábbi gombra az új jelszavad beállításához:')}
        ${createAlertBox('Ez a link <strong>1 óráig</strong> érvényes.', 'info')}
        ${createParagraph('Ha nem te kezdeményezted ezt a kérést, kérjük hagyd figyelmen kívül ezt az emailt.', { muted: true })}
      `;
      const htmlContent = wrapInBaseTemplate(resetContent, {
        showUnsubscribe: false,
        preheader: 'Jelszó visszaállítási kérelem',
      });

      const result = await sendEmail({
        to: TEST_EMAIL,
        subject: 'Jelszó visszaállítása - DMA Masterclass',
        html: htmlContent,
      });
      results.push({ email: '14. Password Reset', subject: 'Jelszó visszaállítása', success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ email: '14. Password Reset', subject: 'Jelszó visszaállítása', success: false, error: error.message });
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Email test complete: ${successCount} succeeded, ${failCount} failed`);
    console.log('Results:', JSON.stringify(results, null, 2));

    return {
      success: true,
      message: `Sent ${successCount} of ${results.length} emails to ${TEST_EMAIL}`,
      results,
    };
  }
);
