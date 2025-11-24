/**
 * Fix Company Subscription
 *
 * This script fixes the subscription data for a company user who completed
 * Stripe checkout but wasn't properly recognized as subscribed due to a bug
 * in the webhook handler.
 *
 * Usage:
 *   COMPANY_ID=xxx USER_ID=xxx node scripts/fix-company-subscription.js
 *
 * What it does:
 * 1. Looks up the user in Stripe by stripeCustomerId
 * 2. Gets their active subscription from Stripe
 * 3. Updates the company document with subscription status
 * 4. Updates the user document with subscription status
 * 5. Creates a subscription document in Firestore
 */

const admin = require('firebase-admin');
const Stripe = require('stripe');
require('dotenv').config({ path: require('path').join(__dirname, '../functions/.env') });

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  require('path').join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'dmaapp-477d4',
  });
}

const db = admin.firestore();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-10-28',
});

async function fixCompanySubscription() {
  const companyId = process.env.COMPANY_ID;
  const userId = process.env.USER_ID;

  if (!companyId || !userId) {
    console.error('Please provide COMPANY_ID and USER_ID environment variables');
    console.log('Usage: COMPANY_ID=xxx USER_ID=xxx node scripts/fix-company-subscription.js');
    process.exit(1);
  }

  console.log('\n=== Fix Company Subscription ===');
  console.log(`Company ID: ${companyId}`);
  console.log(`User ID: ${userId}`);

  try {
    // 1. Get user document
    console.log('\n1. Fetching user document...');
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error('User not found!');
      process.exit(1);
    }
    const userData = userDoc.data();
    console.log(`   User: ${userData.email}`);
    console.log(`   Stripe Customer ID: ${userData.stripeCustomerId || 'NOT SET'}`);

    // 2. Get company document
    console.log('\n2. Fetching company document...');
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      console.error('Company not found!');
      process.exit(1);
    }
    const companyData = companyDoc.data();
    console.log(`   Company: ${companyData.name}`);
    console.log(`   Current Plan: ${companyData.plan}`);
    console.log(`   Current Status: ${companyData.status}`);
    console.log(`   Subscription Status: ${companyData.subscriptionStatus || 'NOT SET'}`);

    // 3. Look up Stripe customer and subscription
    let stripeCustomerId = userData.stripeCustomerId;
    let subscription = null;

    if (stripeCustomerId) {
      console.log('\n3. Looking up Stripe subscription...');

      // Get active subscriptions for customer
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 5,
      });

      if (subscriptions.data.length > 0) {
        // Find active or trialing subscription
        subscription = subscriptions.data.find(s =>
          s.status === 'active' || s.status === 'trialing'
        ) || subscriptions.data[0];

        console.log(`   Found ${subscriptions.data.length} subscription(s)`);
        console.log(`   Using subscription: ${subscription.id}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

        if (subscription.trial_end) {
          console.log(`   Trial End: ${new Date(subscription.trial_end * 1000).toISOString()}`);
        }
      } else {
        console.log('   No subscriptions found for this customer');
      }
    } else {
      console.log('\n3. No Stripe customer ID found - looking up by email...');

      const customers = await stripe.customers.list({
        email: userData.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        stripeCustomerId = customer.id;
        console.log(`   Found customer: ${customer.id}`);

        // Get subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'all',
          limit: 5,
        });

        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data.find(s =>
            s.status === 'active' || s.status === 'trialing'
          ) || subscriptions.data[0];

          console.log(`   Found subscription: ${subscription.id}`);
          console.log(`   Status: ${subscription.status}`);
        }
      } else {
        console.log('   No Stripe customer found for this email');
      }
    }

    // 4. Update documents
    console.log('\n4. Updating Firestore documents...');

    const subscriptionStatus = subscription
      ? (subscription.status === 'trialing' ? 'trialing' : 'active')
      : 'trialing'; // Default to trialing if no subscription found (company trial)

    const now = new Date();
    const endDate = subscription
      ? new Date(subscription.current_period_end * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const trialEnd = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000)
      : endDate;

    // Update company
    const companyUpdate = {
      subscriptionStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (subscription) {
      companyUpdate.plan = subscriptionStatus;
      companyUpdate.stripeSubscriptionId = subscription.id;
      companyUpdate.subscriptionStartDate = admin.firestore.Timestamp.fromDate(
        new Date(subscription.current_period_start * 1000)
      );
      companyUpdate.subscriptionEndDate = admin.firestore.Timestamp.fromDate(endDate);
      companyUpdate.trialEndDate = admin.firestore.Timestamp.fromDate(trialEnd);
    }

    if (stripeCustomerId) {
      companyUpdate.stripeCustomerId = stripeCustomerId;
    }

    await db.collection('companies').doc(companyId).update(companyUpdate);
    console.log('   Company document updated');

    // Update user
    const userUpdate = {
      subscriptionStatus,
      updatedAt: now.toISOString(),
    };

    if (stripeCustomerId) {
      userUpdate.stripeCustomerId = stripeCustomerId;
    }

    if (subscription) {
      userUpdate.stripeSubscriptionId = subscription.id;
    }

    await db.collection('users').doc(userId).update(userUpdate);
    console.log('   User document updated');

    // Create subscription document
    if (subscription) {
      // Check if subscription doc already exists
      const existingSubSnapshot = await db.collection('subscriptions')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (existingSubSnapshot.empty) {
        const subscriptionDoc = {
          userId,
          companyId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price?.id || '',
          status: subscriptionStatus,
          planName: 'DMA Company Subscription',
          subscriptionType: 'company',
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: endDate.toISOString(),
          trialEnd: trialEnd.toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        await db.collection('subscriptions').add(subscriptionDoc);
        console.log('   Subscription document created');
      } else {
        console.log('   Subscription document already exists');
      }
    }

    console.log('\n=== SUCCESS ===');
    console.log(`Company subscription status set to: ${subscriptionStatus}`);
    console.log('The user should now be recognized as having an active subscription.');
    console.log('Please refresh the company dashboard to verify.');

  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  }
}

fixCompanySubscription();
