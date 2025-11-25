const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Set Firestore to use emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp({
    projectId: 'dmaapp-477d4',
  });
}

const db = getFirestore();
const auth = getAuth();

// Test data
const testCategories = [
  {
    name: 'Webfejlesztés',
    description: 'Modern webalkalmazások fejlesztése és karbantartása',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Digitális Marketing',
    description: 'Online marketing stratégiák és eszközök',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'AI és Gépi Tanulás',
    description: 'Mesterséges intelligencia és gépi tanulás alapjai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Adatelemzés',
    description: 'Adatok elemzése és vizualizálása',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Mobilfejlesztés',
    description: 'iOS és Android alkalmazások fejlesztése',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const testUniversities = [
  {
    name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem',
    description: 'Magyarország vezető műszaki egyeteme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Eötvös Loránd Tudományegyetem',
    description: 'Magyarország legnagyobb egyeteme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Corvinus Egyetem',
    description: 'Gazdaságtudományi és társadalomtudományi képzés',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const testInstructors = [
  {
    name: 'Dr. Nagy Péter',
    title: 'Senior Software Engineer',
    bio: 'Több mint 10 éves tapasztalattal rendelkező szoftverfejlesztő és oktató. Specializációja a modern webes technológiák és a felhő alapú architektúrák.',
    profilePictureUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Dr. Kovács Anna',
    title: 'Data Science Expert',
    bio: 'Adattudományi szakértő, aki szenvedéllyel tanítja a Python adatelemzést és a gépi tanulás alapjait. PhD fokozattal rendelkezik adattudományból.',
    profilePictureUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Tóth Márk',
    title: 'Vezető Marketing Oktató',
    bio: 'Digitális marketing területén 8 éves tapasztalattal rendelkező szakember. Segített számos startupnak elindítani sikeres online marketingkampányokat.',
    profilePictureUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Dr. Szabó Gábor',
    title: 'AI Research Scientist',
    bio: 'Mesterséges intelligencia kutató és oktató. Nemzetközi konferenciákon publikált és több ML projektet vezetett nagyvállalatoknál.',
    profilePictureUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Kiss Katalin',
    title: 'iOS Development Lead',
    bio: 'Tapasztalt iOS fejlesztő, aki több mint 20 alkalmazást készített az App Store-ba. Szereti megosztani tudását a következő generáció fejlesztőivel.',
    profilePictureUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Production courses from DMA - filtered for real content
const testCourses = [
  {
    title: 'Integrálás Elve: 4 lépés, hogy a tanulás működjön',
    description: 'Nincs időd arra, hogy tanulj, de nem engedheted meg, hogy ne fejlődj. A probléma nem az, hogy nincsenek jó képzések, könyvek vagy rendszerek, hanem, hogy amit megtanulsz, az nem épül be a mindennapjaidba. A DMA Integrálási Elve egy tanulási módszer, amivel a tudást végre integrálni tudod a mindennapjaidba.',
    courseType: 'WEBINAR',
    language: 'hu',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    published: true,
    visibility: 'PUBLIC',
    certificateEnabled: false,
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/dmaapp-477d4.firebasestorage.app/o/courses%2Fthumbnails%2F1763326651744_Integra%CC%81la%CC%81s%20Elve%204%20le%CC%81pe%CC%81s%2C%20hogy%20a%20tanula%CC%81s%20mu%CC%8Bko%CC%88djo%CC%88n.png?alt=media&token=78058bec-7bc9-497e-8823-0a6fc88f71cd',
    shortDescription: 'Nincs időd arra, hogy tanulj, de nem engedheted meg, hogy ne fejlődj.',
    whatYouWillLearn: ['Cselekvésre való átállás', 'Gyakorlati megoldás elsajátítása', 'Tudomásul venni az időkorlátok realitását'],
    targetAudience: ['Vezetők', 'Munkatársak'],
    slug: 'integralas-elve-4-lepes-hogy-a-tanulas-mukodjon',
    price: 0,
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: 'module-webinar-1',
        title: 'Webinár',
        description: 'Webinár felvétel',
        order: 0,
        status: 'PUBLISHED',
        lessons: [
          {
            id: 'lesson-webinar-1',
            title: 'Integrálás Elve: 4 lépés, hogy a tanulás működjön',
            order: 0,
            type: 'VIDEO',
            muxPlaybackId: 'WzrucuQNnDlAizBrJhorKFE8Lgtj9hDcvZ1n9b1H31M',
            videoUrl: 'https://stream.mux.com/WzrucuQNnDlAizBrJhorKFE8Lgtj9hDcvZ1n9b1H31M',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ],
  },
  {
    title: 'Hogy maximalizáld Google hirdetéseid eredményét?',
    description: 'A Google hirdetések maximalizálása elengedhetetlen a hatékony online jelenléthez. A webináron felfedezheted, hogyan válassz megfelelő kulcsszavakat, hogy alakíts ki vonzó hirdetési szövegeket és tökéletes célközönséget, majd hogy hogyan elemezheted ki a hirdetési teljesítményt!',
    courseType: 'MASTERCLASS',
    language: 'hu',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    published: true,
    visibility: 'PUBLIC',
    certificateEnabled: false,
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/dmaapp-477d4.firebasestorage.app/o/courses%2Fthumbnails%2F1763825644524_685c24590336d40c06ead96d_How%20to%20get%20a%20Google%20Ads%20Certification%20%5B2025%5D.png?alt=media&token=cbd7ddfa-9a7b-4b11-b60b-3092d9a94c03',
    whatYouWillLearn: ['Google Ads hirdetések', 'Organikus első hely', 'Összes Google lehetőség'],
    slug: 'hogy-maximalzald-google-hirdeteseid-eredmenyet',
    price: 0,
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [],
  },
  {
    title: 'Miért a megfelelő emberek teszik naggyá a céged?',
    description: 'A sikeres vállalatokat nemcsak a jó stratégiák, hanem a megfelelő emberek is formálják. Ezen az egész napos képzésen megtudhatod, miért a kiváló munkatársak jelentik a legnagyobb értéket a cég számára, és hogyan járulnak hozzá a hosszú távú sikerhez.',
    courseType: 'ACADEMIA',
    language: 'hu',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    published: true,
    visibility: 'PUBLIC',
    certificateEnabled: false,
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/dmaapp-477d4.firebasestorage.app/o/courses%2Fthumbnails%2F1763331887043_Mie%CC%81rt%20a%20megfelelo%CC%8B%20emberek%20teszik%20naggya%CC%81%20a%20ce%CC%81ged%204%20re%CC%81szes.png?alt=media&token=e217f4a4-5a4d-4247-baeb-cb57b271e293',
    whatYouWillLearn: ['Szervezeti transzformáció megvalósítása', 'Motivációs technikák alkalmazása', 'Hatékony kiválasztási módszerek elsajátítása'],
    targetAudience: ['Vezetők', 'Munkatársak'],
    slug: 'miert-a-megfelelo-emberek-teszik-naggya-a-ceged',
    price: 0,
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: 'module-academia-1',
        title: 'Akadémia',
        order: 0,
        status: 'PUBLISHED',
        lessons: [
          {
            id: 'lesson-academia-1',
            title: '1. rész',
            order: 0,
            type: 'VIDEO',
            muxPlaybackId: 'PcMzxpsd5kBZzTQcMKg9vxkpSE8JK4bJ3AW7wnwwHmE',
            videoUrl: 'https://stream.mux.com/PcMzxpsd5kBZzTQcMKg9vxkpSE8JK4bJ3AW7wnwwHmE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'lesson-academia-2',
            title: '2. rész',
            order: 1,
            type: 'VIDEO',
            muxPlaybackId: '8vn2QvB1wSe7SqYXnvxtmQ01FwsAL6TdZ21ekHodBhhk',
            videoUrl: 'https://stream.mux.com/8vn2QvB1wSe7SqYXnvxtmQ01FwsAL6TdZ21ekHodBhhk',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'lesson-academia-3',
            title: '3. rész',
            order: 2,
            type: 'VIDEO',
            muxPlaybackId: 'CnkR3NjmbBDQK00YGD9uIfzwCsBVbjlOQODqMh7jJQ02A',
            videoUrl: 'https://stream.mux.com/CnkR3NjmbBDQK00YGD9uIfzwCsBVbjlOQODqMh7jJQ02A',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'lesson-academia-4',
            title: '4. rész',
            order: 3,
            type: 'VIDEO',
            muxPlaybackId: '49s7RA20102Iqr3S2x2xCk02KPcapd3Wy8bDzC01VBa1BFg',
            videoUrl: 'https://stream.mux.com/49s7RA20102Iqr3S2x2xCk02KPcapd3Wy8bDzC01VBa1BFg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ],
  },
  {
    title: 'Hogyan indíts el egy Facebook hirdetést?',
    description: 'Bemutatjuk, hogyan működik a Facebook Hirdetéskezelő rendszere, és mik ennek az alapjai. Átvesszük, milyen hirdetési lehetőségek vannak, és számodra melyek lehetnek a leghatékonyabbak. Majd elindítunk egyet élesben.',
    courseType: 'MASTERCLASS',
    language: 'hu',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    published: true,
    visibility: 'PUBLIC',
    certificateEnabled: false,
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/dmaapp-477d4.firebasestorage.app/o/courses%2Fthumbnails%2F1763822161501_facebookads.png?alt=media&token=e22d9a55-f6f2-4f36-9304-8414d349e905',
    whatYouWillLearn: ['Facebook Hirdetéskezelő alapjai', 'Hatékony hirdetési formátumok', 'Élles kampányindítás lépésről-lépésre'],
    slug: 'hogyan-indits-el-egy-facebook-hirdetest',
    price: 0,
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [],
  },
  {
    title: 'Mit kezdj egy jó szakemberrel, ha rongálja a csapatod?',
    description: 'Van egy jó szakembered, aki rongálja a csapatmunkát? Segítünk kezelni ezt a kihívást. Megmutatjuk, hogyan ismerd fel és kezeld a problémás viselkedést, miközben tiszteletben tartod a szakember értékeit, képességeit.',
    courseType: 'PODCAST',
    language: 'hu',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    published: true,
    visibility: 'PUBLIC',
    certificateEnabled: false,
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/dmaapp-477d4.firebasestorage.app/o/courses%2Fthumbnails%2F1763825477035_human-resource-management-hr-professional-to-selective-career-recruitment-sites-for-finding-new-talent-unemployment-in-job-search-by-allowing-them-to-register-their-resume-schedule-job-interview-photo.jpg?alt=media&token=edf31e4a-c01e-4fa5-9e91-be7faa4c4463',
    whatYouWillLearn: ['Problémás viselkedés felismerése', 'Hatékony kezelési technikák', 'Egyensúly teremtése csapatban'],
    slug: 'mit-kezdj-egy-jo-szakemberrel-ha-rongalja-a-csapatod',
    price: 0,
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [],
  },
  {
    title: 'Podcast: Facebook hirdetések kezdőknek',
    description: 'Bemutatjuk, hogyan működik a Facebook Hirdetéskezelő rendszere, és mik ennek az alapjai. Átvesszük, milyen hirdetési lehetőségek vannak, és számodra melyek lehetnek a leghatékonyabbak.',
    courseType: 'PODCAST',
    language: 'hu',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    published: true,
    visibility: 'PUBLIC',
    certificateEnabled: false,
    thumbnailUrl: 'https://firebasestorage.googleapis.com/v0/b/dmaapp-477d4.firebasestorage.app/o/courses%2Fthumbnails%2F1763824516550_facebookads.png?alt=media&token=e20be7e6-defa-4278-8380-ad9008ff806a',
    whatYouWillLearn: ['Facebook Hirdetéskezelő alapjai', 'Hatékony hirdetési formátumok', 'Élles kampányindítás lépésről-lépésre'],
    slug: 'podcast-facebook-hirdetesek-kezdoknek',
    price: 0,
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [],
  },
];



const testUsers = [
  {
    id: 'WUGJfyeG6pvuojUwWtnNHUpMC3un',
    email: 'admin@elira.hu',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    profilePictureUrl: null,
    title: 'System Administrator',
    bio: 'System administrator for Elira platform',
    companyRole: 'Admin',
    institution: 'Elira',
    credentials: ['System Admin'],
    specialties: ['Platform Management'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'jjCWRvVCERVBO4YWBlhxu3ynnyGx',
    email: 'nagypeter@elira.hu',
    firstName: 'Nagy',
    lastName: 'Péter',
    role: 'INSTRUCTOR',
    profilePictureUrl: null,
    title: 'Senior Software Engineer',
    bio: 'Több mint 10 éves tapasztalattal rendelkező szoftverfejlesztő és oktató',
    companyRole: 'Lead Developer',
    institution: 'Tech Solutions Kft.',
    credentials: ['MSc Computer Science', 'Google Cloud Certified'],
    specialties: ['React', 'Node.js', 'Cloud Architecture'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rvrvcbhX8NqV7bghm4umhfGuGuyo',
    email: 'kovacsjanos@elira.hu',
    firstName: 'Kovács',
    lastName: 'János',
    role: 'STUDENT',
    profilePictureUrl: null,
    title: 'Junior Developer',
    bio: 'Lelkes junior fejlesztő, aki szeretne tanulni',
    companyRole: 'Junior Developer',
    institution: 'StartUp Kft.',
    credentials: [],
    specialties: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8P3Kanza5Cak6esWIaehrCMigEJ1',
    email: 'szaboanna@elira.hu',
    firstName: 'Szabó',
    lastName: 'Anna',
    role: 'STUDENT',
    profilePictureUrl: null,
    title: 'Marketing Manager',
    bio: 'Marketing szakember, aki szeretne digitális készségeket tanulni',
    companyRole: 'Marketing Manager',
    institution: 'Marketing Agency',
    credentials: [],
    specialties: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    
    const usersSnapshot = await db.collection('users').get();
    const userBatch = db.batch();
    usersSnapshot.docs.forEach(doc => {
      userBatch.delete(doc.ref);
    });
    await userBatch.commit();

    const categoriesSnapshot = await db.collection('categories').get();
    const categoryBatch = db.batch();
    categoriesSnapshot.docs.forEach(doc => {
      categoryBatch.delete(doc.ref);
    });
    await categoryBatch.commit();

    const universitiesSnapshot = await db.collection('universities').get();
    const universityBatch = db.batch();
    universitiesSnapshot.docs.forEach(doc => {
      universityBatch.delete(doc.ref);
    });
    await universityBatch.commit();

    const coursesSnapshot = await db.collection('courses').get();
    const courseBatch = db.batch();
    coursesSnapshot.docs.forEach(doc => {
      courseBatch.delete(doc.ref);
    });
    await courseBatch.commit();

    const instructorsSnapshot = await db.collection('instructors').get();
    const instructorBatch = db.batch();
    instructorsSnapshot.docs.forEach(doc => {
      instructorBatch.delete(doc.ref);
    });
    await instructorBatch.commit();

    console.log('✅ Existing data cleared');

    // Clear existing Auth users in emulator
    console.log('🔐 Clearing Auth users...');
    try {
      const listUsersResult = await auth.listUsers();
      for (const userRecord of listUsersResult.users) {
        await auth.deleteUser(userRecord.uid);
      }
      console.log('✅ Auth users cleared');
    } catch (error) {
      console.log('⚠️  Could not clear auth users:', error.message);
    }

    // Create users in both Auth and Firestore
    console.log('👥 Creating users in Auth and Firestore...');
    for (const user of testUsers) {
      try {
        // Create Auth user
        await auth.createUser({
          uid: user.id,
          email: user.email,
          password: 'password123', // Default password for all test users
          displayName: `${user.firstName} ${user.lastName}`,
          emailVerified: true,
        });

        // Create Firestore user document
        await db.collection('users').doc(user.id).set(user);

        console.log(`✅ Created user: ${user.email} (password: password123)`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
      }
    }
    console.log(`✅ Created ${testUsers.length} users in Auth and Firestore`);

    // Create categories
    console.log('📚 Creating categories...');
    const categoryRefs = [];
    for (const category of testCategories) {
      const docRef = db.collection('categories').doc();
      categoryRefs.push(docRef);
      await docRef.set(category);
    }
    console.log(`✅ Created ${testCategories.length} categories`);

    // Create universities
    console.log('🏛️ Creating universities...');
    const universityRefs = [];
    for (const university of testUniversities) {
      const docRef = db.collection('universities').doc();
      universityRefs.push(docRef);
      await docRef.set(university);
    }
    console.log(`✅ Created ${testUniversities.length} universities`);

    // Create instructors
    console.log('👨‍🏫 Creating instructors...');
    const instructorRefs = [];
    for (const instructor of testInstructors) {
      const docRef = db.collection('instructors').doc();
      instructorRefs.push(docRef);
      await docRef.set(instructor);
    }
    console.log(`✅ Created ${testInstructors.length} instructors`);

    // Create courses with proper references
    console.log('📖 Creating courses...');
    const courseRefs = [];
    for (let i = 0; i < testCourses.length; i++) {
      const course = { ...testCourses[i] };

      // Extract modules from course data before saving
      const modules = course.modules || [];
      delete course.modules;

      // Assign category (cycle through categories)
      course.categoryId = categoryRefs[i % categoryRefs.length].id;

      // Assign university (cycle through universities)
      course.universityId = universityRefs[i % universityRefs.length].id;

      // Assign instructor (cycle through instructors)
      course.instructorId = instructorRefs[i % instructorRefs.length].id;
      
      const courseRef = await db.collection('courses').add(course);
      courseRefs.push(courseRef);
      
      // Create modules as subcollections
      if (modules.length > 0) {
        console.log(`📚 Creating ${modules.length} modules for course ${courseRef.id}`);
        for (const module of modules) {
          const moduleData = { ...module };
          const lessons = moduleData.lessons || [];
          delete moduleData.lessons;
          
          const moduleRef = await db
            .collection(`courses/${courseRef.id}/modules`)
            .add(moduleData);
          
          // Create lessons as subcollections
          if (lessons.length > 0) {
            console.log(`📝 Creating ${lessons.length} lessons for module ${moduleRef.id}`);
            for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
              const lesson = lessons[lessonIndex];
              // Use fixed ID like lesson-1, lesson-2, etc.
              const lessonId = `lesson-${lessonIndex + 1}`;
              const { id, ...lessonData } = lesson;
              await db
                .collection(`courses/${courseRef.id}/modules/${moduleRef.id}/lessons`)
                .doc(lessonId)
                .set(lessonData);
            }
          }
        }
      }
    }
    console.log(`✅ Created ${testCourses.length} courses with modules and lessons`);



    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ seedDatabase error:', error);
  }
}

seedDatabase(); 