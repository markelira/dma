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

      // 2. Fetch all courses (no orderBy to avoid index issues)
      const coursesRef = collection(db, 'courses')
      // Fetch all courses - we'll filter and sort client-side
      const coursesQuery = query(coursesRef)

      const coursesSnap = await getDocs(coursesQuery)

      console.log('📊 [Recommended Courses] Fetched courses:', coursesSnap.docs.length)

      // Filter for published courses (check both status field and published field)
      const publishedCourses = coursesSnap.docs.filter(doc => {
        const data = doc.data()
        const isPublished = data.status === 'PUBLISHED' || data.published === true
        console.log(`📊 [Recommended Courses] Course ${doc.id}:`, {
          status: data.status,
          published: data.published,
          isPublished,
          title: data.title
        })
        return isPublished
      })

      console.log('📊 [Recommended Courses] Published courses:', publishedCourses.length)
      console.log('📊 [Recommended Courses] Enrolled course IDs:', enrolledCourseIds)

      // 3. Filter and process courses
      const recommendations: RecommendedCourse[] = []

      for (const courseDoc of publishedCourses) {
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

      // Sort by enrolledCount (or createdAt if enrolledCount doesn't exist)
      recommendations.sort((a, b) => {
        // Primary sort: by enrolled count (descending)
        const enrollDiff = b.enrolledCount - a.enrolledCount
        if (enrollDiff !== 0) return enrollDiff

        // Secondary sort: by title
        return a.title.localeCompare(b.title)
      })

      // Limit to maxCount
      const finalRecommendations = recommendations.slice(0, maxCount)

      console.log('📊 [Recommended Courses] Final recommendations:', finalRecommendations.length, finalRecommendations)

      return finalRecommendations
    },
    enabled: true, // Always enabled, works with or without auth
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}
