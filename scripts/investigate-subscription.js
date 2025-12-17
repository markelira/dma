const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

async function investigate() {
  const adminEmail = 'eliramark@gmail.com';
  const employeeEmail = 'fudede@denipl.com';

  console.log('=== SUBSCRIPTION INVESTIGATION ===');
  console.log('Admin email:', adminEmail);
  console.log('Employee email:', employeeEmail);
  console.log('');

  // 1. Find EMPLOYEE user by email
  console.log('=== EMPLOYEE USER DATA ===');
  const employeeSnapshot = await db.collection('users').where('email', '==', employeeEmail).get();

  if (employeeSnapshot.empty) {
    console.log('ERROR: Employee not found with email:', employeeEmail);
  } else {
    const employeeDoc = employeeSnapshot.docs[0];
    const employeeData = employeeDoc.data();
    console.log('Employee User ID:', employeeDoc.id);
    console.log('Email:', employeeData.email);
    console.log('Role:', employeeData.role);
    console.log('Company ID:', employeeData.companyId || 'NOT SET');
    console.log('Subscription Status:', employeeData.subscriptionStatus || 'NOT SET');
  }
  console.log('');

  // 2. Find ADMIN user by email
  console.log('=== ADMIN USER DATA ===');
  const adminSnapshot = await db.collection('users').where('email', '==', adminEmail).get();

  let adminUserId = null;
  let adminCompanyId = null;

  if (adminSnapshot.empty) {
    console.log('ERROR: Admin not found with email:', adminEmail);
  } else {
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    adminUserId = adminDoc.id;
    adminCompanyId = adminData.companyId;
    console.log('Admin User ID:', adminDoc.id);
    console.log('Email:', adminData.email);
    console.log('Role:', adminData.role);
    console.log('Company ID:', adminData.companyId || 'NOT SET');
    console.log('Subscription Status:', adminData.subscriptionStatus || 'NOT SET');
    console.log('Stripe Customer ID:', adminData.stripeCustomerId || 'NOT SET');
  }
  console.log('');

  // 3. Check company document
  if (adminCompanyId) {
    console.log('=== COMPANY DATA ===');
    const companyDoc = await db.collection('companies').doc(adminCompanyId).get();

    if (companyDoc.exists) {
      const companyData = companyDoc.data();
      console.log('Company ID:', adminCompanyId);
      console.log('Company Name:', companyData.name);
      console.log('Admin User ID:', companyData.adminUserId);
      console.log('');
      console.log('*** SUBSCRIPTION STATUS:', companyData.subscriptionStatus || 'NOT SET', '***');
      console.log('');
      console.log('Stripe Subscription ID:', companyData.stripeSubscriptionId || 'NOT SET');
      console.log('Stripe Customer ID:', companyData.stripeCustomerId || 'NOT SET');
      console.log('Plan:', companyData.plan || 'NOT SET');
      console.log('Max Employees:', companyData.maxEmployees || 'NOT SET');
      console.log('');

      // Check employees subcollection
      const employeesSnapshot = await db.collection('companies').doc(adminCompanyId).collection('employees').get();
      console.log('=== COMPANY EMPLOYEES ===');
      console.log('Total employees:', employeesSnapshot.size);
      employeesSnapshot.docs.forEach((doc, i) => {
        const empData = doc.data();
        console.log(`  ${i + 1}. ${empData.email} (${empData.status || 'unknown status'})`);
      });
    } else {
      console.log('ERROR: Company document not found');
    }
    console.log('');
  }

  // 4. Check subscriptions collection for admin
  if (adminUserId) {
    console.log('=== ADMIN SUBSCRIPTIONS COLLECTION ===');
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', adminUserId)
      .get();

    if (subscriptionsSnapshot.empty) {
      console.log('No subscriptions found for admin in subscriptions collection');
    } else {
      subscriptionsSnapshot.docs.forEach((doc, i) => {
        const subData = doc.data();
        console.log(`Subscription ${i + 1}:`);
        console.log('  ID:', doc.id);
        console.log('  Status:', subData.status);
        console.log('  Plan:', subData.plan || subData.planId);
        console.log('  Stripe Sub ID:', subData.stripeSubscriptionId);
      });
    }
    console.log('');
  }

  // 5. Analysis
  console.log('=== ANALYSIS ===');
  if (adminCompanyId) {
    const companyDoc = await db.collection('companies').doc(adminCompanyId).get();
    if (companyDoc.exists) {
      const companyData = companyDoc.data();
      const status = companyData.subscriptionStatus;

      if (status === 'active' || status === 'trialing') {
        console.log('Company subscription status is ACTIVE');
        console.log('Employee SHOULD have access. If popup shows, check:');
        console.log('  1. Employee companyId matches company ID');
        console.log('  2. Frontend caching issue');
        console.log('  3. Auth state not refreshed');
      } else {
        console.log('PROBLEM FOUND!');
        console.log('Company subscriptionStatus is:', status || 'NOT SET');
        console.log('');
        console.log('This is why employee sees "Nincs aktiv vallalati elofizetes"');
        console.log('');
        console.log('The company document needs subscriptionStatus = "active"');
      }
    }
  }

  process.exit(0);
}

investigate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
