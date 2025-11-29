/**
 * Fix company subscription status
 * Run with: node scripts/fix-company-subscription.js
 */
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'dmaapp-477d4',
  });
}

const firestore = admin.firestore();

async function fixCompanySubscription() {
  const companyId = 'CCEA3n3pLoqnUFcaRQsB';
  
  console.log(`Fixing subscription for company: ${companyId}`);
  
  // Get current company data
  const companyDoc = await firestore.collection('companies').doc(companyId).get();
  
  if (!companyDoc.exists) {
    console.error('Company not found!');
    return;
  }
  
  const companyData = companyDoc.data();
  console.log('Full company data:', JSON.stringify(companyData, null, 2));
  
  // Find company admins to get owner
  const adminsSnapshot = await firestore
    .collection('companies')
    .doc(companyId)
    .collection('admins')
    .get();
  
  console.log(`Found ${adminsSnapshot.size} admins`);
  
  let ownerId = companyData.ownerId;
  
  if (!ownerId && adminsSnapshot.size > 0) {
    // Use first admin as owner
    const firstAdmin = adminsSnapshot.docs[0];
    ownerId = firstAdmin.id;
    console.log('Using admin as owner:', ownerId);
  }
  
  if (!ownerId) {
    // Try to find a user with this companyId
    const usersWithCompany = await firestore
      .collection('users')
      .where('companyId', '==', companyId)
      .limit(5)
      .get();
    
    console.log(`Found ${usersWithCompany.size} users with this companyId`);
    usersWithCompany.docs.forEach(doc => {
      const u = doc.data();
      console.log('  -', doc.id, u.email, u.companyRole);
      if (u.companyRole === 'owner' || u.companyRole === 'admin') {
        ownerId = doc.id;
      }
    });
  }
  
  if (!ownerId) {
    console.error('Cannot find owner for company!');
    return;
  }
  
  console.log('Identified owner:', ownerId);
  
  // Check if owner has a subscription in the subscriptions collection
  const ownerSubscriptions = await firestore
    .collection('subscriptions')
    .where('userId', '==', ownerId)
    .where('status', 'in', ['active', 'trialing'])
    .get();
  
  if (!ownerSubscriptions.empty) {
    const ownerSub = ownerSubscriptions.docs[0].data();
    console.log('Found owner subscription:', {
      id: ownerSubscriptions.docs[0].id,
      status: ownerSub.status,
      stripeSubscriptionId: ownerSub.stripeSubscriptionId,
    });
    
    // Update company with subscription info from owner
    await firestore.collection('companies').doc(companyId).update({
      subscriptionStatus: ownerSub.status,
      stripeSubscriptionId: ownerSub.stripeSubscriptionId,
      stripeCustomerId: ownerSub.stripeCustomerId,
      ownerId: ownerId, // Fix missing ownerId
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ Company subscription status updated to:', ownerSub.status);
  } else {
    console.log('⚠️ No active subscription found for owner in subscriptions collection');
    
    // Check owner user doc for subscription info
    const ownerDoc = await firestore.collection('users').doc(ownerId).get();
    if (ownerDoc.exists) {
      const ownerData = ownerDoc.data();
      console.log('Owner user data:', {
        email: ownerData.email,
        subscriptionStatus: ownerData.subscriptionStatus,
        stripeSubscriptionId: ownerData.stripeSubscriptionId,
      });
      
      if (ownerData.subscriptionStatus === 'active' || ownerData.subscriptionStatus === 'trialing') {
        await firestore.collection('companies').doc(companyId).update({
          subscriptionStatus: ownerData.subscriptionStatus,
          stripeSubscriptionId: ownerData.stripeSubscriptionId,
          stripeCustomerId: ownerData.stripeCustomerId,
          ownerId: ownerId, // Fix missing ownerId
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ Company subscription status updated from owner user doc');
      } else {
        console.log('❌ Owner does not have active subscription status on user doc either');
        console.log('Need to manually set subscription or have owner complete checkout');
      }
    }
  }
}

fixCompanySubscription()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
