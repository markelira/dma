/**
 * Script to trigger all test emails
 * Run with: GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json" node scripts/trigger-test-emails.js
 */

const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'dmaapp-477d4',
  });
}

async function triggerTestEmails() {
  console.log('🚀 Triggering testAllEmails function...\n');

  const functions = getFunctions();
  const testAllEmails = functions.httpsCallable('testAllEmails');

  try {
    // Note: This is a callable function that requires authentication
    // We need to call it directly using the Functions SDK
    const result = await testAllEmails({});
    console.log('✅ Result:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nNote: This function requires admin authentication.');
    console.log('You can also trigger it from the Firebase console or the app.');
  }
}

triggerTestEmails();
