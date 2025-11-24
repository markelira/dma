/**
 * Manual Employee Linking Script
 *
 * Links a registered user to their company if they have a pending invite
 * Usage: node scripts/link-employee-manually.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'dmaapp-477d4'
  });
}

const db = admin.firestore();

async function linkEmployeeManually(email) {
  console.log(`\n🔗 Attempting to link employee: ${email}\n`);

  try {
    // 1. Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log(`✅ Found user: ${userId}`);
    console.log(`   Name: ${userData.firstName} ${userData.lastName}`);

    // 2. Find pending employee invite
    // First, get all companies and check their employees subcollection
    const companiesSnapshot = await db.collection('companies').get();

    let employeeDoc = null;
    let companyDoc = null;

    for (const company of companiesSnapshot.docs) {
      const employeesSnapshot = await db.collection('companies')
        .doc(company.id)
        .collection('employees')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!employeesSnapshot.empty) {
        employeeDoc = employeesSnapshot.docs[0];
        companyDoc = company;
        break;
      }
    }

    if (!employeeDoc) {
      console.error(`❌ No employee invite found for: ${email}`);
      return;
    }

    const employeeData = employeeDoc.data();
    const companyId = companyDoc.id;
    const companyData = companyDoc.data();

    console.log(`✅ Found employee invite in company: ${companyData.name} (${companyId})`);
    console.log(`   Status: ${employeeData.status}`);

    if (employeeData.status === 'active' && employeeData.userId) {
      console.log(`ℹ️  Employee is already active and linked to user: ${employeeData.userId}`);
      return;
    }

    // 3. Update employee document
    console.log(`\n📝 Updating employee document...`);
    await employeeDoc.ref.update({
      userId: userId,
      status: 'active',
      inviteAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Employee document updated to active`);

    // 4. Set custom claims
    console.log(`📝 Setting custom claims...`);
    await admin.auth().setCustomUserClaims(userId, {
      role: 'COMPANY_EMPLOYEE',
      companyId: companyId,
    });
    console.log(`✅ Custom claims set`);

    // 5. Update user document
    console.log(`📝 Updating user document...`);
    await db.collection('users').doc(userId).update({
      companyId: companyId,
      companyRole: 'employee',
      role: 'COMPANY_EMPLOYEE',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ User document updated`);

    // 6. Auto-enroll in company masterclasses
    const purchasedMasterclasses = companyData.purchasedMasterclasses || [];
    if (purchasedMasterclasses.length > 0) {
      console.log(`📝 Enrolling in ${purchasedMasterclasses.length} masterclasses...`);

      await employeeDoc.ref.update({
        enrolledMasterclasses: purchasedMasterclasses,
      });

      const batch = db.batch();
      for (const masterclassId of purchasedMasterclasses) {
        const progressId = `${userId}_${masterclassId}`;
        const progressRef = db.collection('userProgress').doc(progressId);
        batch.set(progressRef, {
          userId,
          masterclassId,
          companyId,
          currentModule: 1,
          completedModules: [],
          status: 'active',
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      console.log(`✅ Enrolled in masterclasses`);
    }

    // 7. Log activity
    await db.collection('companies').doc(companyId).collection('activity').add({
      type: 'employee_joined',
      employeeId: employeeDoc.id,
      userId,
      employeeName: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
      joinedVia: 'manual_script',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`\n🎉 SUCCESS! ${email} is now linked to ${companyData.name}`);
    console.log(`   User must log out and log back in for claims to take effect.\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/link-employee-manually.js <email>');
  process.exit(1);
}

linkEmployeeManually(email).then(() => process.exit(0));
