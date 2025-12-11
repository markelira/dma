const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../secure/dmaapp-477d4-firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'dmaapp-477d4'
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'dmaapp-477d4'
      });
    } catch (err) {
      console.error('❌ Could not initialize Firebase Admin');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function verifyCategoryIds() {
  console.log('\n🔍 VERIFYING CATEGORY ID MATCHES');
  console.log('='.repeat(80));

  try {
    // Get all categories
    const categoriesSnapshot = await db.collection('categories').get();
    const categoryIds = new Set();
    const categories = {};

    console.log('\n📁 Available Categories:');
    categoriesSnapshot.forEach((catDoc) => {
      const catData = catDoc.data();
      categoryIds.add(catDoc.id);
      categories[catDoc.id] = catData.name;
      console.log(`  ${catData.name} (ID: ${catDoc.id})`);
    });

    // Get sample courses and check their categoryIds
    const coursesSnapshot = await db.collection('courses').limit(10).get();
    console.log('\n📚 Sample Courses (first 10):');
    console.log('='.repeat(80));

    let matchingCount = 0;
    let mismatchCount = 0;

    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      console.log(`\n📖 ${courseData.title}`);
      console.log(`   Course ID: ${courseDoc.id}`);
      console.log(`   Type: ${courseData.courseType}`);

      if (courseData.categoryId) {
        const matches = categoryIds.has(courseData.categoryId);
        console.log(`   categoryId: ${courseData.categoryId} ${matches ? '✅' : '❌'}`);
        if (matches) {
          console.log(`   Category Name: ${categories[courseData.categoryId]}`);
          matchingCount++;
        } else {
          console.log(`   ⚠️  This category ID does not exist in categories collection!`);
          mismatchCount++;
        }
      }

      if (courseData.categoryIds && courseData.categoryIds.length > 0) {
        console.log(`   categoryIds: [${courseData.categoryIds.join(', ')}]`);
        courseData.categoryIds.forEach((catId) => {
          const matches = categoryIds.has(catId);
          console.log(`     - ${catId} ${matches ? '✅' : '❌'}${matches ? ` (${categories[catId]})` : ' NOT FOUND'}`);
          if (!matches) mismatchCount++;
        });
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total categories in collection: ${categoryIds.size}`);
    console.log(`Sample courses checked: ${coursesSnapshot.size}`);
    console.log(`Category IDs matching: ${matchingCount > 0 ? 'YES' : 'SOME MISMATCHES'}`);
    console.log(`Mismatches found: ${mismatchCount}`);

    if (mismatchCount > 0) {
      console.log('\n⚠️  WARNING: Some courses have category IDs that don\'t exist in the categories collection!');
      console.log('This could explain why categories are not displaying on course cards.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

verifyCategoryIds()
  .then(() => {
    console.log('\n✅ Verification complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
