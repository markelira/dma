/**
 * Diagnostic Script: Check User's Subscription Data
 *
 * Usage: node scripts/diagnose-subscription.js <userId>
 * Example: node scripts/diagnose-subscription.js p32LB6NXiSS9DJJiLp6490o2GYr1
 *
 * This script queries Firestore to display all subscription-related data for a user
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const projectId = 'dmaapp-477d4'; // Set your Firebase project ID

if (!admin.apps.length) {
  try {
    // Try to use service account key if it exists
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('✅ Using service account credentials\n');
  } catch (error) {
    // Fall back to application default credentials (works with Firebase CLI)
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
      console.log('✅ Using application default credentials\n');
    } catch (appDefaultError) {
      console.error('❌ Error: Could not initialize Firebase Admin');
      console.error('   Please ensure you are logged in with Firebase CLI:');
      console.error('   Run: firebase login');
      console.error('\n   Or provide a serviceAccountKey.json file in the project root');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function diagnoseSubscription(userId) {
  console.log('\n🔍 SUBSCRIPTION DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log(`User ID: ${userId}\n`);

  try {
    // 1. Check user document
    console.log('1️⃣  USER DOCUMENT:');
    console.log('-'.repeat(80));
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('❌ User document NOT FOUND');
      return;
    }

    const userData = userDoc.data();
    console.log('✅ User document exists');
    console.log('\nSubscription-related fields:');
    console.log(`   subscriptionStatus: ${userData.subscriptionStatus || '❌ NOT SET'}`);
    console.log(`   teamId: ${userData.teamId || '❌ NOT SET'}`);
    console.log(`   isTeamOwner: ${userData.isTeamOwner || '❌ NOT SET'}`);
    console.log(`   stripeCustomerId: ${userData.stripeCustomerId || '❌ NOT SET'}`);
    console.log(`   stripeSubscriptionId: ${userData.stripeSubscriptionId || '❌ NOT SET'}`);

    console.log('\nOther user fields:');
    console.log(`   email: ${userData.email || 'N/A'}`);
    console.log(`   firstName: ${userData.firstName || 'N/A'}`);
    console.log(`   lastName: ${userData.lastName || 'N/A'}`);
    console.log(`   role: ${userData.role || 'N/A'}`);
    console.log(`   createdAt: ${userData.createdAt || 'N/A'}`);

    // 2. Check teams collection
    console.log('\n2️⃣  TEAMS COLLECTION:');
    console.log('-'.repeat(80));
    const teamsQuery = await db.collection('teams')
      .where('ownerId', '==', userId)
      .get();

    if (teamsQuery.empty) {
      console.log('❌ No teams found where user is owner');

      // Check if user has a teamId but no matching team
      if (userData.teamId) {
        console.log(`\n⚠️  WARNING: User has teamId (${userData.teamId}) but no team exists!`);
        const teamDoc = await db.collection('teams').doc(userData.teamId).get();
        if (!teamDoc.exists) {
          console.log('   ❌ The teamId points to a non-existent team document');
        } else {
          console.log('   ✅ Team document exists, but user is not the owner');
          const teamData = teamDoc.data();
          console.log(`      Team owner: ${teamData.ownerId}`);
          console.log(`      Subscription status: ${teamData.subscriptionStatus || 'NOT SET'}`);
        }
      }
    } else {
      console.log(`✅ Found ${teamsQuery.size} team(s) owned by user:`);
      teamsQuery.forEach(doc => {
        const teamData = doc.data();
        console.log(`\n   Team ID: ${doc.id}`);
        console.log(`   Name: ${teamData.name || 'N/A'}`);
        console.log(`   Subscription Status: ${teamData.subscriptionStatus || '❌ NOT SET'}`);
        console.log(`   Stripe Subscription ID: ${teamData.stripeSubscriptionId || '❌ NOT SET'}`);
        console.log(`   Subscription Plan: ${teamData.subscriptionPlan || 'N/A'}`);
        console.log(`   Subscription Start: ${teamData.subscriptionStartDate?.toDate?.() || 'N/A'}`);
        console.log(`   Subscription End: ${teamData.subscriptionEndDate?.toDate?.() || 'N/A'}`);
        console.log(`   Trial End: ${teamData.trialEndDate?.toDate?.() || 'N/A'}`);
        console.log(`   Members: ${teamData.members?.length || 0}`);
      });
    }

    // 3. Check subscriptions collection
    console.log('\n3️⃣  SUBSCRIPTIONS COLLECTION:');
    console.log('-'.repeat(80));
    const subscriptionsQuery = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    if (subscriptionsQuery.empty) {
      console.log('ℹ️  No documents in subscriptions collection (expected for team-based subscriptions)');
    } else {
      console.log(`✅ Found ${subscriptionsQuery.size} subscription(s):`);
      subscriptionsQuery.forEach(doc => {
        const subData = doc.data();
        console.log(`\n   Subscription ID: ${doc.id}`);
        console.log(`   Status: ${subData.status || 'N/A'}`);
        console.log(`   Plan: ${subData.planName || 'N/A'}`);
        console.log(`   Stripe Subscription ID: ${subData.stripeSubscriptionId || 'N/A'}`);
        console.log(`   Current Period Start: ${subData.currentPeriodStart || 'N/A'}`);
        console.log(`   Current Period End: ${subData.currentPeriodEnd || 'N/A'}`);
      });
    }

    // 4. Check enrollments
    console.log('\n4️⃣  ENROLLMENTS:');
    console.log('-'.repeat(80));
    const enrollmentsQuery = await db.collection('enrollments')
      .where('userId', '==', userId)
      .get();

    console.log(`Found ${enrollmentsQuery.size} enrollment(s)`);
    if (enrollmentsQuery.size > 0) {
      enrollmentsQuery.forEach(doc => {
        const enrollData = doc.data();
        console.log(`   - Course ID: ${enrollData.courseId}, Status: ${enrollData.status || 'N/A'}`);
      });
    }

    // 5. Diagnosis summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(80));

    const issues = [];
    const fixes = [];

    if (!userData.subscriptionStatus || userData.subscriptionStatus !== 'active') {
      issues.push('❌ User subscriptionStatus is not "active"');
      fixes.push('Set userData.subscriptionStatus = "active"');
    }

    if (!userData.teamId) {
      issues.push('❌ User teamId is missing');
      fixes.push('Set userData.teamId to the team ID');
    }

    if (!userData.stripeCustomerId) {
      issues.push('⚠️  User stripeCustomerId is missing');
      fixes.push('Set userData.stripeCustomerId from Stripe');
    }

    if (!userData.stripeSubscriptionId) {
      issues.push('⚠️  User stripeSubscriptionId is missing');
      fixes.push('Set userData.stripeSubscriptionId from Stripe');
    }

    if (teamsQuery.empty) {
      issues.push('❌ No team found for user');
      fixes.push('Create a team for the user or link to existing team');
    }

    if (issues.length === 0) {
      console.log('✅ All subscription fields look correct!');
      console.log('   If getSubscriptionStatus is still returning false, try:');
      console.log('   1. Hard refresh browser (Ctrl+Shift+R)');
      console.log('   2. Check Cloud Function logs for errors');
      console.log('   3. Verify getSubscriptionStatus function was deployed successfully');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('\nRequired fixes:');
      fixes.forEach(fix => console.log(`   • ${fix}`));
      console.log('\n💡 Run the fix script to automatically apply these fixes:');
      console.log(`   node scripts/fix-subscription.js ${userId}`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error(error.stack);
  }
}

// Main execution
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a user ID');
  console.error('Usage: node scripts/diagnose-subscription.js <userId>');
  console.error('Example: node scripts/diagnose-subscription.js p32LB6NXiSS9DJJiLp6490o2GYr1');
  process.exit(1);
}

diagnoseSubscription(userId)
  .then(() => {
    console.log('\n✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
