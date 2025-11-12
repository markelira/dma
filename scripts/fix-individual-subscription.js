/**
 * Fix Individual Subscriber Account
 *
 * This script fixes subscription status for individual subscribers (non-company users)
 * who completed Stripe checkout but didn't get their subscription fields set.
 *
 * Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/fix-individual-subscription.js <userId>
 * Example: STRIPE_SECRET_KEY=sk_xxx node scripts/fix-individual-subscription.js p32LB6NXiSS9DJJiLp6490o2GYr1
 */

const admin = require('firebase-admin');
const Stripe = require('stripe');
const path = require('path');

// Get Stripe secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  console.error('Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/fix-individual-subscription.js <userId>');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

// Initialize Firebase Admin
const projectId = 'dmaapp-477d4';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  } catch (error) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
    } catch (appDefaultError) {
      console.error('❌ Error: Could not initialize Firebase Admin');
      console.error('   Please provide serviceAccountKey.json or use application default credentials');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function fixIndividualSubscription(userId) {
  console.log('\n🔧 FIXING INDIVIDUAL SUBSCRIPTION');
  console.log('='.repeat(80));
  console.log(`User ID: ${userId}\n`);

  try {
    // 1. Get user document
    console.log('1️⃣  Fetching user document...');
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('❌ User document not found');
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log(`✅ User found: ${userData.email}`);

    // 2. Check if user has Stripe customer ID
    if (!userData.stripeCustomerId) {
      console.error('❌ User has no stripeCustomerId - cannot check Stripe subscriptions');
      process.exit(1);
    }

    console.log(`\n2️⃣  Checking Stripe for active subscriptions...`);
    console.log(`   Stripe Customer ID: ${userData.stripeCustomerId}`);

    // 3. Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active',
      limit: 100
    });

    console.log(`   Found ${subscriptions.data.length} active subscription(s) in Stripe`);

    if (subscriptions.data.length === 0) {
      console.error('❌ No active subscriptions found in Stripe for this customer');
      console.error('   User may have canceled or subscription may have expired');
      process.exit(1);
    }

    // Use the first active subscription
    const subscription = subscriptions.data[0];
    console.log(`\n   Active Subscription Details:`);
    console.log(`   - Subscription ID: ${subscription.id}`);
    console.log(`   - Status: ${subscription.status}`);
    console.log(`   - Current Period: ${new Date(subscription.current_period_start * 1000).toISOString()} to ${new Date(subscription.current_period_end * 1000).toISOString()}`);
    console.log(`   - Plan: ${subscription.items.data[0]?.price?.id || 'N/A'}`);
    console.log(`   - Billing: ${subscription.items.data[0]?.price?.recurring?.interval || 'N/A'}`);

    // 4. Check if user already has subscription status
    if (userData.subscriptionStatus === 'active') {
      console.log('\n⚠️  User already has subscriptionStatus = "active"');
      console.log('   Checking if subscription document exists...');

      const subsQuery = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get();

      if (!subsQuery.empty) {
        console.log('✅ Subscription document already exists in Firestore');
        console.log('   No changes needed. User should already have access.');
        console.log('\n💡 If user still cannot access courses, try:');
        console.log('   1. Hard refresh browser (Ctrl+Shift+R)');
        console.log('   2. Clear browser cache');
        console.log('   3. Check Cloud Function logs for errors');
        return;
      }
    }

    // 5. Ask for confirmation
    console.log('\n📝 PROPOSED CHANGES:');
    console.log('='.repeat(80));
    console.log('Will update user document:');
    console.log(`   - Set subscriptionStatus: "active"`);
    console.log(`   - Set stripeSubscriptionId: "${subscription.id}"`);
    console.log('\nWill create subscription document in Firestore:');
    console.log(`   - Document ID: Auto-generated`);
    console.log(`   - userId: ${userId}`);
    console.log(`   - stripeSubscriptionId: ${subscription.id}`);
    console.log(`   - status: active`);
    console.log(`   - currentPeriodEnd: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    console.log('\n⚠️  This will grant the user access to all courses.');
    console.log('Continue? (Ctrl+C to cancel, waiting 3 seconds...)');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Update user document
    console.log('\n3️⃣  Updating user document...');
    await userRef.update({
      subscriptionStatus: 'active',
      stripeSubscriptionId: subscription.id,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ User document updated');

    // 7. Create subscription document
    console.log('\n4️⃣  Creating subscription document in Firestore...');
    const subscriptionData = {
      userId: userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: userData.stripeCustomerId,
      status: subscription.status,
      planName: 'DMA Individual Subscription',
      priceId: subscription.items.data[0]?.price?.id || null,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const subscriptionRef = await db.collection('subscriptions').add(subscriptionData);
    console.log(`✅ Subscription document created: ${subscriptionRef.id}`);

    // 8. Verify the fix
    console.log('\n5️⃣  Verifying fix...');
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();

    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log('User document now has:');
    console.log(`   ✅ subscriptionStatus: ${updatedUserData.subscriptionStatus}`);
    console.log(`   ✅ stripeSubscriptionId: ${updatedUserData.stripeSubscriptionId}`);
    console.log(`   ✅ stripeCustomerId: ${updatedUserData.stripeCustomerId}`);

    console.log('\n🎉 SUCCESS! User subscription has been fixed.');
    console.log('\nNext steps:');
    console.log('   1. User should hard refresh their browser (Ctrl+Shift+R)');
    console.log('   2. User should be able to enroll in any course now');
    console.log('   3. Monitor Cloud Function logs to ensure getSubscriptionStatus returns hasActiveSubscription: true');

  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Main execution
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a user ID');
  console.error('Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/fix-individual-subscription.js <userId>');
  console.error('Example: STRIPE_SECRET_KEY=sk_xxx node scripts/fix-individual-subscription.js p32LB6NXiSS9DJJiLp6490o2GYr1');
  process.exit(1);
}

fixIndividualSubscription(userId)
  .then(() => {
    console.log('\n✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
