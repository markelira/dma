import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Activity, ActivityType, ActivityPriority } from '@/types';

/**
 * Hook to fetch recent learning activities
 * Derives activities from lessonProgress collection
 */
export function useRecentActivities(maxItems: number = 5) {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery<Activity[]>({
    queryKey: ['recentActivities', user?.id, maxItems],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Fetch recent lesson progress entries
        const progressQuery = query(
          collection(db, 'lessonProgress'),
          where('userId', '==', user.id),
          orderBy('lastWatchedAt', 'desc'),
          limit(maxItems * 2) // Fetch more to filter and dedupe
        );

        const progressSnapshot = await getDocs(progressQuery);
        const activities: Activity[] = [];
        const seenCourses = new Set<string>();

        for (const progressDoc of progressSnapshot.docs) {
          if (activities.length >= maxItems) break;

          const progress = progressDoc.data();
          const courseId = progress.courseId;

          // Skip if we've already added an activity for this course (to show variety)
          if (seenCourses.has(courseId) && activities.length > 2) continue;
          seenCourses.add(courseId);

          // Get course info for context
          let courseName = 'Tartalom';
          let lessonTitle = 'Lecke';

          try {
            const courseDoc = await getDoc(doc(db, 'courses', courseId));
            if (courseDoc.exists()) {
              courseName = courseDoc.data().title || 'Tartalom';
            }
          } catch (e) {
            // Ignore course fetch errors
          }

          // Determine activity type based on progress
          let type: ActivityType;
          let priority: ActivityPriority;
          let title: string;
          let description: string;

          if (progress.completed) {
            type = ActivityType.LESSON_COMPLETED;
            priority = ActivityPriority.MEDIUM;
            title = 'Lecke befejezve';
            description = `Befejezte a leckét: ${courseName}`;
          } else if (progress.watchPercentage >= 50) {
            type = ActivityType.LEARNING_SESSION;
            priority = ActivityPriority.LOW;
            title = 'Tanulás folyamatban';
            description = `${Math.round(progress.watchPercentage)}% megtekintve: ${courseName}`;
          } else {
            type = ActivityType.LEARNING_SESSION;
            priority = ActivityPriority.LOW;
            title = 'Lecke elkezdve';
            description = `Elkezdte a tanulást: ${courseName}`;
          }

          activities.push({
            id: progressDoc.id,
            userId: user.id,
            type,
            priority,
            title,
            description,
            courseId,
            courseName,
            lessonId: progress.lessonId,
            createdAt: progress.lastWatchedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            metadata: {
              watchPercentage: progress.watchPercentage,
              timeSpent: progress.timeSpent,
              completed: progress.completed,
            },
          });
        }

        return activities;
      } catch (error) {
        console.error('[useRecentActivities] Error:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
