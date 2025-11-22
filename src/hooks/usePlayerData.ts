import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { CourseType, Lesson, Module, Course, Instructor } from '@/types'

// Course types that use flat lessons (no modules)
const FLAT_LESSON_COURSE_TYPES: CourseType[] = ['WEBINAR', 'PODCAST', 'MASTERCLASS'];

// Course types that use Netflix-style player (full-width video)
export const NETFLIX_STYLE_COURSE_TYPES: CourseType[] = ['WEBINAR', 'PODCAST'];

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
}

export const usePlayerData = (courseId: string | undefined, lessonId: string | undefined) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['player-data', courseId, lessonId],
    queryFn: async () => {
      if (!courseId || !lessonId) return null

      try {
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
        // FIX: Firestore stores courseType, not type
        const courseType = (courseData.courseType || courseData.type) as CourseType | undefined;

        // DIAGNOSTIC: Trace courseType detection
        console.log('[usePlayerData] Course type detection:', {
          courseId: actualCourseId,
          'courseData.courseType': courseData.courseType,
          'courseData.type': courseData.type,
          resolvedCourseType: courseType,
          isInNetflixTypes: courseType ? NETFLIX_STYLE_COURSE_TYPES.includes(courseType) : false,
        });

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
          // Return flat lessons structure - wrap in a single "default" module for backwards compatibility
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
            // Fetch lessons from each module's subcollection
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
            // Use flat lessons as fallback even for non-flat course types
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

          // Fetch source course names
          for (const sourceCourseId of Array.from(sourceCourseIds)) {
            try {
              const sourceDoc = await getDoc(doc(db, 'courses', sourceCourseId));
              if (sourceDoc.exists()) {
                sourceCourseNames[sourceCourseId] = sourceDoc.data().title || 'Ismeretlen tartalom';
              }
            } catch (e) {
              console.error('Error fetching source course:', sourceCourseId, e);
            }
          }
        }

        // Fetch instructor data (for WEBINAR/PODCAST mentor display)
        let instructor: Instructor | null = null;
        const instructorId = courseData.instructorId || courseData.instructorIds?.[0];
        if (instructorId) {
          try {
            const instructorDoc = await getDoc(doc(db, 'instructors', instructorId));
            if (instructorDoc.exists()) {
              const instructorData = instructorDoc.data();
              instructor = {
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
        }

        return {
          success: true,
          course: {
            id: actualCourseId,
            ...courseData,
            modules,
            autoplayNext: courseData.autoplayNext ?? true
          } as PlayerCourse,
          // Flat lessons for new player layouts
          flatLessons,
          // Source course names for imported lessons
          sourceCourseNames,
          // Player layout hints
          usesFlatLessons,
          usesNetflixLayout: courseType && NETFLIX_STYLE_COURSE_TYPES.includes(courseType),
          signedPlaybackUrl: null,
          // Instructor data for mentor display
          instructor,
        } as PlayerData;

      } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
      }
    },
    enabled: !!courseId && !!lessonId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('Bejelentkezés') || error.message.includes('Autentikáció')) {
        return false;
      }
      return failureCount < 3;
    }
  })
} 