import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export const usePlayerData = (courseId: string | undefined, lessonId: string | undefined) => {
  const { isAuthenticated, authReady, user } = useAuthStore();
  
  return useQuery({
    queryKey: ['player-data', courseId, lessonId],
    queryFn: async () => {
      if (!courseId || !lessonId) return null
      
      console.log('🔍 [usePlayerData] Fetching course and lessons from Firestore:', { 
        courseId, 
        lessonId,
        authReady,
        isAuthenticated,
        hasUser: !!user 
      });
      
      try {
        // First try to find course by slug
        let courseDoc;
        const coursesBySlug = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseId)));
        
        if (!coursesBySlug.empty) {
          courseDoc = coursesBySlug.docs[0];
          console.log('Found course by slug:', courseId, '-> ID:', courseDoc.id);
        } else {
          // If not found by slug, try by ID
          const docRef = doc(db, 'courses', courseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            courseDoc = docSnap;
          } else {
            console.error('Course not found:', courseId);
            throw new Error('Kurzus nem található');
          }
        }
        
        const courseData = {
          id: courseDoc.id,
          ...courseDoc.data()
        };
        
        // Fetch all lessons for the course to build modules (use actual course ID, not slug)
        const actualCourseId = courseDoc.id;
        const lessonsRef = collection(db, 'courses', actualCourseId, 'lessons');
        const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        
        const lessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Create module structure (for now, single module with all lessons)
        const modules = [{
          id: 'module1',
          title: 'React Alapok',
          order: 1,
          lessons: lessons.map(lesson => ({
            ...lesson,
            progress: {
              completed: false,
              watchPercentage: 0
            }
          }))
        }];
        
        console.log('🔍 [usePlayerData] Course data fetched:', {
          courseTitle: courseData.title,
          lessonsCount: lessons.length,
          currentLessonId: lessonId
        });
        
        return {
          success: true,
          course: {
            ...courseData,
            modules,
            autoplayNext: true
          },
          signedPlaybackUrl: null // We'll use the videoUrl directly from lesson data
        };
        
      } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
      }
    },
    enabled: !!courseId && !!lessonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry auth-related errors
      if (error.message.includes('Bejelentkezés') || error.message.includes('Autentikáció')) {
        return false;
      }
      return failureCount < 3;
    }
  })
} 