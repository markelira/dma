import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to fetch all completed lesson IDs for a specific course
 * Used for showing progress indicators in the sidebar
 */
export const useCourseProgress = (courseId: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['course-progress', courseId, user?.uid],
    queryFn: async () => {
      if (!user) return { completedLessonIds: [], progressMap: {} };

      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Query all lessonProgress documents for this user
      const progressQuery = query(
        collection(db, 'lessonProgress'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(progressQuery);
      const completedLessonIds: string[] = [];
      const progressMap: Record<string, any> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const lessonId = data.lessonId;

        progressMap[lessonId] = {
          watchPercentage: data.watchPercentage || 0,
          completed: data.completed || false,
          timeSpent: data.timeSpent || 0,
          lastWatchedAt: data.lastWatchedAt,
          resumePosition: data.resumePosition || 0,
        };

        // Add to completed list if >= 90% watched or explicitly marked as completed
        if (data.completed || (data.watchPercentage && data.watchPercentage >= 90)) {
          completedLessonIds.push(lessonId);
        }
      });

      console.log(`📊 Loaded progress for ${completedLessonIds.length} completed lessons`);

      return {
        completedLessonIds,
        progressMap,
      };
    },
    enabled: !!user && !!courseId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get resume position for a specific lesson
 */
export const useResumePosition = (lessonId: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['resume-position', lessonId, user?.uid],
    queryFn: async () => {
      if (!user) return 0;

      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const progressId = `${user.uid}_${lessonId}`;
      const progressRef = doc(db, 'lessonProgress', progressId);
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        const data = progressDoc.data();
        return data.resumePosition || 0;
      }

      return 0;
    },
    enabled: !!user && !!lessonId,
    staleTime: 30 * 1000,
  });
};
