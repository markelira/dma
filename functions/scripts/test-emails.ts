/**
 * Test script for all email templates
 * Run with: npx tsx scripts/test-emails.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

// Set up environment
process.env.APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';

// Import email templates
import { sendWelcomeEmail } from '../src/email/templates/welcome';
import { sendSubscriptionStartedEmail } from '../src/email/templates/subscriptionStarted';
import { sendSubscriptionCanceledEmail } from '../src/email/templates/subscriptionCanceled';
import { sendEmployeeWelcomeEmail } from '../src/email/templates/employeeWelcome';
import { sendEmployeeJoinedEmail } from '../src/email/templates/employeeJoined';
import { sendCompanySubscriptionCanceledEmail } from '../src/email/templates/companySubscriptionCanceled';
import { sendNewContentAvailableEmail } from '../src/email/templates/newContentAvailable';
import { sendRegistrationReminderEmail } from '../src/email/templates/registrationReminder';
import { sendRegistrationReminder1DayEmail } from '../src/email/templates/registrationReminder1Day';
import { sendInactivityReminderEmail } from '../src/email/templates/inactivityReminder';

const TEST_EMAIL = process.argv[2] || 'test@example.com';

async function testAllEmails() {
  console.log(`\n📧 Testing all email templates to: ${TEST_EMAIL}\n`);
  console.log('='.repeat(60));

  const results: { name: string; success: boolean; error?: string }[] = [];

  // 1. Welcome Email
  console.log('\n1️⃣ Testing Welcome Email...');
  try {
    const result = await sendWelcomeEmail({
      firstName: 'Teszt',
      email: TEST_EMAIL,
    });
    results.push({ name: 'Welcome Email', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Welcome Email', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 2. Subscription Started Email
  console.log('\n2️⃣ Testing Subscription Started Email...');
  try {
    const result = await sendSubscriptionStartedEmail({
      firstName: 'Teszt',
      email: TEST_EMAIL,
      planName: 'Pro',
    });
    results.push({ name: 'Subscription Started', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Subscription Started', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 3. Subscription Canceled Email
  console.log('\n3️⃣ Testing Subscription Canceled Email...');
  try {
    const result = await sendSubscriptionCanceledEmail({
      firstName: 'Teszt',
      email: TEST_EMAIL,
      planName: 'Pro',
      accessUntil: '2024-12-31',
    });
    results.push({ name: 'Subscription Canceled', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Subscription Canceled', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 4. Employee Welcome Email
  console.log('\n4️⃣ Testing Employee Welcome Email...');
  try {
    const result = await sendEmployeeWelcomeEmail({
      firstName: 'Teszt Munkatárs',
      email: TEST_EMAIL,
      companyName: 'Teszt Cég Kft.',
    });
    results.push({ name: 'Employee Welcome', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Employee Welcome', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 5. Employee Joined Email (to admin)
  console.log('\n5️⃣ Testing Employee Joined Email (to admin)...');
  try {
    const result = await sendEmployeeJoinedEmail({
      adminFirstName: 'Admin',
      adminEmail: TEST_EMAIL,
      employeeFullName: 'Teszt Munkatárs',
    });
    results.push({ name: 'Employee Joined', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Employee Joined', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 6. Company Subscription Canceled Email (to employee)
  console.log('\n6️⃣ Testing Company Subscription Canceled Email...');
  try {
    const result = await sendCompanySubscriptionCanceledEmail({
      employeeFirstName: 'Munkatárs',
      employeeEmail: TEST_EMAIL,
      companyName: 'Teszt Cég Kft.',
    });
    results.push({ name: 'Company Sub Canceled', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Company Sub Canceled', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 7. New Content Available Email
  console.log('\n7️⃣ Testing New Content Available Email...');
  try {
    const result = await sendNewContentAvailableEmail({
      firstName: 'Teszt',
      email: TEST_EMAIL,
      courseTitle: 'Teszt Kurzus: Hogyan építs önjáró céget',
      courseId: 'test-course-123',
    });
    results.push({ name: 'New Content Available', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'New Content Available', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 8. Registration Reminder 7-Day Email
  console.log('\n8️⃣ Testing Registration Reminder (7-day) Email...');
  try {
    const result = await sendRegistrationReminderEmail({
      email: TEST_EMAIL,
    });
    results.push({ name: 'Registration Reminder 7-day', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Registration Reminder 7-day', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 9. Registration Reminder 1-Day Email
  console.log('\n9️⃣ Testing Registration Reminder (1-day) Email...');
  try {
    const result = await sendRegistrationReminder1DayEmail({
      email: TEST_EMAIL,
    });
    results.push({ name: 'Registration Reminder 1-day', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Registration Reminder 1-day', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 10. Inactivity Reminder Email
  console.log('\n🔟 Testing Inactivity Reminder Email...');
  try {
    const result = await sendInactivityReminderEmail({
      firstName: 'Teszt',
      email: TEST_EMAIL,
    });
    results.push({ name: 'Inactivity Reminder', success: result.success, error: result.error });
    console.log(result.success ? '   ✅ Sent!' : `   ❌ Failed: ${result.error}`);
  } catch (e: any) {
    results.push({ name: 'Inactivity Reminder', success: false, error: e.message });
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   - ${r.name}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  console.log('\n');
}

testAllEmails().catch(console.error);
