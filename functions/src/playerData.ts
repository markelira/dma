/**
 * Player Data Cloud Function
 * Batches all Firestore queries for the course player into a single round-trip
 * Reduces client-side latency significantly by eliminating multiple sequential queries
 */

import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';

const firestore = admin.firestore();

// Course types that use flat lessons (no modules)
const FLAT_LESSON_COURSE_TYPES = ['WEBINAR', 'PODCAST', 'MASTERCLASS'];

// Course types that use Netflix-style player
const NETFLIX_STYLE_COURSE_TYPES = ['WEBINAR', 'PODCAST', 'ACADEMIA', 'MASTERCLASS'];

// Input validation schema
const GetPlayerDataSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
});

/**
 * Get all player data in a single batched call
 * Returns: course, modules, lessons, instructor(s), progress, resume position
 */
export const getPlayerData = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      return {
        success: false,
        error: 'Bejelentkezés szükséges',
        code: 'UNAUTHENTICATED'
      };
    }

    const userId = request.auth.uid;

    // Validate input
    const { courseId: inputCourseId, lessonId } = GetPlayerDataSchema.parse(request.data);

    logger.info('[getPlayerData] Request', { courseId: inputCourseId, lessonId, userId });

    // 1. Resolve course by ID or slug (parallel with user check)
    const [courseResult, userDoc] = await Promise.all([
      resolveCourse(inputCourseId),
      firestore.collection('users').doc(userId).get()
    ]);

    if (!courseResult.success || !courseResult.courseDoc) {
      return {
        success: false,
        error: 'Kurzus nem található',
        code: 'NOT_FOUND'
      };
    }

    const courseDoc = courseResult.courseDoc;
    const courseData = courseDoc.data()!;
    const actualCourseId = courseDoc.id;
    const courseType = courseData.courseType || courseData.type;

    // 2. Determine data structure
    const usesFlatLessons = courseType && FLAT_LESSON_COURSE_TYPES.includes(courseType);
    const usesNetflixLayout = courseType && NETFLIX_STYLE_COURSE_TYPES.includes(courseType);

    // 3. Batch fetch all related data in parallel
    const [
      lessonsResult,
      modulesResult,
      instructorsResult,
      progressResult,
      enrollmentDoc,
    ] = await Promise.all([
      // Flat lessons subcollection
      firestore
        .collection('courses')
        .doc(actualCourseId)
        .collection('lessons')
        .orderBy('order', 'asc')
        .get(),
      // Modules subcollection (for ACADEMIA type)
      !usesFlatLessons ? fetchModulesWithLessons(actualCourseId) : Promise.resolve([]),
      // Instructors
      fetchInstructors(courseData.instructorIds || (courseData.instructorId ? [courseData.instructorId] : [])),
      // User's lesson progress for this course
      firestore
        .collection('lessonProgress')
        .where('userId', '==', userId)
        .where('courseId', '==', actualCourseId)
        .get(),
      // User's enrollment
      firestore
        .collection('enrollments')
        .doc(`${userId}_${actualCourseId}`)
        .get()
    ]);

    // 4. Process flat lessons
    let flatLessons: any[] = [];
    if (!lessonsResult.empty) {
      flatLessons = lessonsResult.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        progress: { completed: false, watchPercentage: 0 }
      }));
    }

    // 5. Build modules array
    let modules = courseData.modules || [];

    if (usesFlatLessons && flatLessons.length > 0) {
      // Wrap flat lessons in a default module
      modules = [{
        id: 'flat-lessons',
        title: courseData.title || 'Tartalom',
        description: '',
        order: 0,
        status: 'PUBLISHED',
        lessons: flatLessons
      }];
    } else if (modules.length === 0 && Array.isArray(modulesResult) && modulesResult.length > 0) {
      modules = modulesResult;
    } else if (modules.length === 0 && flatLessons.length > 0) {
      // Fallback: use flat lessons even for non-flat course types
      modules = [{
        id: 'default-module',
        title: courseData.title || 'Course Content',
        description: '',
        order: 1,
        status: 'PUBLISHED',
        lessons: flatLessons
      }];
    }

    // 6. Build progress map and find resume position
    const progressMap: Record<string, any> = {};
    const completedLessonIds: string[] = [];
    let resumePosition = 0;

    progressResult.docs.forEach(doc => {
      const data = doc.data();
      const docLessonId = data.lessonId;
      progressMap[docLessonId] = {
        watchPercentage: data.watchPercentage || 0,
        timeSpent: data.timeSpent || 0,
        completed: data.completed || false,
        resumePosition: data.resumePosition || 0,
      };

      if (data.completed || (data.watchPercentage && data.watchPercentage >= 90)) {
        completedLessonIds.push(docLessonId);
      }

      // Get resume position for current lesson
      if (docLessonId === lessonId) {
        resumePosition = data.resumePosition || 0;
      }
    });

    // 7. Source course names (for MASTERCLASS imported lessons)
    let sourceCourseNames: Record<string, string> = {};
    if (courseType === 'MASTERCLASS') {
      sourceCourseNames = await fetchSourceCourseNames(flatLessons);
    }

    // 8. Update enrollment last accessed (fire and forget)
    if (enrollmentDoc.exists) {
      firestore
        .collection('enrollments')
        .doc(`${userId}_${actualCourseId}`)
        .update({
          currentLessonId: lessonId,
          lastAccessedAt: new Date().toISOString()
        })
        .catch(err => logger.warn('[getPlayerData] Failed to update enrollment', err));
    }

    // 9. Build response
    const response = {
      success: true,
      course: {
        id: actualCourseId,
        title: courseData.title,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
        courseType: courseType,
        autoplayNext: courseData.autoplayNext ?? true,
        modules,
      },
      flatLessons,
      sourceCourseNames,
      usesFlatLessons,
      usesNetflixLayout,
      signedPlaybackUrl: null, // Mux signing happens client-side if needed
      instructor: instructorsResult.length > 0 ? instructorsResult[0] : null,
      instructors: instructorsResult,
      progress: {
        completedLessonIds,
        progressMap,
      },
      resumePosition,
    };

    logger.info('[getPlayerData] Success', {
      courseId: actualCourseId,
      lessonsCount: flatLessons.length,
      modulesCount: modules.length,
      completedCount: completedLessonIds.length,
    });

    return response;

  } catch (error: any) {
    logger.error('[getPlayerData] Error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen paraméterek',
        code: 'VALIDATION_ERROR',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Hiba történt az adatok betöltésekor',
      code: 'INTERNAL_ERROR'
    };
  }
});

/**
 * Resolve course by ID or slug
 */
async function resolveCourse(courseId: string): Promise<{ success: boolean; courseDoc?: FirebaseFirestore.DocumentSnapshot }> {
  // Try by slug first
  const slugQuery = await firestore
    .collection('courses')
    .where('slug', '==', courseId)
    .limit(1)
    .get();

  if (!slugQuery.empty) {
    return { success: true, courseDoc: slugQuery.docs[0] };
  }

  // Try direct ID lookup
  const directDoc = await firestore.collection('courses').doc(courseId).get();
  if (directDoc.exists) {
    return { success: true, courseDoc: directDoc };
  }

  return { success: false };
}

/**
 * Fetch modules with their lessons from subcollections
 */
async function fetchModulesWithLessons(courseId: string): Promise<any[]> {
  const modulesSnapshot = await firestore
    .collection('courses')
    .doc(courseId)
    .collection('modules')
    .orderBy('order', 'asc')
    .get();

  if (modulesSnapshot.empty) {
    return [];
  }

  // Fetch lessons for each module in parallel
  const modulesPromises = modulesSnapshot.docs.map(async (moduleDoc) => {
    const moduleData = moduleDoc.data();

    // Check for embedded lessons first
    let lessons = moduleData.lessons || [];

    // If no embedded lessons, check subcollection
    if (lessons.length === 0) {
      const lessonsSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleDoc.id)
        .collection('lessons')
        .orderBy('order', 'asc')
        .get();

      lessons = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        progress: { completed: false, watchPercentage: 0 }
      }));
    }

    return {
      id: moduleDoc.id,
      title: moduleData.title || `Module ${moduleData.order + 1}`,
      description: moduleData.description || '',
      order: moduleData.order || 0,
      status: moduleData.status || 'PUBLISHED',
      lessons
    };
  });

  // SCALABILITY: Use Promise.allSettled for error resilience - one module failure won't break all
  const results = await Promise.allSettled(modulesPromises);
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * Fetch instructor data
 */
async function fetchInstructors(instructorIds: string[]): Promise<any[]> {
  if (!instructorIds || instructorIds.length === 0) {
    return [];
  }

  const instructorPromises = instructorIds.map(async (instructorId) => {
    const doc = await firestore.collection('instructors').doc(instructorId).get();
    if (doc.exists) {
      const data = doc.data()!;
      return {
        id: doc.id,
        name: data.name || 'Ismeretlen',
        title: data.title,
        bio: data.bio,
        profilePictureUrl: data.profilePictureUrl,
        role: data.role || 'MENTOR',
      };
    }
    return null;
  });

  // SCALABILITY: Use Promise.allSettled for error resilience
  const results = await Promise.allSettled(instructorPromises);
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

/**
 * Fetch source course names for MASTERCLASS imported lessons
 */
async function fetchSourceCourseNames(lessons: any[]): Promise<Record<string, string>> {
  const sourceCourseIds = new Set<string>();

  lessons.forEach((lesson) => {
    const sourceId = lesson.sourceCourseid || lesson.sourceCourseId;
    if (sourceId) {
      sourceCourseIds.add(sourceId);
    }
  });

  if (sourceCourseIds.size === 0) {
    return {};
  }

  const sourcePromises = Array.from(sourceCourseIds).map(async (sourceCourseId) => {
    const doc = await firestore.collection('courses').doc(sourceCourseId).get();
    if (doc.exists) {
      return { id: sourceCourseId, title: doc.data()?.title || 'Ismeretlen tartalom' };
    }
    return null;
  });

  // SCALABILITY: Use Promise.allSettled for error resilience
  const results = await Promise.allSettled(sourcePromises);

  const names: Record<string, string> = {};
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      names[result.value.id] = result.value.title;
    }
  });

  return names;
}
