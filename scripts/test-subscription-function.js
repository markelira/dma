const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

// Simulate the exact logic from getSubscriptionStatus Cloud Function
async function simulateGetSubscriptionStatus(userId) {
  console.log('=== SIMULATING getSubscriptionStatus CLOUD FUNCTION ===');
  console.log('User ID:', userId);
  console.log('');

  // Get user document
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    console.log('ERROR: User not found');
    return { success: false, error: 'User not found' };
  }

  const userData = userDoc.data();
  console.log('=== USER DATA ===');
  console.log('Email:', userData.email);
  console.log('Role:', userData.role);
  console.log('subscriptionStatus:', userData.subscriptionStatus || 'NOT SET');
  console.log('companyId:', userData.companyId || 'NOT SET');
  console.log('teamId:', userData.teamId || 'NOT SET');
  console.log('');

  // PRIORITY 1: Check user's subscriptionStatus field
  console.log('=== PRIORITY 1: User subscriptionStatus ===');
  if (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'trialing') {
    console.log('MATCH! User has direct subscriptionStatus:', userData.subscriptionStatus);
    return {
      success: true,
      hasSubscription: true,
      isActive: true,
      source: 'PRIORITY 1 - User subscriptionStatus'
    };
  }
  console.log('NO MATCH - User subscriptionStatus is:', userData.subscriptionStatus || 'NOT SET');
  console.log('');

  // PRIORITY 2: Check subscriptions collection
  console.log('=== PRIORITY 2: Subscriptions Collection ===');
  const subscriptionsSnapshot = await db.collection('subscriptions')
    .where('userId', '==', userId)
    .where('status', 'in', ['active', 'trialing'])
    .limit(1)
    .get();

  if (!subscriptionsSnapshot.empty) {
    const subData = subscriptionsSnapshot.docs[0].data();
    console.log('MATCH! Found subscription with status:', subData.status);
    return {
      success: true,
      hasSubscription: true,
      isActive: true,
      source: 'PRIORITY 2 - Subscriptions Collection'
    };
  }
  console.log('NO MATCH - No active subscription in subscriptions collection');
  console.log('');

  // PRIORITY 3: Check team subscription
  console.log('=== PRIORITY 3: Team Subscription ===');
  const teamId = userData.teamId;
  if (teamId) {
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (teamDoc.exists) {
      const teamData = teamDoc.data();
      if (teamData.subscriptionStatus === 'active' || teamData.subscriptionStatus === 'trialing') {
        console.log('MATCH! Team has subscription:', teamData.subscriptionStatus);
        return {
          success: true,
          hasSubscription: true,
          isActive: true,
          source: 'PRIORITY 3 - Team Subscription'
        };
      }
    }
  }
  console.log('NO MATCH - No teamId or team has no active subscription');
  console.log('');

  // PRIORITY 4: Check company subscription
  console.log('=== PRIORITY 4: Company Subscription ===');
  const companyId = userData.companyId;
  console.log('companyId:', companyId || 'NOT SET');

  if (companyId) {
    const companyDoc = await db.collection('companies').doc(companyId).get();
    console.log('Company document exists:', companyDoc.exists);

    if (companyDoc.exists) {
      const companyData = companyDoc.data();
      console.log('Company subscriptionStatus:', companyData.subscriptionStatus || 'NOT SET');
      console.log('Company stripeSubscriptionId:', companyData.stripeSubscriptionId || 'NOT SET');

      if (companyData.subscriptionStatus === 'active' || companyData.subscriptionStatus === 'trialing') {
        console.log('');
        console.log('MATCH! Company has subscription:', companyData.subscriptionStatus);
        return {
          success: true,
          hasSubscription: true,
          isActive: true,
          hasActiveSubscription: true,
          viaCompany: true,
          source: 'PRIORITY 4 - Company Subscription'
        };
      }
      console.log('NO MATCH - Company subscriptionStatus is not active/trialing');
    }
  } else {
    console.log('NO MATCH - User has no companyId');
  }
  console.log('');

  // No subscription found
  console.log('=== FINAL RESULT ===');
  console.log('NO subscription found through any priority check');
  return {
    success: true,
    hasSubscription: false,
    isActive: false,
    hasActiveSubscription: false,
  };
}

async function main() {
  // Employee user ID from earlier investigation
  const employeeUserId = 'Gj9SddJ4EZZcAUjPzZIyXradWx22';

  console.log('Testing subscription status for employee user...\n');

  const result = await simulateGetSubscriptionStatus(employeeUserId);

  console.log('');
  console.log('===========================================');
  console.log('FUNCTION WOULD RETURN:');
  console.log(JSON.stringify(result, null, 2));
  console.log('===========================================');

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
