import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Lesson } from '@/types'
import { useAuthStore } from '@/stores/authStore'

export const useLesson = (id: string | undefined, courseId?: string) => {
  const { isAuthenticated, authReady, user } = useAuthStore();

  console.log('🎬 [useLesson] Hook called with:', { id, courseId, isAuthenticated, authReady });

  const queryResult = useQuery<Lesson, Error>({
    queryKey: ['lesson', id, courseId],
    queryFn: async () => {
      console.log('🔍 [useLesson] queryFn EXECUTING - Fetching lesson from Firestore:', {
        lessonId: id,
        courseId,
        authReady,
        isAuthenticated,
        hasUser: !!user
      });
      
      if (!courseId || !id) {
        throw new Error('Hiányzó kurzus vagy lecke azonosító');
      }
      
      try {
        // First, resolve the actual course ID (handle slug or ID)
        let actualCourseId = courseId;
        
        // Try to find course by slug first
        const coursesBySlug = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseId)));
        if (!coursesBySlug.empty) {
          actualCourseId = coursesBySlug.docs[0].id;
          console.log('Resolved course slug to ID:', courseId, '->', actualCourseId);
        }
        
        // First try to get the course document to check for embedded lessons
        const courseDoc = await getDoc(doc(db, 'courses', actualCourseId));
        let lessonData: Lesson | null = null;
        
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          console.log('Course data structure:', {
            hasLessons: !!courseData.lessons,
            lessonsCount: courseData.lessons?.length,
            hasModules: !!courseData.modules,
            modulesCount: courseData.modules?.length,
            firstLessonId: courseData.lessons?.[0]?.id,
            lookingForId: id
          });
          
          // Check if lessons are embedded in the course document
          if (courseData.lessons && Array.isArray(courseData.lessons)) {
            console.log('Checking embedded lessons:', courseData.lessons.map((l: any) => ({ id: l.id, title: l.title })));
            console.log('Looking for lesson with ID:', id);
            
            // Try finding by exact ID match
            let embeddedLesson = courseData.lessons.find((l: any) => l.id === id);
            
            // If not found, try finding by index (lesson-1 might be at index 0)
            if (!embeddedLesson && id.startsWith('lesson-')) {
              const lessonIndex = parseInt(id.replace('lesson-', '')) - 1;
              if (lessonIndex >= 0 && lessonIndex < courseData.lessons.length) {
                embeddedLesson = courseData.lessons[lessonIndex];
                console.log(`Found lesson by index ${lessonIndex}:`, embeddedLesson);
              }
            }
            
            if (embeddedLesson) {
              lessonData = {
                id: id, // Always use the requested ID
                ...embeddedLesson,
                type: embeddedLesson.type || 'VIDEO',
                content: embeddedLesson.content || '',
                resources: embeddedLesson.resources || []
              } as Lesson;
              console.log('Found lesson in embedded lessons:', lessonData);
            } else {
              console.log('Lesson not found in embedded lessons. Available IDs:', courseData.lessons.map((l: any) => l.id));
            }
          }
          
          // Check if modules exist with lessons
          if (!lessonData && courseData.modules && Array.isArray(courseData.modules)) {
            for (const module of courseData.modules) {
              if (module.lessons && Array.isArray(module.lessons)) {
                const moduleLesson = module.lessons.find((l: any) => l.id === id);
                if (moduleLesson) {
                  lessonData = {
                    id: moduleLesson.id || id,
                    ...moduleLesson,
                    type: moduleLesson.type || 'VIDEO',
                    content: moduleLesson.content || '',
                    resources: moduleLesson.resources || []
                  } as Lesson;
                  console.log('Found lesson in module:', module.id, lessonData);
                  break;
                }
              }
            }
          }
        }
        
        // If not found in embedded data, try subcollection
        if (!lessonData) {
          console.log('Trying to fetch from subcollection - courseId:', actualCourseId, 'lessonId:', id);
          const lessonDoc = await getDoc(doc(db, 'courses', actualCourseId, 'lessons', id));
          
          if (lessonDoc.exists()) {
            lessonData = {
              id: lessonDoc.id,
              ...lessonDoc.data(),
              type: lessonDoc.data()?.type || 'VIDEO',
              content: lessonDoc.data()?.content || '',
              resources: lessonDoc.data()?.resources || []
            } as Lesson;
            console.log('✅ Found lesson in subcollection:', lessonData);
          } else {
            console.log('❌ Lesson not found in subcollection, checking all lessons...');
            // Try to get all lessons to see what's available
            const allLessons = await getDocs(collection(db, 'courses', actualCourseId, 'lessons'));
            console.log('Available lessons in subcollection:', allLessons.docs.map(d => ({ id: d.id, title: d.data().title })));
          }
        }
        
        // If still not found, try to find in modules/lessons subcollections
        if (!lessonData) {
          console.log('Checking modules subcollection for courseId:', actualCourseId, 'lessonId:', id);
          const modulesSnapshot = await getDocs(collection(db, 'courses', actualCourseId, 'modules'));
          console.log('Found modules:', modulesSnapshot.docs.map(d => d.id));
          
          // First check default-module specifically since admin saves there
          const defaultModuleLessons = await getDocs(
            collection(db, 'courses', actualCourseId, 'modules', 'default-module', 'lessons')
          );
          console.log('Default module lessons:', defaultModuleLessons.docs.map(d => ({ id: d.id, title: d.data().title })));
          
          // Try to find by ID in default-module
          const defaultLessonDoc = await getDoc(
            doc(db, 'courses', actualCourseId, 'modules', 'default-module', 'lessons', id)
          );
          
          if (defaultLessonDoc.exists()) {
            lessonData = {
              id: defaultLessonDoc.id,
              ...defaultLessonDoc.data(),
              type: defaultLessonDoc.data()?.type || 'VIDEO',
              content: defaultLessonDoc.data()?.content || '',
              resources: defaultLessonDoc.data()?.resources || []
            } as Lesson;
            console.log('Found lesson in default-module:', lessonData);
          }
          
          // If not in default-module, check other modules
          if (!lessonData) {
            for (const moduleDoc of modulesSnapshot.docs) {
              console.log('Checking module:', moduleDoc.id);

              // Get all lessons in this module to see what's there
              const allLessonsInModule = await getDocs(
                query(
                  collection(db, 'courses', actualCourseId, 'modules', moduleDoc.id, 'lessons'),
                  orderBy('order', 'asc')
                )
              );
              console.log(`Module ${moduleDoc.id} has lessons:`, allLessonsInModule.docs.map(d => ({ id: d.id, title: d.data().title, order: d.data().order })));

              // If looking for lesson-1, lesson-2, etc., try to match by order
              if (id.startsWith('lesson-')) {
                const lessonNumber = parseInt(id.replace('lesson-', ''));
                if (!isNaN(lessonNumber) && lessonNumber > 0) {
                  // Find lesson with matching order (1-indexed)
                  const matchingLesson = allLessonsInModule.docs.find(doc => doc.data().order === lessonNumber - 1);
                  if (matchingLesson) {
                    lessonData = {
                      id: matchingLesson.id, // Use the actual Firestore ID
                      ...matchingLesson.data(),
                      type: matchingLesson.data()?.type || 'VIDEO',
                      content: matchingLesson.data()?.content || '',
                      resources: matchingLesson.data()?.resources || []
                    } as Lesson;
                    console.log(`Found lesson by order ${lessonNumber - 1} in module ${moduleDoc.id}:`, lessonData);
                    break;
                  }
                }
              }

              // Try to find lesson by slug first
              const lessonsBySlug = await getDocs(
                query(
                  collection(db, 'courses', actualCourseId, 'modules', moduleDoc.id, 'lessons'),
                  where('slug', '==', 'bevezeto-lecke') // lesson-1 usually maps to this slug
                )
              );

              if (!lessonsBySlug.empty) {
                const lessonDoc = lessonsBySlug.docs[0];
                lessonData = {
                  id: lessonDoc.id, // Use actual Firestore ID
                  ...lessonDoc.data(),
                  type: lessonDoc.data()?.type || 'VIDEO',
                  content: lessonDoc.data()?.content || '',
                  resources: lessonDoc.data()?.resources || []
                } as Lesson;
                console.log('Found lesson in module by slug:', moduleDoc.id, lessonData);
                break;
              }

              // Try direct ID lookup
              const lessonDoc = await getDoc(
                doc(db, 'courses', actualCourseId, 'modules', moduleDoc.id, 'lessons', id)
              );

              if (lessonDoc.exists()) {
                lessonData = {
                  id: lessonDoc.id,
                  ...lessonDoc.data(),
                  type: lessonDoc.data()?.type || 'VIDEO',
                  content: lessonDoc.data()?.content || '',
                  resources: lessonDoc.data()?.resources || []
                } as Lesson;
                console.log('Found lesson in module subcollection:', moduleDoc.id, lessonData);
                break;
              }

              // If still not found and this is the first module, try getting the first lesson
              if (!lessonData && !allLessonsInModule.empty && id === 'lesson-1') {
                const firstLesson = allLessonsInModule.docs[0];
                lessonData = {
                  id: firstLesson.id, // Use actual Firestore ID
                  ...firstLesson.data(),
                  type: firstLesson.data()?.type || 'VIDEO',
                  content: firstLesson.data()?.content || '',
                  resources: firstLesson.data()?.resources || []
                } as Lesson;
                console.log('Using first lesson in module as fallback:', moduleDoc.id, lessonData);
                break;
              }
            }
          }
        }
        
        if (!lessonData) {
          console.error('Lesson not found in any location:', { courseId: actualCourseId, lessonId: id });
          throw new Error('Lecke nem található');
        }
        
        console.log('🔍 [useLesson] Lesson fetched:', {
          id: lessonData.id,
          title: lessonData.title,
          type: lessonData.type,
          hasVideoUrl: !!lessonData.videoUrl,
          hasContent: !!lessonData.content
        });
        
        return lessonData;
        
      } catch (error) {
        console.error('Error fetching lesson:', error);
        throw error;
      }
    },
    enabled: !!id && !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 0, // Don't cache failed queries
    retry: (failureCount, error) => {
      // Don't retry auth-related errors
      if (error.message.includes('Bejelentkezés') || error.message.includes('Autentikáció')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  console.log('📊 [useLesson] Query state:', {
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error?.message,
    hasData: !!queryResult.data
  });

  return queryResult;
}

export const useLessonsForModule = (moduleId: string | undefined) => {
  return useQuery<Lesson[], Error>({
    queryKey: ['module-lessons', moduleId],
    queryFn: async () => {
      const getLessonsForModule = httpsCallable(functions, 'getLessonsForModule')
      const result: any = await getLessonsForModule({ moduleId })
      return result.data.lessons ?? []
    },
    enabled: !!moduleId,
  })
} 