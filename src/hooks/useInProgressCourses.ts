import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface InProgressCourse {
  courseId: string
  title: string
  thumbnailUrl?: string
  totalLessons: number
  completedLessons: number
  completionPercentage: number
  lastAccessedAt: string
  certificateEarned: boolean
  certificateId?: string
}

interface InProgressResponse {
  enrolledCourses: InProgressCourse[]
  totalCoursesEnrolled: number
  totalLessonsCompleted: number
  totalCertificatesEarned: number
}

// Hook to get user's in-progress courses
export const useInProgressCourses = () => {
  return useQuery<InProgressResponse>({
    queryKey: ['in-progress-courses'],
    queryFn: async () => {
      const getUserProgressFn = httpsCallable(functions, 'getUserProgress') as any;
      const result: any = await getUserProgressFn();
      return result.data;
    },
    enabled: false, // Only fetch when explicitly called
  })
} 