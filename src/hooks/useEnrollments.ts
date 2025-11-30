import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore'
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
  currentLessonId?: string
  firstLessonId?: string
  courseName?: string
  courseInstructor?: string
  courseDescription?: string
  thumbnailUrl?: string
  courseType?: string
}

interface EnrollmentWithCourse extends Enrollment {
  courseName: string
  courseInstructor: string
  courseDescription?: string
  thumbnailUrl?: string
  currentLessonId?: string
  firstLessonId?: string
  courseType?: string
}

// Fetch first published lesson from subcollection
async function getFirstLessonId(courseId: string): Promise<string | undefined> {
  try {
    const lessonsRef = collection(db, 'courses', courseId, 'lessons');
    // First try to get PUBLISHED lessons sorted by order
    const q = query(
      lessonsRef,
      orderBy('order', 'asc'),
      firestoreLimit(1)
    );
    const snap = await getDocs(q);

    if (snap.docs.length > 0) {
      // Filter for published or no status (fallback)
      const lesson = snap.docs[0].data();
      if (lesson.status === 'PUBLISHED' || !lesson.status) {
        return snap.docs[0].id;
      }
    }

    // Fallback: get any lesson if no published ones found
    const fallbackSnap = await getDocs(query(lessonsRef, firestoreLimit(1)));
    return fallbackSnap.docs.length > 0 ? fallbackSnap.docs[0].id : undefined;
  } catch (error) {
    console.error('Error fetching first lesson for course', courseId, error);
    return undefined;
  }
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
      console.log('🔍 [useEnrollments] Starting query...', {
        userId: user?.uid,
        statusFilter: status || 'ALL'
      });

      if (!user?.uid) {
        console.error('❌ [useEnrollments] No user UID!');
        throw new Error('User not authenticated')
      }

      // Fetch actual enrollments from Firestore
      const enrollmentsRef = collection(db, 'enrollments')
      let q = query(enrollmentsRef, where('userId', '==', user.uid))

      if (status) {
        // Handle status variations: 'in_progress' can be stored as 'ACTIVE' or 'in_progress'
        const statusValues = status === 'in_progress'
          ? ['in_progress', 'ACTIVE', 'active']
          : [status]
        q = query(q, where('status', 'in', statusValues))
        console.log('🔎 [useEnrollments] Added status filter:', statusValues);
      }

      const enrollmentsSnap = await getDocs(q)
      console.log('📊 [useEnrollments] Raw Firestore result:', enrollmentsSnap.size, 'documents');

      // Log each enrollment found
      enrollmentsSnap.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`  [${i}] ${doc.id}: status=${data.status}, courseId=${data.courseId}`);
      });

      // Fetch course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollmentsSnap.docs.map(async (enrollmentDoc) => {
          const enrollmentData = enrollmentDoc.data()

          // Fetch course details
          const courseRef = doc(db, 'courses', enrollmentData.courseId)
          const courseSnap = await getDoc(courseRef)
          const courseData = courseSnap.exists() ? courseSnap.data() : null

          // Fetch instructor name if instructorId exists
          let instructorName = 'Unknown Instructor'
          if (courseData?.instructorId) {
            try {
              const instructorRef = doc(db, 'instructors', courseData.instructorId)
              const instructorSnap = await getDoc(instructorRef)
              if (instructorSnap.exists()) {
                const instructorData = instructorSnap.data()
                instructorName = instructorData.name || 'Unknown Instructor'
              }
            } catch (error) {
              console.error('Error fetching instructor:', error)
            }
          }

          // Handle both Firestore Timestamp and ISO string formats for enrolledAt
          let enrolledAtDate: Date;
          if (enrollmentData.enrolledAt?.toDate) {
            // Firestore Timestamp
            enrolledAtDate = enrollmentData.enrolledAt.toDate();
          } else if (typeof enrollmentData.enrolledAt === 'string') {
            // ISO string format
            enrolledAtDate = new Date(enrollmentData.enrolledAt);
          } else {
            enrolledAtDate = new Date();
          }

          // Handle both formats for lastAccessedAt
          let lastAccessedAtDate: Date | undefined;
          if (enrollmentData.lastAccessedAt?.toDate) {
            lastAccessedAtDate = enrollmentData.lastAccessedAt.toDate();
          } else if (typeof enrollmentData.lastAccessedAt === 'string') {
            lastAccessedAtDate = new Date(enrollmentData.lastAccessedAt);
          }

          // Get first lesson ID from subcollection
          const firstLessonId = await getFirstLessonId(enrollmentData.courseId);

          return {
            id: enrollmentDoc.id,
            userId: enrollmentData.userId,
            courseId: enrollmentData.courseId,
            status: enrollmentData.status || 'not_started',
            progress: enrollmentData.progress || 0,
            enrolledAt: enrolledAtDate,
            lastAccessedAt: lastAccessedAtDate,
            currentLessonId: enrollmentData.currentLessonId,
            firstLessonId,
            courseName: courseData?.title || 'Unknown Course',
            courseInstructor: instructorName,
            courseDescription: courseData?.description,
            thumbnailUrl: courseData?.thumbnailUrl,
            courseType: courseData?.courseType,
          } as EnrollmentWithCourse
        })
      )

      // Sort by lastAccessedAt (most recent first)
      enrollmentsWithCourses.sort((a, b) => {
        const dateA = a.lastAccessedAt || a.enrolledAt
        const dateB = b.lastAccessedAt || b.enrolledAt
        return dateB.getTime() - dateA.getTime()
      })

      console.log('✅ [useEnrollments] Final result:', {
        totalEnrollments: enrollmentsWithCourses.length,
        courses: enrollmentsWithCourses.map(e => ({
          id: e.id,
          courseId: e.courseId,
          courseName: e.courseName,
          status: e.status
        }))
      });

      return enrollmentsWithCourses
    },
    enabled: !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
