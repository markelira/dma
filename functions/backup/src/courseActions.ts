import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import Stripe from 'stripe';
import { firestore, auth } from './config';

// Initialize Stripe
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore'

// Temporarily comment out Stripe for seeding
// const stripeSecretKey = functions.config().stripe.secret_key;
// if (!stripeSecretKey) {
//   throw new Error('STRIPE_SECRET_KEY is not set in functions config');
// }

// const stripe = new Stripe(stripeSecretKey, {
//   apiVersion: '2023-10-16',
// });

// Enums (moved from Prisma)
enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  PENDING_REVIEW = 'PENDING_REVIEW'
}

enum CourseVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Zod schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(1, 'A cím kötelező.'),
  description: z.string().min(1, 'A leírás kötelező.'),
  categoryId: z.string().min(1, 'Kategória kötelező.'),
  instructorId: z.string().min(1, 'Oktató kötelező.'),
  language: z.string().min(2),
  difficulty: z.nativeEnum(ExperienceLevel),
  certificateEnabled: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
  visibility: z.nativeEnum(CourseVisibility).optional(),
  // Stripe one-time payment fields
  priceHUF: z.number().positive().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  // Legacy subscription field kept for backward compatibility
  paymentPriceId: z.string().optional(),
  // Stripe IDs – initially null, will be set after Stripe calls
  stripeProductId: z.string().nullish(),
  stripePriceId: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  publishDate: z.string().datetime().optional(),
  enrollmentStart: z.string().datetime().optional(),
  enrollmentEnd: z.string().datetime().optional(),
  capacity: z.number().int().positive().optional(),
  isPlus: z.boolean().default(false),
}).refine((data) => data.isPlus || data.priceHUF !== undefined, {
  message: 'priceHUF is required when isPlus is false',
  path: ['priceHUF'],
});

/**
 * Create Stripe Product + one-time Price for a specific course.
 */
const createProductAndPrice = async (course: {
  id?: string;
  title: string;
  description?: string;
  priceHUF: number;
}) => {
  // Temporarily disabled for seeding
  throw new Error('Stripe integration temporarily disabled for seeding');
  
  // NOTE: HUF is zero-decimal – unit_amount is in forints
  // const product = await stripe.products.create({
  //   name: course.title,
  //   description: course.description,
  //   metadata: {
  //     courseId: course.id ?? 'PENDING',
  //     type: 'one_time_course',
  //   },
  // });

  // const price = await stripe.prices.create({
  //   product: product.id,
  //   unit_amount: course.priceHUF,
  //   currency: 'huf',
  // });

  // return { product, price };
};

/**
 * Patch a Stripe product metadata with the final Firestore courseId once we know it.
 */
const updateProductCourseId = async (productId: string, courseId: string) => {
  // Temporarily disabled for seeding
  throw new Error('Stripe integration temporarily disabled for seeding');
  
  // await stripe.products.update(productId, { metadata: { courseId } });
};

/**
 * Enrich a course object with instructor and category data
 */
const enrichCourse = async (course: any) => {
  let instructor = null;
  let category = null;

  // Lookup instructor data
  if (course.instructorId) {
    try {
      const instructorDoc = await firestore.collection('users').doc(course.instructorId).get();
      if (instructorDoc.exists) {
        const instructorData = instructorDoc.data();
        instructor = {
          id: instructorDoc.id,
          firstName: instructorData?.firstName || 'Ismeretlen',
          lastName: instructorData?.lastName || 'Oktató',
          profilePictureUrl: instructorData?.profilePictureUrl || undefined,
        };
      }
    } catch (error) {
      console.warn(`Failed to lookup instructor ${course.instructorId} for course ${course.id}:`, error);
    }
  }

  // Lookup category data
  if (course.categoryId) {
    try {
      const categoryDoc = await firestore.collection('categories').doc(course.categoryId).get();
      if (categoryDoc.exists) {
        const categoryData = categoryDoc.data();
        category = {
          id: categoryDoc.id,
          name: categoryData?.name || 'Ismeretlen kategória',
        };
      }
    } catch (error) {
      console.warn(`Failed to lookup category ${course.categoryId} for course ${course.id}:`, error);
    }
  }

  // Return enriched course with safe fallbacks
  return {
    ...course,
    instructor: instructor ?? {
      id: course.instructorId || 'unknown',
      firstName: 'Ismeretlen',
      lastName: 'Oktató',
      profilePictureUrl: undefined,
    },
    category: category ?? {
      id: course.categoryId || 'unknown',
      name: 'Ismeretlen kategória',
    },
  };
};

/**
 * Create a new course (Callable Cloud Function)
 */
export const createCourse = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Nincs jogosultság kurzus létrehozásához.');
    }

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság kurzus létrehozásához.');
    }

    // Force Plus model in local dev so Stripe is not required
    const rawData = {
      ...request.data,
      isPlus: true,
    };

    // Validate input data
    const data = createCourseSchema.parse(rawData);

    // Build course document
    const courseData = {
      ...data,
      stripeProductId: null,
      stripePriceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const courseRef = await firestore.collection('courses').add(courseData);

    return {
      success: true,
      course: { id: courseRef.id, ...courseData },
      message: 'Kurzus sikeresen létrehozva.',
    };
  } catch (error: any) {
    console.error('createCourse error:', error);
    return {
      success: false,
      error: error.message || 'Hiba történt a kurzus létrehozása során',
    };
  }
});

/**
 * Get courses with filtering and pagination (Public function - no authentication required)
 */
export const getCourses = onRequest(async (request, response) => {
  try {
    const {
      sort = 'createdAt',
      order = 'desc',
      limit = 10,
      offset = 0,
      categoryId,
      search,
      status,
      universityId,
      isPlus,
      difficulty,
      language,
      certificateEnabled,
    } = request.query || {};

    // Convert string values to appropriate types
    const limitNum = parseInt(limit as string) || 10;
    const offsetNum = parseInt(offset as string) || 0;

    // Build query
    let query: any = firestore.collection('courses');

    // Apply filters
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (universityId) {
      query = query.where('universityId', '==', universityId);
    }
    if (isPlus !== undefined) {
      query = query.where('isPlus', '==', isPlus === 'true');
    }
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }
    if (language) {
      query = query.where('language', '==', language);
    }
    if (certificateEnabled !== undefined) {
      query = query.where('certificateEnabled', '==', certificateEnabled === 'true');
    }

    // Apply sorting
    query = query.orderBy(sort as string, order as 'asc' | 'desc');

    // Get total count for pagination
    const totalQuery = query;
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum);

    // Execute query
    const snapshot = await query.get();
    const courses = snapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Apply search filter if provided (client-side for now)
    let filteredCourses = courses;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredCourses = courses.filter((course: any) => 
        course.title?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    response.json({
      success: true,
      courses: filteredCourses,
      total
    });

  } catch (error: any) {
    console.error('❌ getCourses error:', error);
    
    response.status(500).json({
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    });
  }
}); 

export const getCourse = onCall(async (request) => {
  try {
    const { courseId: inputCourseId } = request.data || {};
    let courseId = inputCourseId; // Make it mutable for slug lookup fix
    console.log('🔍 [getCourse] Called with courseId:', courseId);
    
    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }

    // Attempt to fetch by ID
    let courseDoc = await firestore.collection('courses').doc(courseId).get();
    console.log('🔍 [getCourse] Course document exists:', courseDoc.exists);
    
    // Fallback: if not found, query by slug field
    if (!courseDoc.exists) {
      console.log('🔍 [getCourse] Trying slug fallback for:', courseId);
      const slugQuery = await firestore
        .collection('courses')
        .where('slug', '==', courseId)
        .limit(1)
        .get();
      if (!slugQuery.empty) {
        courseDoc = slugQuery.docs[0];
        // CRITICAL FIX: Update courseId to use actual document ID for subcollections
        courseId = courseDoc.id;
        console.log('🔍 [getCourse] Found by slug, using document ID:', courseId);
      } else {
        console.log('❌ [getCourse] Course not found by ID or slug:', courseId);
        throw new Error('Kurzus nem található');
      }
    }

    const courseData = courseDoc.data();
    console.log('🔍 [getCourse] Course data keys:', Object.keys(courseData || {}));
    
    // Get instructor data
    let instructor = null;
    if (courseData?.instructorId) {
      const instructorDoc = await firestore.collection('users').doc(courseData.instructorId).get();
      if (instructorDoc.exists) {
        instructor = { id: instructorDoc.id, ...instructorDoc.data() };
      }
    }

    // Get category data
    let category = null;
    if (courseData?.categoryId) {
      const categoryDoc = await firestore.collection('categories').doc(courseData.categoryId).get();
      if (categoryDoc.exists) {
        category = { id: categoryDoc.id, ...categoryDoc.data() };
      }
    }

    // Fetch curriculum (modules and lessons)
    console.log('🔍 [getCourse] Fetching modules for course:', courseId);
    const modulesSnap = await firestore
      .collection(`courses/${courseId}/modules`)
      .orderBy('order')
      .get();
    
    console.log('🔍 [getCourse] Found', modulesSnap.docs.length, 'modules');
    modulesSnap.docs.forEach((doc, index) => {
      console.log(`🔍 [getCourse] Module ${index + 1}:`, doc.id, '- Data keys:', Object.keys(doc.data()));
    });

    const modules = await Promise.all(
      modulesSnap.docs.map(async (modDoc) => {
        const modData = { id: modDoc.id, ...modDoc.data() } as any;
        console.log(`🔍 [getCourse] Fetching lessons for module ${modDoc.id}`);
        const lessonsSnap = await firestore
          .collection(`courses/${courseId}/modules/${modDoc.id}/lessons`)
          .orderBy('order')
          .get();
        
        console.log(`🔍 [getCourse] Found ${lessonsSnap.docs.length} lessons for module ${modDoc.id}`);
        const lessons = lessonsSnap.docs.map((l) => {
          const lessonData = { id: l.id, ...l.data() };
          console.log(`🔍 [getCourse] Lesson ${l.id} keys:`, Object.keys(l.data()));
          return lessonData;
        });
        
        const moduleWithLessons = { ...modData, lessons };
        console.log(`🔍 [getCourse] Module ${modDoc.id} final structure:`, {
          id: moduleWithLessons.id,
          title: moduleWithLessons.title,
          lessonsCount: lessons.length
        });
        return moduleWithLessons;
      })
    );
    
    console.log('🔍 [getCourse] Total modules processed:', modules.length);

    const course = {
      id: courseDoc.id,
      ...courseData,
      instructor,
      category,
      modules,
    };
    
    // CRITICAL: Check if user is enrolled (this might be missing!)
    let isEnrolled = false;
    if (request.auth) {
      const userId = request.auth.uid;
      const enrollmentDoc = await firestore
        .collection('enrollments')
        .doc(`${userId}_${courseId}`)
        .get();
      isEnrolled = enrollmentDoc.exists;
      console.log('🔍 [getCourse] Enrollment check - User:', userId, 'Enrolled:', isEnrolled);
    } else {
      console.log('🔍 [getCourse] No auth - cannot check enrollment');
    }
    
    const courseWithEnrollment = {
      ...course,
      isEnrolled
    };
    
    console.log('🔍 [getCourse] Final course structure:');
    console.log('  - Course ID:', courseWithEnrollment.id);
    console.log('  - Course title:', (courseWithEnrollment as any).title);
    console.log('  - Modules count:', courseWithEnrollment.modules?.length || 0);
    console.log('  - Total lessons:', courseWithEnrollment.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0));
    console.log('  - Is enrolled:', courseWithEnrollment.isEnrolled);
    console.log('  - Course keys:', Object.keys(courseWithEnrollment));

    return { success: true, course: courseWithEnrollment };

  } catch (error: any) {
    console.error('❌ getCourse error:', error);
    return { 
      success: false, 
      error: error.message || 'Ismeretlen hiba történt' 
    };
  }
});

export const deleteCourse = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges');
    }

    const { courseId } = request.data || {};
    
    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }

    const uid = request.auth.uid;
    
    // Check user permissions
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    const userData = userDoc.data() as any;
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található');
    }

    const courseData = courseDoc.data() as any;
    
    // Only admin or course instructor can delete
    if (userData.role !== 'ADMIN' && courseData.instructorId !== uid) {
      throw new Error('Nincs jogosultság a kurzus törléséhez');
    }

    // Delete the course
    await firestore.collection('courses').doc(courseId).delete();

    return { success: true, message: 'Kurzus sikeresen törölve' };

  } catch (error: any) {
    console.error('❌ deleteCourse error:', error);
    return { 
      success: false, 
      error: error.message || 'Ismeretlen hiba történt' 
    };
  }
});

export const enrollInCourse = onCall(async (request) => {
  try {
    console.log('🔍 [enrollInCourse] Called with data:', request.data);
    console.log('🔍 [enrollInCourse] Auth present:', !!request.auth);
    console.log('🔍 [enrollInCourse] User ID:', request.auth?.uid);
    
    // Check if user is authenticated (consistent with working functions)
    if (!request.auth) {
      console.error('❌ [enrollInCourse] No authentication');
      throw new Error('Felhasználónak be kell jelentkeznie');
    }

    const userId = request.auth.uid;

    // Validate input
    const { courseId } = z.object({
      courseId: z.string().min(1, 'Kurzus ID megadása kötelező'),
    }).parse(request.data);
    
    console.log('🔍 [enrollInCourse] Validated courseId:', courseId);
    
    // Find course using slug-first, ID-fallback pattern (same as lesson system)
    let courseDoc: any = null;
    let actualCourseId = courseId;
    
    // First try to find by slug
    console.log('🔍 [enrollInCourse] Searching by slug:', courseId);
    const courseQuery = await firestore
      .collection('courses')
      .where('slug', '==', courseId)
      .limit(1)
      .get();
    
    if (!courseQuery.empty) {
      courseDoc = courseQuery.docs[0];
      actualCourseId = courseDoc.id; // Use actual document ID
      console.log('🔍 [enrollInCourse] Found course by slug. Document ID:', actualCourseId);
    } else {
      // If not found by slug, try by document ID (fallback)
      console.log('🔍 [enrollInCourse] Slug not found, trying document ID:', courseId);
      const directDoc = await firestore.collection('courses').doc(courseId).get();
      
      if (directDoc.exists) {
        courseDoc = directDoc;
        actualCourseId = courseId; // Already the document ID
        console.log('🔍 [enrollInCourse] Found course by document ID');
      }
    }
    
    if (!courseDoc || !courseDoc.exists) {
      console.error('❌ [enrollInCourse] Course not found:', courseId);
      throw new Error('Kurzus nem található');
    }

    const courseData = courseDoc.data();
    if (!courseData) {
      throw new Error('Kurzus adatok nem találhatók');
    }
    
    console.log('🔍 [enrollInCourse] Course found:', {
      searchTerm: courseId,
      actualDocumentId: actualCourseId,
      title: courseData.title,
      slug: courseData.slug
    });

    // Check if user is already enrolled (use actual document ID)
    const enrollmentDoc = await firestore
      .collection('enrollments')
      .doc(`${userId}_${actualCourseId}`)
      .get();

    if (enrollmentDoc.exists) {
      throw new Error('Már fel vagy iratkozva erre a kurzusra');
    }

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    const userData = userDoc.data();

    // Create enrollment (use actual document ID)
    const enrollmentData = {
      userId: userId,
      courseId: actualCourseId, // Use actual document ID for database consistency
      enrolledAt: new Date().toISOString(), // Use consistent timestamp format
      status: 'ACTIVE',
      progress: 0,
      completedLessons: [],
      certificateId: null,
      // Add user info for easier querying
      userEmail: userData?.email || '',
      userName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
      // Add course info for easier querying
      courseTitle: courseData.title,
      courseInstructorId: courseData.instructorId,
      // Store both slug and ID for reference
      courseSlug: courseData.slug || null,
      searchTerm: courseId, // What the user searched for (for debugging)
    };

    await firestore
      .collection('enrollments')
      .doc(`${userId}_${actualCourseId}`)
      .set(enrollmentData);

    console.log(`✅ User ${userId} enrolled in course ${actualCourseId} (searched: ${courseId})`);

    return {
      success: true,
      enrollment: enrollmentData,
      message: 'Sikeres feliratkozás a kurzusra'
    };

  } catch (error: any) {
    console.error('❌ Error in enrollInCourse:', error);
    throw new Error(error.message || 'Hiba történt a feliratkozás során');
  }
}); 

export const getCoursesWithFilters = onCall(async (request) => {
  try {
    const queryId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 [${queryId}] getCoursesWithFilters called with data:`, request.data);
    
    const {
      sort = 'createdAt',
      order = 'desc',
      limit = 10,
      offset = 0,
      categoryId,
      search,
      status = 'PUBLISHED', // Default to published courses for catalog
      universityId,
      isPlus,
      difficulty,
      language,
      certificateEnabled,
      // New catalog-specific parameters
      includeTrending = false,
      includeRecommendations = false,
      excludeEnrolled = false,
    } = request.data || {};

    console.log(`🔍 [${queryId}] Parsed parameters:`, {
      sort, order, limit, offset, categoryId, search, status, 
      universityId, isPlus, difficulty, language, certificateEnabled,
      includeTrending, includeRecommendations, excludeEnrolled
    });

    // Get user ID for enrollment checks and recommendations
    const userId = request.auth?.uid;
    let userEnrollments: Set<string> = new Set();
    let userCategories: Set<string> = new Set();

    // Get user's current enrollments for personalization
    if (userId && (includeRecommendations || excludeEnrolled)) {
      try {
        const enrollmentsQuery = await firestore
          .collection('enrollments')
          .where('userId', '==', userId)
          .get();
        
        const enrolledCourseIds = enrollmentsQuery.docs.map(doc => doc.data().courseId);
        userEnrollments = new Set(enrolledCourseIds);
        
        // Get categories of enrolled courses for recommendations
        if (includeRecommendations && enrolledCourseIds.length > 0) {
          const enrolledCoursesQuery = await firestore
            .collection('courses')
            .where(admin.firestore.FieldPath.documentId(), 'in', enrolledCourseIds.slice(0, 10)) // Firestore limit
            .get();
          
          enrolledCoursesQuery.docs.forEach(doc => {
            const courseData = doc.data();
            if (courseData.categoryId) {
              userCategories.add(courseData.categoryId);
            }
          });
        }
        
        console.log(`🔍 [${queryId}] User enrollments: ${userEnrollments.size}, Categories: ${userCategories.size}`);
      } catch (error) {
        console.warn(`🔍 [${queryId}] Failed to get user enrollments:`, error);
      }
    }

    // Convert string values to appropriate types
    const limitNum = parseInt(limit as string) || 10;
    const offsetNum = parseInt(offset as string) || 0;

    // Build query
    let query: any = firestore.collection('courses');
    console.log(`🔍 [${queryId}] Starting with base query`);

    // Apply filters
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
      console.log(`🔍 [${queryId}] Added categoryId filter:`, categoryId);
    }
    if (status) {
      query = query.where('status', '==', status);
      console.log(`🔍 [${queryId}] Added status filter:`, status);
    }
    if (universityId) {
      query = query.where('universityId', '==', universityId);
      console.log(`🔍 [${queryId}] Added universityId filter:`, universityId);
    }
    if (isPlus !== undefined && isPlus !== null) {
      query = query.where('isPlus', '==', isPlus === 'true');
      console.log(`🔍 [${queryId}] Added isPlus filter:`, isPlus);
    }
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
      console.log(`🔍 [${queryId}] Added difficulty filter:`, difficulty);
    }
    if (language) {
      query = query.where('language', '==', language);
      console.log(`🔍 [${queryId}] Added language filter:`, language);
    }
    if (certificateEnabled !== undefined && certificateEnabled !== null) {
      query = query.where('certificateEnabled', '==', certificateEnabled === 'true');
      console.log(`🔍 [${queryId}] Added certificateEnabled filter:`, certificateEnabled);
    }

    // FIELD MAPPING: Translate frontend sort parameters to actual Firestore fields
    const sortFieldMap: Record<string, string> = {
      'popular': 'enrollmentCount',
      'trending': 'enrollmentCount', // Use enrollment count as proxy for trending
      'rating': 'averageRating',
      'new': 'createdAt',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    
    const firestoreSortField = sortFieldMap[sort] || 'createdAt';
    console.log(`🔍 [${queryId}] Sort field mapping: ${sort} -> ${firestoreSortField}`);

    // Apply sorting with mapped field
    query = query.orderBy(firestoreSortField, order as 'asc' | 'desc');
    console.log(`🔍 [${queryId}] Added sorting:`, firestoreSortField, order);

    // Get total count for pagination
    const totalQuery = query;
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;
    console.log(`🔍 [${queryId}] Total courses found:`, total);

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum);
    console.log(`🔍 [${queryId}] Applied pagination:`, limitNum, offsetNum);

    // Execute query
    const snapshot = await query.get();
    console.log(`🔍 [${queryId}] Query executed, docs found:`, snapshot.docs.length);
    
    const courses = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    console.log(`🔍 [${queryId}] Raw courses before enrichment:`, courses.length);

    // Apply search filter if provided (client-side for now)
    let filteredCourses = courses;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredCourses = courses.filter(course => 
        course.title?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
      console.log(`🔍 [${queryId}] After search filter:`, filteredCourses.length);
    }

    // Apply enrollment exclusion filter if requested
    if (excludeEnrolled && userEnrollments.size > 0) {
      filteredCourses = filteredCourses.filter(course => !userEnrollments.has(course.id));
      console.log(`🔍 [${queryId}] After enrollment exclusion:`, filteredCourses.length);
    }

    // Enrich courses with instructor, category, and enrollment data
    const enrichedCourses = await Promise.all(
      filteredCourses.map(async (course: any) => {
        const enrichedCourse = await enrichCourse(course);
        
        // Add enrollment status for authenticated users
        let isEnrolled = false;
        if (userId) {
          isEnrolled = userEnrollments.has(course.id);
        }
        
        // Add catalog-specific metadata
        const catalogMetadata = {
          isEnrolled,
          isTrending: (course.enrollmentCount || 0) > 50 && course.averageRating > 4.0, // Simple trending logic
          isRecommended: includeRecommendations && userCategories.has(course.categoryId),
          enrollmentCount: course.enrollmentCount || 0,
          averageRating: course.averageRating || 0,
          reviewCount: course.reviewCount || 0,
          popularityScore: Math.round(((course.enrollmentCount || 0) * 0.7) + ((course.averageRating || 0) * 0.3 * 20)), // Simple scoring
        };
        
        return {
          ...enrichedCourse,
          ...catalogMetadata
        };
      })
    );
    console.log(`🔍 [${queryId}] After enrichment:`, enrichedCourses.length);

    // Add recommendations scoring if requested
    if (includeRecommendations && userCategories.size > 0) {
      enrichedCourses.forEach(course => {
        if (userCategories.has(course.category?.id)) {
          course.recommendationScore = course.popularityScore + 20; // Boost for matching categories
        } else {
          course.recommendationScore = course.popularityScore;
        }
      });
      
      // Sort by recommendation score if recommendations are requested
      if (includeRecommendations) {
        enrichedCourses.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
      }
    }

    const result = {
      success: true,
      courses: enrichedCourses,
      total,
      // Add catalog-specific metadata
      meta: {
        userEnrollmentCount: userEnrollments.size,
        userCategories: Array.from(userCategories),
        hasRecommendations: includeRecommendations && userCategories.size > 0,
        queryId
      }
    };
    
    console.log(`🔍 [${queryId}] Returning result:`, {
      courseCount: result.courses.length,
      total: result.total,
      meta: result.meta
    });
    return result;

  } catch (error: any) {
    console.error('❌ getCoursesWithFilters error:', error);
    return { 
      success: false, 
      error: error.message || 'Ismeretlen hiba történt' 
    };
  }
}); 

export const getCoursesCallable = onCall(async (request) => {
  try {
    console.log('🔍 getCoursesCallable called');

    // Simple query - get all courses
    const snapshot = await firestore.collection('courses').get();
    const courses = snapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Enrich courses with instructor and category data
    const enrichedCourses = await Promise.all(
      courses.map(async (course: any) => {
        return await enrichCourse(course);
      })
    );

    console.log(`✅ Found ${courses.length} courses`);

    return {
      success: true,
      courses: enrichedCourses,
      total: courses.length
    };

  } catch (error: any) {
    console.error('❌ getCoursesCallable error:', error);
    return { 
      success: false, 
      error: error.message || 'Ismeretlen hiba történt' 
    };
  }
}); 