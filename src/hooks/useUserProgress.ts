import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { UserProgressData } from '@/types';

export function useUserProgress() {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery<UserProgressData>({
    queryKey: ['userProgress'],
    queryFn: async () => {
      console.log('🔧 [useUserProgress] Fetching real enrollment data from Firebase');
      
      const { user } = useAuthStore.getState();
      if (!user) {
        return {
          success: true,
          enrolledCourses: [],
          totalCoursesEnrolled: 0,
          totalLessonsCompleted: 0,
          totalCertificatesEarned: 0,
          totalHoursLearned: 0,
          coursesInProgress: 0,
          coursesCompleted: 0,
          overallCompletionRate: 0
        } as UserProgressData;
      }
      
      try {
        const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        // Query enrollments
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('userId', '==', user.id)
        );
        
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const enrolledCourses = [];
        
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
          const enrollment = enrollmentDoc.data();
          
          // Fetch course details
          const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
          
          if (courseDoc.exists()) {
            const course = courseDoc.data();
            
            enrolledCourses.push({
              courseId: enrollment.courseId,
              courseName: course.title || 'Untitled Course',
              title: course.title || 'Untitled Course',
              description: course.description || '',
              thumbnailUrl: course.thumbnailUrl || course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
              instructorName: course.instructorName || 'Unknown Instructor',
              averageRating: course.rating || course.averageRating || 0,
              reviewCount: course.reviewCount || 0,
              estimatedHours: parseInt(course.duration) || 8,
              difficulty: course.level || 'BEGINNER',
              category: course.category || 'General',
              completionPercentage: enrollment.progress || 0,
              courseState: enrollment.status || 'ACTIVE_PROGRESS',
              enrollmentDate: enrollment.enrolledAt || new Date().toISOString(),
              lastAccessedAt: enrollment.lastAccessedAt || new Date().toISOString(),
              progress: enrollment.progress || 0,
              slug: course.slug
            });
          }
        }
        
        const inProgress = enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length;
        const completed = enrolledCourses.filter(c => c.progress === 100).length;
        
        return {
          success: true,
          enrolledCourses,
          totalCoursesEnrolled: enrolledCourses.length,
          totalLessonsCompleted: 0,
          totalCertificatesEarned: completed,
          totalHoursLearned: enrolledCourses.reduce((acc, c) => acc + (c.estimatedHours * (c.progress / 100)), 0),
          coursesInProgress: inProgress,
          coursesCompleted: completed,
          overallCompletionRate: enrolledCourses.length > 0 
            ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / enrolledCourses.length)
            : 0
        } as UserProgressData;
      } catch (error) {
        console.error('❌ [useUserProgress] Error fetching user progress:', error);
        // Return fallback empty progress data
        return {
          success: true,
          enrolledCourses: [],
          totalCoursesEnrolled: 0,
          totalLessonsCompleted: 0,
          totalCertificatesEarned: 0,
          totalHoursLearned: 0,
          coursesInProgress: 0,
          coursesCompleted: 0,
          overallCompletionRate: 0
        } as UserProgressData;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 