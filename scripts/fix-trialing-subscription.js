const admin = require('firebase-admin');
const path = require('path');

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
      console.error('Could not initialize Firebase Admin');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function fixTrialingSubscription() {
  const userId = 'p32LB6NXiSS9DJJiLp6490o2GYr1';
  const subscriptionId = 'sub_1SQpCjGe8tBqGEXM2Y2vmlrk';
  const customerId = 'cus_TNZpvPu6nlye7x';
  const priceId = 'price_1SNAlsGe8tBqGEXM8vEOVhgY';
  
  console.log('\n🔧 FIXING TRIALING SUBSCRIPTION');
  console.log('='.repeat(80));
  console.log(`User ID: ${userId}`);
  console.log(`Subscription ID: ${subscriptionId}`);
  console.log(`Status: trialing\n`);
  
  try {
    // 1. Update user document
    console.log('1️⃣ Updating user document...');
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'trialing',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ User document updated\n');
    
    // 2. Create subscription document
    console.log('2️⃣ Creating subscription document...');
    const subscriptionData = {
      userId: userId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      status: 'trialing',
      planName: 'DMA Individual Subscription',
      subscriptionPlan: 'monthly',
      currentPeriodStart: '2025-11-07T12:55:49.000Z',
      currentPeriodEnd: '2025-11-14T12:55:49.000Z',
      trialEnd: '2025-11-14T12:55:49.000Z',
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const subscriptionRef = await db.collection('subscriptions').add(subscriptionData);
    console.log(`✅ Subscription document created: ${subscriptionRef.id}\n`);
    
    // 3. Verify
    console.log('3️⃣ Verifying...');
    const updatedUser = await db.collection('users').doc(userId).get();
    const userData = updatedUser.data();
    
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log('User document:');
    console.log(`   ✅ subscriptionStatus: ${userData.subscriptionStatus}`);
    console.log(`   ✅ stripeSubscriptionId: ${userData.stripeSubscriptionId}`);
    console.log(`   ✅ stripeCustomerId: ${userData.stripeCustomerId}`);
    
    console.log('\n🎉 SUCCESS! User can now access all courses during trial period.');
    console.log('   Trial ends: November 14, 2025');
    console.log('   After trial: Subscription will automatically become active');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixTrialingSubscription()
  .then(() => {
    console.log('\n✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
