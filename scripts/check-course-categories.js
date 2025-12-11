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

async function checkCourseCategories() {
  console.log('\n🔍 CHECKING COURSE CATEGORY DATA');
  console.log('='.repeat(80));

  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    console.log(`\n📚 Total courses: ${coursesSnapshot.size}\n`);

    let coursesWithCategories = 0;
    let coursesWithoutCategories = 0;
    let coursesWithCategoryIds = 0;
    let coursesWithCategoryId = 0;
    let coursesWithCategoryString = 0;

    const missingCategoryData = [];

    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      const hasCategoryIds = courseData.categoryIds && courseData.categoryIds.length > 0;
      const hasCategoryId = !!courseData.categoryId;
      const hasCategoryString = !!courseData.category;

      const hasAnyCategory = hasCategoryIds || hasCategoryId || hasCategoryString;

      if (hasAnyCategory) {
        coursesWithCategories++;
        if (hasCategoryIds) coursesWithCategoryIds++;
        if (hasCategoryId) coursesWithCategoryId++;
        if (hasCategoryString) coursesWithCategoryString++;
      } else {
        coursesWithoutCategories++;
        missingCategoryData.push({
          id: courseDoc.id,
          title: courseData.title || 'Unknown',
          courseType: courseData.courseType || 'Unknown'
        });
      }
    }

    // Print summary
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total courses: ${coursesSnapshot.size}`);
    console.log(`  ✅ With category data: ${coursesWithCategories}`);
    console.log(`     - With categoryIds (array): ${coursesWithCategoryIds}`);
    console.log(`     - With categoryId (single): ${coursesWithCategoryId}`);
    console.log(`     - With category (string): ${coursesWithCategoryString}`);
    console.log(`  ❌ Without category data: ${coursesWithoutCategories}`);

    if (missingCategoryData.length > 0) {
      console.log('\n⚠️  COURSES MISSING CATEGORY DATA:');
      console.log('='.repeat(80));
      missingCategoryData.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title}`);
        console.log(`   ID: ${course.id}`);
        console.log(`   Type: ${course.courseType}`);
        console.log('');
      });

      console.log('\n💡 RECOMMENDATION:');
      console.log('Update these courses with categoryId/categoryIds in the admin dashboard or');
      console.log('run a migration script to populate category data based on course type or tags.');
    }

    // Also check categories collection
    console.log('\n📁 CHECKING CATEGORIES COLLECTION:');
    console.log('='.repeat(80));
    const categoriesSnapshot = await db.collection('categories').get();
    console.log(`Total categories: ${categoriesSnapshot.size}`);

    if (!categoriesSnapshot.empty) {
      console.log('\nAvailable categories:');
      categoriesSnapshot.forEach((catDoc) => {
        const catData = catDoc.data();
        console.log(`  - ${catData.name} (ID: ${catDoc.id})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkCourseCategories()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
