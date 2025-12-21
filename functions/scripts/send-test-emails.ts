/**
 * Script to directly send all test emails to info@dma.hu
 *
 * Run with:
 * cd functions && source .env && GOOGLE_APPLICATION_CREDENTIALS="/Users/mark/dma/dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json" npx tsx scripts/send-test-emails.ts
 */

// FIRST: Set environment variables before any imports
process.env.APP_URL = 'https://masterclass.dma.hu';

// Initialize Firebase Admin BEFORE any other imports
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'dmaapp-477d4',
  });
}

// NOW import email templates (after Firebase is initialized)
import { sendEmail } from '../src/email/emailService';
import { sendWelcomeEmail } from '../src/email/templates/welcome';
import { sendEmployeeWelcomeEmail } from '../src/email/templates/employeeWelcome';
import { sendRegistrationReminder1DayEmail } from '../src/email/templates/registrationReminder1Day';
import { sendRegistrationReminderEmail } from '../src/email/templates/registrationReminder';
import { sendSubscriptionStartedEmail } from '../src/email/templates/subscriptionStarted';
import { sendEmployeeJoinedEmail } from '../src/email/templates/employeeJoined';
import { sendNewContentAvailableEmail } from '../src/email/templates/newContentAvailable';
import { sendInactivityReminderEmail } from '../src/email/templates/inactivityReminder';
import { sendSubscriptionCanceledEmail } from '../src/email/templates/subscriptionCanceled';
import { sendCompanySubscriptionCanceledEmail } from '../src/email/templates/companySubscriptionCanceled';
import { sendNotifyBossEmail } from '../src/email/templates/notifyBossEmail';
import { sendInvitationEmail } from '../src/company/employeeInvite';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createCodeDisplay,
  createAlertBox,
  createButtonRow,
} from '../src/email/templates/base';

const TEST_EMAIL = 'info@dma.hu';
const TEST_FIRST_NAME = 'Teszt';

interface EmailResult {
  name: string;
  subject: string;
  success: boolean;
  error?: string;
}

async function sendAllTestEmails() {
  console.log('🧪 Starting email test - sending all templates to', TEST_EMAIL);
  console.log('='.repeat(60) + '\n');

  const results: EmailResult[] = [];

  // 1. Email Verification Code - "Erősítsd meg az e-mail címed"
  console.log('📧 1. Sending: Erősítsd meg az e-mail címed...');
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
    results.push({ name: '1. Verification', subject: 'Erősítsd meg az e-mail címed', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '1. Verification', subject: 'Erősítsd meg az e-mail címed', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 2. Welcome Email (Boss) - "Üdv a Struktúraépítők között"
  console.log('📧 2. Sending: Üdv a Struktúraépítők között (Boss)...');
  try {
    const result = await sendWelcomeEmail({
      firstName: TEST_FIRST_NAME,
      email: TEST_EMAIL,
    });
    results.push({ name: '2. Welcome (Boss)', subject: 'Üdv a Struktúraépítők között', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '2. Welcome (Boss)', subject: 'Üdv a Struktúraépítők között', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 3. Welcome Email (Employee) - "Üdv a Struktúraépítők között"
  console.log('📧 3. Sending: Üdv a Struktúraépítők között (Employee)...');
  try {
    const result = await sendEmployeeWelcomeEmail({
      firstName: TEST_FIRST_NAME,
      email: TEST_EMAIL,
      companyName: 'Teszt Cég Kft.',
    });
    results.push({ name: '3. Welcome (Employee)', subject: 'Üdv a Struktúraépítők között', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '3. Welcome (Employee)', subject: 'Üdv a Struktúraépítők között', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 4. Registration Reminder 1 Day - "RE: Üdv a Struktúraépítők között"
  console.log('📧 4. Sending: RE: Üdv a Struktúraépítők között (1-Day)...');
  try {
    const result = await sendRegistrationReminder1DayEmail({
      email: TEST_EMAIL,
    });
    results.push({ name: '4. Reminder 1-Day', subject: 'RE: Üdv a Struktúraépítők között', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '4. Reminder 1-Day', subject: 'RE: Üdv a Struktúraépítők között', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 5. Registration Reminder 7 Days - "7 nap telt el, és kezdünk aggódni"
  console.log('📧 5. Sending: 7 nap telt el, és kezdünk aggódni...');
  try {
    const result = await sendRegistrationReminderEmail({
      email: TEST_EMAIL,
    });
    results.push({ name: '5. Reminder 7-Day', subject: '7 nap telt el, és kezdünk aggódni', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '5. Reminder 7-Day', subject: '7 nap telt el, és kezdünk aggódni', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 6. Subscription Started - "Sikeres fizetés"
  console.log('📧 6. Sending: Sikeres fizetés...');
  try {
    const result = await sendSubscriptionStartedEmail({
      firstName: TEST_FIRST_NAME,
      email: TEST_EMAIL,
      planName: 'Struktúraépítő Előfizetés',
      isTrialing: false,
    });
    results.push({ name: '6. Subscription Started', subject: 'Sikeres fizetés', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '6. Subscription Started', subject: 'Sikeres fizetés', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 7. Employee Invite - "Meghívód érkezett"
  console.log('📧 7. Sending: Meghívód érkezett...');
  try {
    const result = await sendInvitationEmail(TEST_EMAIL, {
      firstName: TEST_FIRST_NAME,
      companyName: 'Teszt Cég Kft.',
      inviteUrl: 'https://masterclass.dma.hu/register?invite=test-token',
    });
    results.push({ name: '7. Employee Invite', subject: 'Meghívód érkezett', success: result.success });
    console.log(result.success ? '   ✅ Sent!' : '   ❌ Failed');
  } catch (error: any) {
    results.push({ name: '7. Employee Invite', subject: 'Meghívód érkezett', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 8. Employee Joined - "Munkatársad csatlakozott"
  console.log('📧 8. Sending: Munkatársad csatlakozott...');
  try {
    const result = await sendEmployeeJoinedEmail({
      adminFirstName: TEST_FIRST_NAME,
      adminEmail: TEST_EMAIL,
      employeeFullName: 'Új Munkatárs',
    });
    results.push({ name: '8. Employee Joined', subject: 'Munkatársad csatlakozott', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '8. Employee Joined', subject: 'Munkatársad csatlakozott', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 9. New Content Available - "Új tartalom elérhető"
  console.log('📧 9. Sending: Új tartalom elérhető...');
  try {
    const result = await sendNewContentAvailableEmail({
      firstName: TEST_FIRST_NAME,
      email: TEST_EMAIL,
      courseTitle: 'Teszt Kurzus - Hogyan Építs Struktúrát',
      courseId: 'test-course-id',
    });
    results.push({ name: '9. New Content', subject: 'Új tartalom elérhető', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '9. New Content', subject: 'Új tartalom elérhető', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 10. Inactivity Reminder - "Hiányzol..."
  console.log('📧 10. Sending: Hiányzol...');
  try {
    const result = await sendInactivityReminderEmail({
      firstName: TEST_FIRST_NAME,
      email: TEST_EMAIL,
    });
    results.push({ name: '10. Inactivity', subject: 'Hiányzol...', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '10. Inactivity', subject: 'Hiányzol...', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 11. Subscription Canceled (Boss) - "Itt a vége"
  console.log('📧 11. Sending: Itt a vége (Boss)...');
  try {
    const result = await sendSubscriptionCanceledEmail({
      firstName: TEST_FIRST_NAME,
      email: TEST_EMAIL,
      planName: 'Struktúraépítő Előfizetés',
      accessUntil: '2024-12-31',
    });
    results.push({ name: '11. Sub Canceled (Boss)', subject: 'Itt a vége', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '11. Sub Canceled (Boss)', subject: 'Itt a vége', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 12. Company Subscription Canceled (Employee) - "Bocsi, semmi személyes"
  console.log('📧 12. Sending: Bocsi, semmi személyes (Employee)...');
  try {
    const result = await sendCompanySubscriptionCanceledEmail({
      employeeFirstName: TEST_FIRST_NAME,
      employeeEmail: TEST_EMAIL,
      companyName: 'Teszt Cég Kft.',
    });
    results.push({ name: '12. Sub Canceled (Employee)', subject: 'Bocsi, semmi személyes', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '12. Sub Canceled (Employee)', subject: 'Bocsi, semmi személyes', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 13. Notify Boss - "Fizetésnap"
  console.log('📧 13. Sending: Fizetésnap...');
  try {
    const result = await sendNotifyBossEmail({
      adminFirstName: TEST_FIRST_NAME,
      adminEmail: TEST_EMAIL,
      employeeFullName: 'Munkatárs Neve',
    });
    results.push({ name: '13. Notify Boss', subject: 'Fizetésnap', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '13. Notify Boss', subject: 'Fizetésnap', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // 14. Password Reset - "Jelszó visszaállítása"
  console.log('📧 14. Sending: Jelszó visszaállítása...');
  try {
    const resetUrl = 'https://masterclass.dma.hu/reset-password?token=test';
    const resetContent = `
      ${createHeading('Jelszó visszaállítása', 2)}
      ${createParagraph('Hiba történt a mátrixban és véletlenül elfelejtetted a kedvenc Struktúraépítő streaming platformod jelszavát. Állíts be újat!')}
      ${createButtonRow({ text: 'ÚJ JELSZÓ BEÁLLÍTÁSA', url: resetUrl, variant: 'primary' })}
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
    results.push({ name: '14. Password Reset', subject: 'Jelszó visszaállítása', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (error: any) {
    results.push({ name: '14. Password Reset', subject: 'Jelszó visszaállítása', success: false, error: error.message });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n📊 SUMMARY: ${successCount} succeeded, ${failCount} failed out of ${results.length} emails`);
  console.log(`📬 All emails sent to: ${TEST_EMAIL}\n`);

  if (failCount > 0) {
    console.log('❌ Failed emails:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n✅ Done!');
}

// Run the function
sendAllTestEmails().catch(console.error);
