import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

// Input validation schema
const seedDatabaseSchema = z.object({
  force: z.boolean().optional().default(false)
});

export const seedDatabase = onCall(async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Felhasználónak be kell jelentkeznie');
    }

    // Check if user has ADMIN role
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('permission-denied', 'Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Csak admin felhasználók futtathatják ezt a funkciót');
    }

    // Validate input
    const { force } = seedDatabaseSchema.parse(request.data);

    console.log('🌱 Starting database seeding...');

    // Clear existing data if force is true
    if (force) {
      console.log('🗑️ Clearing existing data...');
      await clearExistingData();
    }

    // Define test data
    const categories = [
      {
        name: 'Webfejlesztés',
        description: 'Modern webalkalmazások fejlesztése és karbantartása',
        slug: 'webfejlesztes',
        icon: 'code',
        color: '#3B82F6'
      },
      {
        name: 'Digitális Marketing',
        description: 'Online marketing stratégiák és eszközök',
        slug: 'digitalis-marketing',
        icon: 'trending-up',
        color: '#10B981'
      },
      {
        name: 'AI és Gépi Tanulás',
        description: 'Mesterséges intelligencia és gépi tanulás alapjai',
        slug: 'ai-gepi-tanulas',
        icon: 'brain',
        color: '#8B5CF6'
      },
      {
        name: 'Adatelemzés',
        description: 'Adatok elemzése és vizualizálása',
        slug: 'adatelemzes',
        icon: 'bar-chart',
        color: '#F59E0B'
      },
      {
        name: 'Grafikai Tervezés',
        description: 'Digitális grafikai tervezés és UX/UI design',
        slug: 'grafikai-tervezes',
        icon: 'palette',
        color: '#EF4444'
      }
    ];

    const universities = [
      {
        name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem',
        slug: 'bme',
        description: 'Magyarország legnagyobb műszaki egyeteme',
        logo: null,
        website: 'https://www.bme.hu',
        location: 'Budapest'
      },
      {
        name: 'Eötvös Loránd Tudományegyetem',
        slug: 'elte',
        description: 'Magyarország legrégebbi egyeteme',
        logo: null,
        website: 'https://www.elte.hu',
        location: 'Budapest'
      },
      {
        name: 'Szegedi Tudományegyetem',
        slug: 'szte',
        description: 'Dél-Magyarország vezető egyeteme',
        logo: null,
        website: 'https://www.u-szeged.hu',
        location: 'Szeged'
      }
    ];

    const courses = [
      {
        title: 'React.js Alapok',
        description: 'Tanuld meg a modern webalkalmazások fejlesztését React.js-szel',
        categoryId: 'webfejlesztes',
        universityId: 'bme',
        instructorId: request.auth.uid,
        price: 29900,
        status: 'published',
        difficulty: 'beginner',
        language: 'hu',
        certificateEnabled: true,
        enrollmentCount: 0,
        ratingCount: 0,
        averageRating: 0,
        modules: [
          {
            title: 'React Bevezetés',
            order: 1,
            lessons: [
              {
                title: 'Mi az a React?',
                order: 1,
                duration: 15,
                type: 'video'
              },
              {
                title: 'Első React Komponens',
                order: 2,
                duration: 25,
                type: 'video'
              }
            ]
          }
        ]
      },
      {
        title: 'Digitális Marketing Stratégiák',
        description: 'Hatékony online marketing kampányok tervezése és végrehajtása',
        categoryId: 'digitalis-marketing',
        universityId: 'elte',
        instructorId: request.auth.uid,
        price: 39900,
        status: 'published',
        difficulty: 'intermediate',
        language: 'hu',
        certificateEnabled: true,
        enrollmentCount: 0,
        ratingCount: 0,
        averageRating: 0,
        modules: [
          {
            title: 'Marketing Alapok',
            order: 1,
            lessons: [
              {
                title: 'Digitális Marketing Bevezetés',
                order: 1,
                duration: 20,
                type: 'video'
              },
              {
                title: 'Célközönség Elemzés',
                order: 2,
                duration: 30,
                type: 'video'
              }
            ]
          }
        ]
      },
      {
        title: 'Python Gépi Tanulás',
        description: 'Gépi tanulási algoritmusok implementálása Python-ban',
        categoryId: 'ai-gepi-tanulas',
        universityId: 'szte',
        instructorId: request.auth.uid,
        price: 49900,
        status: 'published',
        difficulty: 'advanced',
        language: 'hu',
        certificateEnabled: true,
        enrollmentCount: 0,
        ratingCount: 0,
        averageRating: 0,
        modules: [
          {
            title: 'Gépi Tanulás Alapok',
            order: 1,
            lessons: [
              {
                title: 'Mi az a Gépi Tanulás?',
                order: 1,
                duration: 25,
                type: 'video'
              },
              {
                title: 'Python és NumPy',
                order: 2,
                duration: 35,
                type: 'video'
              }
            ]
          }
        ]
      },
      {
        title: 'Excel Adatelemzés',
        description: 'Professzionális adatelemzés Excel-ben és Power BI-ban',
        categoryId: 'adatelemzes',
        universityId: 'bme',
        instructorId: request.auth.uid,
        price: 19900,
        status: 'published',
        difficulty: 'beginner',
        language: 'hu',
        certificateEnabled: true,
        enrollmentCount: 0,
        ratingCount: 0,
        averageRating: 0,
        modules: [
          {
            title: 'Excel Alapok',
            order: 1,
            lessons: [
              {
                title: 'Excel Kezdő Lépések',
                order: 1,
                duration: 20,
                type: 'video'
              },
              {
                title: 'Adatok Formázása',
                order: 2,
                duration: 25,
                type: 'video'
              }
            ]
          }
        ]
      },
      {
        title: 'Figma UI/UX Design',
        description: 'Modern felhasználói felületek tervezése Figma-ban',
        categoryId: 'grafikai-tervezes',
        universityId: 'elte',
        instructorId: request.auth.uid,
        price: 34900,
        status: 'published',
        difficulty: 'intermediate',
        language: 'hu',
        certificateEnabled: true,
        enrollmentCount: 0,
        ratingCount: 0,
        averageRating: 0,
        modules: [
          {
            title: 'Figma Bevezetés',
            order: 1,
            lessons: [
              {
                title: 'Figma Alapok',
                order: 1,
                duration: 30,
                type: 'video'
              },
              {
                title: 'Komponensek Létrehozása',
                order: 2,
                duration: 40,
                type: 'video'
              }
            ]
          }
        ]
      }
    ];

    // Insert categories
    console.log('📂 Inserting categories...');
    const categoryRefs = await insertCategories(categories);

    // Insert universities
    console.log('🏛️ Inserting universities...');
    const universityRefs = await insertUniversities(universities);

    // Insert courses with proper references
    console.log('📚 Inserting courses...');
    await insertCourses(courses, categoryRefs, universityRefs);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Inserted: ${categories.length} categories, ${universities.length} universities, ${courses.length} courses`);

    return {
      success: true,
      message: 'Adatbázis sikeresen feltöltve',
      stats: {
        categories: categories.length,
        universities: universities.length,
        courses: courses.length
      }
    };

  } catch (error) {
    console.error('❌ Error in seedDatabase:', error);
    throw new HttpsError('internal', 'Hiba történt az adatbázis feltöltése során');
  }
});

export const seedDatabaseDev = onCall(async (request) => {
  try {
    console.log('🌱 Starting development database seeding...');

    // Define test data
    const categories = [
      {
        name: 'Webfejlesztés',
        description: 'Modern webalkalmazások fejlesztése és karbantartása',
        slug: 'webfejlesztes',
        icon: 'code',
        color: '#3B82F6'
      },
      {
        name: 'Digitális Marketing',
        description: 'Online marketing stratégiák és eszközök',
        slug: 'digitalis-marketing',
        icon: 'trending-up',
        color: '#10B981'
      },
      {
        name: 'AI és Gépi Tanulás',
        description: 'Mesterséges intelligencia és gépi tanulás alapjai',
        slug: 'ai-gepi-tanulas',
        icon: 'brain',
        color: '#8B5CF6'
      },
      {
        name: 'Adatelemzés',
        description: 'Adatok elemzése és vizualizálása',
        slug: 'adatelemzes',
        icon: 'bar-chart',
        color: '#F59E0B'
      },
      {
        name: 'Grafikai Tervezés',
        description: 'Digitális grafikai tervezés és UX/UI design',
        slug: 'grafikai-tervezes',
        icon: 'palette',
        color: '#EF4444'
      }
    ];

    const universities = [
      {
        name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem',
        slug: 'bme',
        description: 'Magyarország legnagyobb műszaki egyeteme',
        logoUrl: null,
        website: 'https://www.bme.hu',
        location: 'Budapest'
      },
      {
        name: 'Eötvös Loránd Tudományegyetem',
        slug: 'elte',
        description: 'Magyarország legrégebbi egyeteme',
        logoUrl: null,
        website: 'https://www.elte.hu',
        location: 'Budapest'
      },
      {
        name: 'Szegedi Tudományegyetem',
        slug: 'szte',
        description: 'Dél-Magyarország vezető egyeteme',
        logoUrl: null,
        website: 'https://www.u-szeged.hu',
        location: 'Szeged'
      }
    ];

    const courses = [
      {
        title: 'React és Next.js Alapok',
        description: 'Modern webalkalmazások fejlesztése React és Next.js segítségével',
        slug: 'react-nextjs-alapok',
        categoryId: 'webfejlesztes',
        universityId: 'bme',
        instructorId: 'dev-instructor',
        language: 'hu',
        difficulty: 'BEGINNER',
        status: 'PUBLISHED',
        isPlus: false,
        priceHUF: 0,
        certificateEnabled: true,
        thumbnailUrl: '/images/course-placeholder.png',
        metaDescription: 'Tanulja meg a React és Next.js alapjait',
        keywords: ['react', 'nextjs', 'web', 'fejlesztés'],
        visibility: 'PUBLIC',
        enrollmentCount: 0,
        averageRating: 0,
        ratingCount: 0,
        moduleCount: 3,
        lessonCount: 12,
        totalDuration: 3600,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        title: 'Digitális Marketing Stratégiák',
        description: 'Hatékony online marketing kampányok tervezése és végrehajtása',
        slug: 'digitalis-marketing-strategiak',
        categoryId: 'digitalis-marketing',
        universityId: 'elte',
        instructorId: 'marketing-instructor',
        language: 'hu',
        difficulty: 'INTERMEDIATE',
        status: 'PUBLISHED',
        isPlus: true,
        priceHUF: 25000,
        certificateEnabled: true,
        thumbnailUrl: '/images/course-placeholder.png',
        metaDescription: 'Digitális marketing stratégiák és eszközök',
        keywords: ['marketing', 'digitális', 'online', 'kampány'],
        visibility: 'PUBLIC',
        enrollmentCount: 0,
        averageRating: 0,
        ratingCount: 0,
        moduleCount: 4,
        lessonCount: 16,
        totalDuration: 4800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        title: 'Python Gépi Tanulás',
        description: 'Gépi tanulási algoritmusok implementálása Python-ban',
        slug: 'python-gepi-tanulas',
        categoryId: 'ai-gepi-tanulas',
        universityId: 'szte',
        instructorId: 'ai-instructor',
        language: 'hu',
        difficulty: 'ADVANCED',
        status: 'PUBLISHED',
        isPlus: true,
        priceHUF: 35000,
        certificateEnabled: true,
        thumbnailUrl: '/images/course-placeholder.png',
        metaDescription: 'Gépi tanulás Python programozási nyelvben',
        keywords: ['python', 'gépi tanulás', 'ai', 'algoritmus'],
        visibility: 'PUBLIC',
        enrollmentCount: 0,
        averageRating: 0,
        ratingCount: 0,
        moduleCount: 5,
        lessonCount: 20,
        totalDuration: 6000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }
    ];

    // Insert data
    const categoryRefs = await insertCategories(categories);
    const universityRefs = await insertUniversities(universities);

    // Insert initial courses and capture references
    const courseRefs = await insertCourses(courses, categoryRefs, universityRefs);

    // ----- OBJECTIVES --------------------------------------------------
    const objectives = [
      { name: 'Karrierváltás', description: 'Új karriert kezdeni a tech szektorban', slug: 'karriervaltas', icon: 'briefcase', color: '#3B82F6' },
      { name: 'Készségfejlesztés', description: 'Meglévő készségek bővítése és fejlesztése', slug: 'keszsegfejlesztes', icon: 'trending-up', color: '#10B981' },
      { name: 'Egyetemi Felkészülés', description: 'Egyetemi tanulmányokra való felkészülés', slug: 'egyetemi-felkeszules', icon: 'graduation-cap', color: '#8B5CF6' },
      { name: 'Vállalati Képzés', description: 'Munkahelyi továbbképzés és fejlődés', slug: 'vallalati-kepzes', icon: 'building', color: '#F59E0B' },
    ];

    // ----- SAMPLE USERS -----------------------------------------------
    const sampleUsers = [
      { id: 'student-1', email: 'anna.kovacs@example.com', firstName: 'Anna', lastName: 'Kovács', role: 'STUDENT', institution: 'BME', companyRole: null, createdAt: new Date('2024-01-15').toISOString(), updatedAt: new Date('2024-01-15').toISOString() },
      { id: 'student-2', email: 'peter.nagy@example.com', firstName: 'Péter', lastName: 'Nagy', role: 'STUDENT', institution: 'ELTE', companyRole: 'Junior Developer', createdAt: new Date('2024-02-10').toISOString(), updatedAt: new Date('2024-02-10').toISOString() },
      { id: 'student-3', email: 'eszter.toth@example.com', firstName: 'Eszter', lastName: 'Tóth', role: 'STUDENT', institution: 'SZTE', companyRole: null, createdAt: new Date('2024-03-05').toISOString(), updatedAt: new Date('2024-03-05').toISOString() },
      { id: 'student-4', email: 'gabor.szabo@example.com', firstName: 'Gábor', lastName: 'Szabó', role: 'STUDENT', institution: null, companyRole: 'Marketing Manager', createdAt: new Date('2024-02-20').toISOString(), updatedAt: new Date('2024-02-20').toISOString() },
    ];

    // ----- ADDITIONAL PUBLISHED COURSES -------------------------------
    const additionalCourses = [
      { title: 'Digitális Marketing Stratégia', description: 'Hatékony online marketing kampányok tervezése és megvalósítása', slug: 'digitalis-marketing-strategia', categoryId: 'digitalis-marketing', universityId: 'elte', instructorId: 'marketing-instructor', language: 'hu', difficulty: 'INTERMEDIATE', status: 'PUBLISHED', isPlus: false, priceHUF: 29900, certificateEnabled: true, thumbnailUrl: '/images/course-placeholder.png', metaDescription: 'Professzionális digitális marketing stratégiák', keywords: ['marketing', 'digital', 'social media', 'SEO'], tags: ['marketing', 'SEO', 'social-media'], estimatedDuration: 480, createdAt: new Date('2024-01-10').toISOString(), updatedAt: new Date('2024-01-10').toISOString() },
      { title: 'Python Adatelemzés', description: 'Adatok elemzése és vizualizálása Python segítségével', slug: 'python-adatelemzes', categoryId: 'adatelemzes', universityId: 'szte', instructorId: 'data-instructor', language: 'hu', difficulty: 'INTERMEDIATE', status: 'PUBLISHED', isPlus: true, priceHUF: 39900, certificateEnabled: true, thumbnailUrl: '/images/course-placeholder.png', metaDescription: 'Python programozás adatelemzéshez', keywords: ['python', 'data', 'analytics', 'pandas'], tags: ['python', 'data-science', 'analytics'], estimatedDuration: 600, createdAt: new Date('2024-02-15').toISOString(), updatedAt: new Date('2024-02-15').toISOString() },
      { title: 'UI/UX Design Alapok', description: 'Felhasználói élmény és interfész tervezés alapjai', slug: 'ui-ux-design-alapok', categoryId: 'grafikai-tervezes', universityId: 'bme', instructorId: 'design-instructor', language: 'hu', difficulty: 'BEGINNER', status: 'PUBLISHED', isPlus: false, priceHUF: 24900, certificateEnabled: true, thumbnailUrl: '/images/course-placeholder.png', metaDescription: 'Modern UI/UX tervezési módszerek', keywords: ['design', 'ui', 'ux', 'figma'], tags: ['design', 'ui', 'ux', 'figma'], estimatedDuration: 360, createdAt: new Date('2024-03-01').toISOString(), updatedAt: new Date('2024-03-01').toISOString() },
    ];

    // Insert additional courses and merge refs
    const additionalCourseRefs = await insertCourses(additionalCourses, categoryRefs, universityRefs);
    const allCourseRefs = { ...courseRefs, ...additionalCourseRefs };

    // ----- REVIEWS ----------------------------------------------------
    const reviews = [
      { userId: 'student-1', courseId: 'react-nextjs-alapok', rating: 5, comment: 'Fantasztikus kurzus! Nagyon jól felépített, könnyen követhető. A gyakorlati példák segítettek megérteni a React alapjait.', isApproved: true, createdAt: new Date('2024-01-20').toISOString(), updatedAt: new Date('2024-01-20').toISOString() },
      { userId: 'student-2', courseId: 'digitalis-marketing-strategia', rating: 5, comment: 'Kiváló marketing kurzus! Sok gyakorlati tippet kaptam, amit rögtön alkalmaztam a munkámban. Mindenkinek ajánlom!', isApproved: true, createdAt: new Date('2024-02-25').toISOString(), updatedAt: new Date('2024-02-25').toISOString() },
      { userId: 'student-3', courseId: 'python-adatelemzes', rating: 4, comment: 'Nagyon hasznos kurzus volt. A Python basics-től indult, de hamar eljutottunk a komolyabb adatelemzési technikákig.', isApproved: true, createdAt: new Date('2024-03-10').toISOString(), updatedAt: new Date('2024-03-10').toISOString() },
      { userId: 'student-4', courseId: 'ui-ux-design-alapok', rating: 5, comment: 'Tökéletes bevezető kurzus! Még sosem foglalkoztam tervezéssel, de ez a kurzus világossá tette az alapokat.', isApproved: true, createdAt: new Date('2024-03-15').toISOString(), updatedAt: new Date('2024-03-15').toISOString() },
      { userId: 'student-1', courseId: 'digitalis-marketing-strategia', rating: 4, comment: 'Jó kurzus, sok hasznos információval. Különösen a social media marketing rész tetszett.', isApproved: true, createdAt: new Date('2024-03-20').toISOString(), updatedAt: new Date('2024-03-20').toISOString() },
    ];

    // ----- ENROLLMENTS -----------------------------------------------
    const enrollments = [
      { id: 'student-1_react-nextjs-alapok', userId: 'student-1', courseId: 'react-nextjs-alapok', enrolledAt: new Date('2024-01-16').toISOString(), status: 'ACTIVE', progress: 75, completedAt: null },
      { id: 'student-2_digitalis-marketing-strategia', userId: 'student-2', courseId: 'digitalis-marketing-strategia', enrolledAt: new Date('2024-02-12').toISOString(), status: 'COMPLETED', progress: 100, completedAt: new Date('2024-02-24').toISOString() },
      { id: 'student-3_python-adatelemzes', userId: 'student-3', courseId: 'python-adatelemzes', enrolledAt: new Date('2024-03-06').toISOString(), status: 'ACTIVE', progress: 60, completedAt: null },
      { id: 'student-4_ui-ux-design-alapok', userId: 'student-4', courseId: 'ui-ux-design-alapok', enrolledAt: new Date('2024-03-02').toISOString(), status: 'COMPLETED', progress: 100, completedAt: new Date('2024-03-14').toISOString() },
    ];

    // Insert new collections
    await insertObjectives(objectives);
    await insertUsers(sampleUsers);
    await insertReviews(reviews, allCourseRefs);
    await insertEnrollments(enrollments, allCourseRefs);

    console.log('✅ Development seeding completed successfully!');

    return {
      success: true,
      message: 'Development adatok sikeresen feltöltve',
      stats: {
        categories: categories.length,
        universities: universities.length,
        courses: courses.length + additionalCourses.length,
        objectives: objectives.length,
        users: sampleUsers.length,
        reviews: reviews.length,
        enrollments: enrollments.length,
      }
    };

  } catch (error: any) {
    console.error('❌ Development seeding error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

async function clearExistingData() {
  const batch = admin.firestore().batch();
  
  // Clear categories
  const categoriesSnapshot = await admin.firestore().collection('categories').get();
  categoriesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear universities
  const universitiesSnapshot = await admin.firestore().collection('universities').get();
  universitiesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear courses
  const coursesSnapshot = await admin.firestore().collection('courses').get();
  coursesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

async function insertCategories(categories: any[]) {
  const batch = admin.firestore().batch();
  const refs: { [key: string]: any } = {};

  categories.forEach(category => {
    const ref = admin.firestore().collection('categories').doc();
    batch.set(ref, {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    refs[category.slug] = ref;
  });

  await batch.commit();
  return refs;
}

async function insertUniversities(universities: any[]) {
  const batch = admin.firestore().batch();
  const refs: { [key: string]: any } = {};

  universities.forEach(university => {
    const ref = admin.firestore().collection('universities').doc();
    batch.set(ref, {
      ...university,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    refs[university.slug] = ref;
  });

  await batch.commit();
  return refs;
}

async function insertCourses(courses: any[], categoryRefs: any, universityRefs: any) {
  const batch = admin.firestore().batch();
  const refs: { [key: string]: any } = {};

  for (const course of courses) {
    const courseRef = admin.firestore().collection('courses').doc();
    
    // Get the actual document references
    const categoryRef = categoryRefs[course.categoryId];
    const universityRef = universityRefs[course.universityId];
    
    if (!categoryRef || !universityRef) {
      console.warn(`⚠️ Missing reference for course ${course.title}: categoryId=${course.categoryId}, universityId=${course.universityId}`);
      continue;
    }

    // Insert course
    batch.set(courseRef, {
      title: course.title,
      description: course.description,
      slug: course.slug,
      categoryId: categoryRef.id,
      universityId: universityRef.id,
      instructorId: course.instructorId ?? 'system',

      // Pricing / visibility
      priceHUF: course.priceHUF ?? 0,
      isPlus: course.isPlus ?? false,
      status: course.status ?? 'PUBLISHED',
      difficulty: course.difficulty ?? 'BEGINNER',
      language: course.language ?? 'hu',
      certificateEnabled: course.certificateEnabled ?? true,

      // Counters – default to 0 to satisfy Firestore validation
      enrollmentCount: course.enrollmentCount ?? 0,
      ratingCount: course.ratingCount ?? 0,
      averageRating: course.averageRating ?? 0,
      moduleCount: course.moduleCount ?? 0,
      lessonCount: course.lessonCount ?? 0,
      totalDuration: course.totalDuration ?? 0,

      thumbnailUrl: course.thumbnailUrl ?? null,
      metaDescription: course.metaDescription ?? '',
      keywords: course.keywords ?? [],
      tags: course.tags ?? [],
      visibility: course.visibility ?? 'PUBLIC',

      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    });
    refs[course.slug] = courseRef; // Store the reference by slug

    // Create modules and lessons subcollections (generate defaults if none provided)
    let modulesToInsert = Array.isArray(course.modules) && course.modules.length > 0
      ? course.modules
      : [
          {
            title: 'Bevezető modul',
            order: 1,
            lessons: [
              { title: 'Bevezető lecke', order: 1, duration: 10, type: 'video' },
              { title: 'Első gyakorlati lecke', order: 2, duration: 20, type: 'video' },
            ],
          },
        ];

    modulesToInsert.forEach((mod: any, mIndex: number) => {
        const moduleId = `module-${mIndex + 1}`;
        const moduleRef = courseRef.collection('modules').doc(moduleId);
        batch.set(moduleRef, {
          title: mod.title,
          order: mod.order ?? mIndex + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (Array.isArray(mod.lessons)) {
          mod.lessons.forEach((les: any, lIndex: number) => {
            const lessonId = `lesson-${lIndex + 1}`;
            const lessonRef = moduleRef.collection('lessons').doc(lessonId);
            batch.set(lessonRef, {
              title: les.title,
              order: les.order ?? lIndex + 1,
              duration: les.duration ?? 0,
              type: les.type ?? 'video',
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Also create a root-level lessons document for lookup functions
            const globalLessonRef = admin.firestore().collection('lessons').doc(lessonId);
            batch.set(globalLessonRef, {
              title: les.title,
              order: les.order ?? lIndex + 1,
              duration: les.duration ?? 0,
              type: les.type ?? 'video',
              courseId: courseRef.id,
              moduleId: moduleId,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          });
        }
      });

    admin.firestore().collection('categories').doc(categoryRef.id)
      .update({ courseCount: FieldValue.increment(1) });
  }

  await batch.commit();
  return refs;
} 

async function insertObjectives(objectives: any[]) {
  const batch = admin.firestore().batch();
  objectives.forEach(obj => {
    const ref = admin.firestore().collection('objectives').doc();
    batch.set(ref, {
      ...obj,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  await batch.commit();
}

async function insertUsers(users: any[]) {
  const batch = admin.firestore().batch();
  users.forEach(user => {
    const ref = admin.firestore().collection('users').doc(user.id);
    batch.set(ref, user);
  });
  await batch.commit();
}

async function insertReviews(reviews: any[], courseRefs: any) {
  const batch = admin.firestore().batch();
  reviews.forEach(review => {
    const courseRef = courseRefs[review.courseId];
    if (courseRef) {
      const ref = admin.firestore().collection('reviews').doc();
      batch.set(ref, {
        ...review,
        courseId: courseRef.id,
      });
    }
  });
  await batch.commit();
}

async function insertEnrollments(enrollments: any[], courseRefs: any) {
  const batch = admin.firestore().batch();
  enrollments.forEach(enrollment => {
    const courseRef = courseRefs[enrollment.courseId];
    if (courseRef) {
      const ref = admin.firestore().collection('enrollments').doc(enrollment.id);
      batch.set(ref, {
        ...enrollment,
        courseId: courseRef.id,
      });
    }
  });
  await batch.commit();
} 