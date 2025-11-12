import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress: number
  enrolledAt: Date
  lastAccessedAt?: Date
  courseName?: string
  courseInstructor?: string
  courseDescription?: string
}

interface EnrollmentWithCourse extends Enrollment {
  courseName: string
  courseInstructor: string
  courseDescription?: string
}

/**
 * Custom hook to fetch user's enrollments with course details
 *
 * Features:
 * - Fetches enrollments from Firestore
 * - Enriches with course information
 * - Automatic caching with TanStack Query
 * - Error handling
 *
 * @param status - Optional filter by enrollment status
 * @returns Query result with enrollment data
 */
export function useEnrollments(status?: 'not_started' | 'in_progress' | 'completed') {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['enrollments', user?.uid, status],
    queryFn: async (): Promise<EnrollmentWithCourse[]> => {
      if (!user?.uid) {
        throw new Error('User not authenticated')
      }

      // 1. Check if user has active team subscription
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? userSnap.data() : null

      const hasActiveSubscription = userData?.subscriptionStatus === 'active' && userData?.teamId

      // 2. Fetch actual enrollments
      const enrollmentsRef = collection(db, 'enrollments')
      let q = query(enrollmentsRef, where('userId', '==', user.uid))

      if (status) {
        q = query(q, where('status', '==', status))
      }

      const enrollmentsSnap = await getDocs(q)

      // Track enrolled course IDs to avoid duplicates
      const enrolledCourseIds = new Set<string>()

      // 3. Fetch course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollmentsSnap.docs.map(async (enrollmentDoc) => {
          const enrollmentData = enrollmentDoc.data()
          enrolledCourseIds.add(enrollmentData.courseId)

          // Fetch course details
          const courseRef = doc(db, 'courses', enrollmentData.courseId)
          const courseSnap = await getDoc(courseRef)
          const courseData = courseSnap.exists() ? courseSnap.data() : null

          // Fetch instructor name if instructorId exists
          let instructorName = 'Unknown Instructor'
          if (courseData?.instructorId) {
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

          return {
            id: enrollmentDoc.id,
            userId: enrollmentData.userId,
            courseId: enrollmentData.courseId,
            status: enrollmentData.status || 'not_started',
            progress: enrollmentData.progress || 0,
            enrolledAt: enrollmentData.enrolledAt?.toDate() || new Date(),
            lastAccessedAt: enrollmentData.lastAccessedAt?.toDate(),
            courseName: courseData?.title || 'Unknown Course',
            courseInstructor: instructorName,
            courseDescription: courseData?.description,
          } as EnrollmentWithCourse
        })
      )

      // 4. If user has active subscription, add ALL courses as virtual enrollments
      if (hasActiveSubscription) {
        const coursesRef = collection(db, 'courses')
        const coursesSnap = await getDocs(coursesRef)

        const virtualEnrollments = await Promise.all(
          coursesSnap.docs
            .filter(courseDoc => !enrolledCourseIds.has(courseDoc.id)) // Only add courses not already enrolled
            .map(async (courseDoc) => {
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

              return {
                id: `sub_${courseDoc.id}`, // Virtual enrollment ID
                userId: user.uid,
                courseId: courseDoc.id,
                status: 'not_started' as const,
                progress: 0,
                enrolledAt: new Date(), // Use current date for subscription access
                lastAccessedAt: undefined,
                courseName: courseData.title || 'Unknown Course',
                courseInstructor: instructorName,
                courseDescription: courseData.description,
              } as EnrollmentWithCourse
            })
        )

        // Merge actual enrollments with virtual subscription enrollments
        enrollmentsWithCourses.push(...virtualEnrollments)
      }

      // 5. Sort by lastAccessedAt (most recent first)
      enrollmentsWithCourses.sort((a, b) => {
        const dateA = a.lastAccessedAt || a.enrolledAt
        const dateB = b.lastAccessedAt || b.enrolledAt
        return dateB.getTime() - dateA.getTime()
      })

      return enrollmentsWithCourses
    },
    enabled: !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
