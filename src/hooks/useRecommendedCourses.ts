import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export interface RecommendedCourse {
  id: string
  title: string
  instructor: string
  instructorId: string
  rating: number
  enrolledCount: number
  duration: string
  thumbnailUrl?: string
  category?: string
  description?: string
}

/**
 * Custom hook to fetch recommended courses for the user
 *
 * Features:
 * - Fetches popular/trending courses
 * - Excludes courses user is already enrolled in
 * - Enriches with instructor information
 * - Automatic caching with TanStack Query
 *
 * @param maxCount - Maximum number of recommendations (default: 3)
 * @returns Query result with recommended courses
 */
export function useRecommendedCourses(maxCount: number = 3) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['recommendedCourses', user?.uid, maxCount],
    queryFn: async (): Promise<RecommendedCourse[]> => {
      // 1. Get user's enrolled course IDs to exclude them
      let enrolledCourseIds: string[] = []
      if (user?.uid) {
        const enrollmentsRef = collection(db, 'enrollments')
        const enrollmentsQuery = query(enrollmentsRef, where('userId', '==', user.uid))
        const enrollmentsSnap = await getDocs(enrollmentsQuery)
        enrolledCourseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId)
      }

      // 2. Fetch popular/trending courses
      const coursesRef = collection(db, 'courses')
      // Fetch more than needed so we can filter out enrolled ones
      const coursesQuery = query(
        coursesRef,
        where('published', '==', true),
        orderBy('enrolledCount', 'desc'),
        limit(maxCount + enrolledCourseIds.length)
      )

      const coursesSnap = await getDocs(coursesQuery)

      // 3. Filter and process courses
      const recommendations: RecommendedCourse[] = []

      for (const courseDoc of coursesSnap.docs) {
        // Skip if user is already enrolled
        if (enrolledCourseIds.includes(courseDoc.id)) {
          continue
        }

        // Stop if we have enough recommendations
        if (recommendations.length >= maxCount) {
          break
        }

        const courseData = courseDoc.data()

        // Fetch instructor name
        let instructorName = 'Unknown Instructor'
        if (courseData.instructorId) {
          try {
            const instructorRef = doc(db, 'users', courseData.instructorId)
            const instructorSnap = await getDoc(instructorRef)
            if (instructorSnap.exists()) {
              const instructorData = instructorSnap.data()
              instructorName = `${instructorData.firstName || ''} ${instructorData.lastName || ''}`.trim() || 'Unknown Instructor'
            }
          } catch (error) {
            console.error('Error fetching instructor:', error)
          }
        }

        // Calculate duration from lesson count or use default
        const lessonCount = courseData.lessonCount || 0
        const estimatedHours = Math.ceil(lessonCount * 0.5) // Estimate 30 mins per lesson
        const duration = estimatedHours > 0 ? `${estimatedHours} óra` : '—'

        recommendations.push({
          id: courseDoc.id,
          title: courseData.title || 'Untitled Course',
          instructor: instructorName,
          instructorId: courseData.instructorId,
          rating: courseData.rating || 4.5,
          enrolledCount: courseData.enrolledCount || 0,
          duration,
          thumbnailUrl: courseData.thumbnailUrl,
          category: courseData.category,
          description: courseData.description,
        })
      }

      return recommendations
    },
    enabled: true, // Always enabled, works with or without auth
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}
