import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

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
            throw new Error('Kurzus nem található');
          }
          courseDoc = docSnap;
        }

        const courseData = courseDoc.data();
        const actualCourseId = courseDoc.id;

        // Use existing modules from course data, or fetch from subcollections
        let modules = courseData.modules || [];

        if (modules.length === 0) {
          // NEW: First try fetching modules subcollection (new structure)
          const modulesSnapshot = await getDocs(
            query(collection(db, 'courses', actualCourseId, 'modules'), orderBy('order', 'asc'))
          );

          if (!modulesSnapshot.empty) {
            // Fetch lessons from each module's subcollection
            const modulesPromises = modulesSnapshot.docs.map(async (moduleDoc) => {
              const moduleData = moduleDoc.data();
              const lessonsSnapshot = await getDocs(
                query(
                  collection(db, 'courses', actualCourseId, 'modules', moduleDoc.id, 'lessons'),
                  orderBy('order', 'asc')
                )
              );

              const lessons = lessonsSnapshot.docs.map(doc => ({
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
          } else {
            // Fallback: fetch lessons from direct subcollection (old structure)
            const lessonsSnapshot = await getDocs(
              query(collection(db, 'courses', actualCourseId, 'lessons'), orderBy('order', 'asc'))
            );

            if (!lessonsSnapshot.empty) {
              const lessons = lessonsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                progress: { completed: false, watchPercentage: 0 }
              }));

              modules = [{
                id: 'default-module',
                title: courseData.title || 'Course Content',
                description: '',
                order: 1,
                status: 'PUBLISHED',
                lessons
              }];
            }
          }
        }

        return {
          success: true,
          course: {
            id: actualCourseId,
            ...courseData,
            modules,
            autoplayNext: courseData.autoplayNext ?? true
          },
          signedPlaybackUrl: null
        };

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