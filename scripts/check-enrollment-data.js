/**
 * Check Enrollment Data for Employee
 * Validates the data flow hypothesis
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'dmaapp-477d4-firebase-adminsdk-fbsvc-08ddddf333.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'dmaapp-477d4'
  });
}

const db = admin.firestore();

async function checkEnrollmentData(email) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 CHECKING ENROLLMENT DATA FOR: ${email}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // 1. Find user by email
    console.log('📋 1. FINDING USER...');
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`   ❌ No user found with email: ${email}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log(`   ✅ Found user: ${userId}`);
    console.log(`   - Name: ${userData.firstName} ${userData.lastName}`);
    console.log(`   - Role: ${userData.role}`);
    console.log(`   - CompanyId: ${userData.companyId || 'NONE'}`);
    console.log(`   - CompanyRole: ${userData.companyRole || 'NONE'}`);
    console.log(`   - SubscriptionStatus: ${userData.subscriptionStatus || 'NONE'}`);

    // 2. Check enrollments for this user
    console.log('\n📋 2. CHECKING ENROLLMENTS COLLECTION...');
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('userId', '==', userId)
      .get();

    console.log(`   Found ${enrollmentsSnapshot.size} enrollment documents`);
    if (enrollmentsSnapshot.size > 0) {
      enrollmentsSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`   [${i + 1}] ${doc.id}:`);
        console.log(`       - courseId: ${data.courseId}`);
        console.log(`       - status: ${data.status}`);
        console.log(`       - enrolledByCompany: ${data.enrolledByCompany || 'NONE'}`);
        console.log(`       - enrolledAt: ${data.enrolledAt}`);
      });
    } else {
      console.log(`   ❌ NO ENROLLMENTS FOUND - This is the problem!`);
    }

    // 3. Check employee document
    const companyId = userData.companyId;
    if (companyId) {
      console.log(`\n📋 3. CHECKING EMPLOYEE DOCUMENT IN COMPANY ${companyId}...`);

      const employeesSnapshot = await db.collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!employeesSnapshot.empty) {
        const empDoc = employeesSnapshot.docs[0];
        const empData = empDoc.data();
        console.log(`   ✅ Found employee doc: ${empDoc.id}`);
        console.log(`   - Status: ${empData.status}`);
        console.log(`   - UserId: ${empData.userId || 'NONE'}`);
        console.log(`   - EnrolledMasterclasses: ${JSON.stringify(empData.enrolledMasterclasses || [])}`);
      } else {
        console.log(`   ❌ No employee document found`);
      }

      // 4. Check company's enrolledCourses subcollection
      console.log(`\n📋 4. CHECKING COMPANY'S enrolledCourses SUBCOLLECTION...`);
      const enrolledCoursesSnapshot = await db.collection('companies')
        .doc(companyId)
        .collection('enrolledCourses')
        .get();

      console.log(`   Found ${enrolledCoursesSnapshot.size} courses in enrolledCourses subcollection`);
      enrolledCoursesSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`   [${i + 1}] ${doc.id}:`);
        console.log(`       - courseName: ${data.courseName || data.title || 'N/A'}`);
        console.log(`       - enrolledAt: ${data.enrolledAt}`);
        console.log(`       - enrolledBy: ${data.enrolledBy || 'N/A'}`);
      });

      // 5. Check company's purchasedMasterclasses field (old system)
      console.log(`\n📋 5. CHECKING COMPANY's purchasedMasterclasses FIELD (OLD SYSTEM)...`);
      const companyDoc = await db.collection('companies').doc(companyId).get();
      const companyData = companyDoc.data();
      const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];
      console.log(`   purchasedMasterclasses array: ${JSON.stringify(purchasedMasterclasses)}`);
      console.log(`   Length: ${purchasedMasterclasses.length}`);

      // 6. Check userProgress for this user
      console.log(`\n📋 6. CHECKING userProgress COLLECTION...`);
      const progressSnapshot = await db.collection('userProgress')
        .where('userId', '==', userId)
        .get();

      console.log(`   Found ${progressSnapshot.size} progress documents`);
      progressSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`   [${i + 1}] ${doc.id}:`);
        console.log(`       - masterclassId/courseId: ${data.masterclassId || data.courseId}`);
        console.log(`       - companyId: ${data.companyId || 'NONE'}`);
        console.log(`       - status: ${data.status}`);
      });
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`User: ${userId} (${email})`);
    console.log(`CompanyId: ${userData.companyId || 'NONE'}`);
    console.log(`Enrollments in 'enrollments' collection: ${enrollmentsSnapshot.size}`);

    if (enrollmentsSnapshot.size === 0 && userData.companyId) {
      console.log(`\n⚠️  DIAGNOSIS: User has companyId but NO enrollment records!`);
      console.log(`   This confirms the hypothesis: enrollments were not created`);
      console.log(`   because employee was not active when courses were added.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

const email = process.argv[2] || 'fudede@denipl.com';
checkEnrollmentData(email).then(() => process.exit(0));
