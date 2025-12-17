import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { CourseType, Lesson, Module, Course, Instructor } from '@/types'

// Feature flag: Use Cloud Function for batched data fetching (reduces latency)
const USE_CLOUD_FUNCTION = true;

// Course types that use flat lessons (no modules)
const FLAT_LESSON_COURSE_TYPES: CourseType[] = ['WEBINAR', 'PODCAST', 'MASTERCLASS'];

// Course types that use Netflix-style player (split layout with side panel)
export const NETFLIX_STYLE_COURSE_TYPES: CourseType[] = ['WEBINAR', 'PODCAST', 'ACADEMIA', 'MASTERCLASS'];

// Player data course type (extends Course with modules)
export interface PlayerCourse extends Omit<Course, 'modules'> {
  id: string;
  modules: Module[];
  autoplayNext: boolean;
  // Firestore stores as 'courseType' field
  courseType?: CourseType;
}

// Player data return type
export interface PlayerData {
  success: boolean;
  course: PlayerCourse;
  flatLessons: Lesson[];
  sourceCourseNames: Record<string, string>;
  usesFlatLessons: boolean | undefined;
  usesNetflixLayout: boolean | undefined;
  signedPlaybackUrl: string | null;
  instructor: Instructor | null;
  instructors: Instructor[];
  progress?: {
    completedLessonIds: string[];
    progressMap: Record<string, { watchPercentage: number; timeSpent: number; completed: boolean; resumePosition: number }>;
  };
  resumePosition?: number;
}

// Cloud Function response type
interface CloudFunctionResponse {
  success: boolean;
  error?: string;
  code?: string;
  course?: any;
  flatLessons?: Lesson[];
  sourceCourseNames?: Record<string, string>;
  usesFlatLessons?: boolean;
  usesNetflixLayout?: boolean;
  signedPlaybackUrl?: string | null;
  instructor?: Instructor | null;
  instructors?: Instructor[];
  progress?: {
    completedLessonIds: string[];
    progressMap: Record<string, any>;
  };
  resumePosition?: number;
}

/**
 * Fetch player data using Cloud Function (batched, faster)
 */
async function fetchPlayerDataFromCloudFunction(courseId: string, lessonId: string): Promise<PlayerData> {
  const getPlayerData = httpsCallable<{ courseId: string; lessonId: string }, CloudFunctionResponse>(
    functions,
    'getPlayerData'
  );

  const result = await getPlayerData({ courseId, lessonId });
  const data = result.data;

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch player data');
  }

  return {
    success: true,
    course: {
      ...data.course,
      autoplayNext: data.course?.autoplayNext ?? true,
    } as PlayerCourse,
    flatLessons: data.flatLessons || [],
    sourceCourseNames: data.sourceCourseNames || {},
    usesFlatLessons: data.usesFlatLessons,
    usesNetflixLayout: data.usesNetflixLayout,
    signedPlaybackUrl: data.signedPlaybackUrl || null,
    instructor: data.instructor || null,
    instructors: data.instructors || [],
    progress: data.progress,
    resumePosition: data.resumePosition,
  };
}

/**
 * Fetch player data using direct Firestore queries (fallback)
 */
async function fetchPlayerDataFromFirestore(courseId: string, lessonId: string): Promise<PlayerData> {
  // Resolve course by slug or ID
  let courseDoc;
  const coursesBySlug = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseId)));

  if (!coursesBySlug.empty) {
    courseDoc = coursesBySlug.docs[0];
  } else {
    const docSnap = await getDoc(doc(db, 'courses', courseId));
    if (!docSnap.exists()) {
      throw new Error('Tartalom nem található');
    }
    courseDoc = docSnap;
  }

  const courseData = courseDoc.data();
  const actualCourseId = courseDoc.id;
  const courseType = (courseData.courseType || courseData.type) as CourseType | undefined;

  // For flat lesson course types, fetch lessons directly
  const usesFlatLessons = courseType && FLAT_LESSON_COURSE_TYPES.includes(courseType);

  // Flat lessons storage
  let flatLessons: Lesson[] = [];

  // Use existing modules from course data, or fetch from subcollections
  let modules = courseData.modules || [];

  // First, try to fetch flat lessons from the lessons subcollection
  const lessonsSnapshot = await getDocs(
    query(collection(db, 'courses', actualCourseId, 'lessons'), orderBy('order', 'asc'))
  );

  if (!lessonsSnapshot.empty) {
    flatLessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      progress: { completed: false, watchPercentage: 0 }
    })) as unknown as Lesson[];
  }

  // If we have flat lessons and this is a flat lesson course type, use them directly
  if (usesFlatLessons && flatLessons.length > 0) {
    modules = [{
      id: 'flat-lessons',
      title: courseData.title || 'Tartalom',
      description: '',
      order: 0,
      status: 'PUBLISHED',
      lessons: flatLessons
    }];
  } else if (modules.length === 0) {
    // Fall back to checking modules subcollection (for ACADEMIA type)
    const modulesSnapshot = await getDocs(
      query(collection(db, 'courses', actualCourseId, 'modules'), orderBy('order', 'asc'))
    );

    if (!modulesSnapshot.empty) {
      const modulesPromises = modulesSnapshot.docs.map(async (moduleDoc) => {
        const moduleData = moduleDoc.data();
        const moduleLessonsSnapshot = await getDocs(
          query(
            collection(db, 'courses', actualCourseId, 'modules', moduleDoc.id, 'lessons'),
            orderBy('order', 'asc')
          )
        );

        const lessons = moduleLessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          progress: { completed: false, watchPercentage: 0 }
        }));

        return {
          id: moduleDoc.id,
          title: moduleData.title || `Module ${moduleData.order + 1}`,
          description: moduleData.description || '',
          order: moduleData.order || 0,
          status: moduleData.status || 'PUBLISHED',
          lessons
        };
      });

      modules = await Promise.all(modulesPromises);
    } else if (flatLessons.length > 0) {
      modules = [{
        id: 'default-module',
        title: courseData.title || 'Course Content',
        description: '',
        order: 1,
        status: 'PUBLISHED',
        lessons: flatLessons
      }];
    }
  }

  // Fetch source course names for imported lessons (MASTERCLASS)
  const sourceCourseNames: Record<string, string> = {};
  if (courseType === 'MASTERCLASS') {
    const sourceCourseIds = new Set<string>();
    flatLessons.forEach((lesson: any) => {
      if (lesson.sourceCourseid || lesson.sourceCourseId) {
        sourceCourseIds.add(lesson.sourceCourseid || lesson.sourceCourseId);
      }
    });

    const sourceCourseResults = await Promise.all(
      Array.from(sourceCourseIds).map(async (sourceCourseId) => {
        try {
          const sourceDoc = await getDoc(doc(db, 'courses', sourceCourseId));
          if (sourceDoc.exists()) {
            return { id: sourceCourseId, title: sourceDoc.data().title || 'Ismeretlen tartalom' };
          }
        } catch (e) {
          console.error('Error fetching source course:', sourceCourseId, e);
        }
        return null;
      })
    );

    sourceCourseResults.forEach((result) => {
      if (result) {
        sourceCourseNames[result.id] = result.title;
      }
    });
  }

  // Fetch instructor data
  let instructor: Instructor | null = null;
  const instructors: Instructor[] = [];

  const allInstructorIds: string[] = [];
  if (courseData.instructorIds && Array.isArray(courseData.instructorIds)) {
    allInstructorIds.push(...courseData.instructorIds);
  } else if (courseData.instructorId) {
    allInstructorIds.push(courseData.instructorId);
  }

  const instructorResults = await Promise.all(
    allInstructorIds.map(async (instructorId) => {
      try {
        const instructorDoc = await getDoc(doc(db, 'instructors', instructorId));
        if (instructorDoc.exists()) {
          const instructorData = instructorDoc.data();
          return {
            id: instructorDoc.id,
            name: instructorData.name || 'Ismeretlen',
            title: instructorData.title,
            bio: instructorData.bio,
            profilePictureUrl: instructorData.profilePictureUrl,
            role: instructorData.role || 'MENTOR',
            createdAt: instructorData.createdAt,
            updatedAt: instructorData.updatedAt,
          } as Instructor;
        }
      } catch (e) {
        console.error('Error fetching instructor:', instructorId, e);
      }
      return null;
    })
  );

  instructorResults.forEach((inst) => {
    if (inst) {
      instructors.push(inst);
      if (!instructor) {
        instructor = inst;
      }
    }
  });

  return {
    success: true,
    course: {
      id: actualCourseId,
      ...courseData,
      modules,
      autoplayNext: courseData.autoplayNext ?? true
    } as PlayerCourse,
    flatLessons,
    sourceCourseNames,
    usesFlatLessons,
    usesNetflixLayout: courseType && NETFLIX_STYLE_COURSE_TYPES.includes(courseType),
    signedPlaybackUrl: null,
    instructor,
    instructors,
  };
}

export const usePlayerData = (courseId: string | undefined, lessonId: string | undefined) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['player-data', courseId, lessonId],
    staleTime: 10 * 60 * 1000, // 10 minutes - course data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory for navigation
    queryFn: async (): Promise<PlayerData | null> => {
      if (!courseId || !lessonId) return null;

      try {
        // Use Cloud Function if enabled and user is authenticated
        if (USE_CLOUD_FUNCTION && user) {
          try {
            console.log('[usePlayerData] Using Cloud Function for batched fetch');
            return await fetchPlayerDataFromCloudFunction(courseId, lessonId);
          } catch (cloudError: any) {
            // Fall back to direct Firestore if Cloud Function fails
            console.warn('[usePlayerData] Cloud Function failed, falling back to Firestore:', cloudError.message);
          }
        }

        // Fallback: Direct Firestore queries
        console.log('[usePlayerData] Using direct Firestore queries');
        return await fetchPlayerDataFromFirestore(courseId, lessonId);

      } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
      }
    },
    enabled: !!courseId && !!lessonId,
    retry: (failureCount, error: any) => {
      if (error.message?.includes('Bejelentkezés') || error.message?.includes('Autentikáció')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}
