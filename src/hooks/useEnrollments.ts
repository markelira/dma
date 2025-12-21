import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

// SCALABILITY: Use Cloud Function for batched enrollment enrichment
const USE_CLOUD_FUNCTION = true

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
        statusFilter: status || 'ALL',
        usingCloudFunction: USE_CLOUD_FUNCTION
      });

      if (!user?.uid) {
        console.error('❌ [useEnrollments] No user UID!');
        throw new Error('User not authenticated')
      }

      // SCALABILITY: Use Cloud Function for batched fetching (reduces 25K reads to 1 call)
      if (USE_CLOUD_FUNCTION) {
        try {
          const enrichEnrollmentsCallable = httpsCallable<
            { status?: string },
            { success: boolean; enrollments: any[] }
          >(functions, 'enrichEnrollments');

          const result = await enrichEnrollmentsCallable({ status });

          if (result.data.success) {
            console.log('✅ [useEnrollments] Cloud Function result:', result.data.enrollments.length, 'enrollments');

            // Convert ISO strings back to Date objects
            return result.data.enrollments.map(e => ({
              ...e,
              enrolledAt: new Date(e.enrolledAt),
              lastAccessedAt: e.lastAccessedAt ? new Date(e.lastAccessedAt) : undefined,
            })) as EnrollmentWithCourse[];
          }
        } catch (cloudError) {
          console.warn('⚠️ [useEnrollments] Cloud Function failed, falling back to direct queries:', cloudError);
          // Fall through to direct Firestore queries
        }
      }

      // FALLBACK: Direct Firestore queries (N+1 pattern - less efficient)
      const enrollmentsRef = collection(db, 'enrollments')
      let q = query(enrollmentsRef, where('userId', '==', user.uid))

      if (status) {
        const statusValues = status === 'in_progress'
          ? ['in_progress', 'ACTIVE', 'active']
          : [status]
        q = query(q, where('status', 'in', statusValues))
      }

      const enrollmentsSnap = await getDocs(q)
      console.log('📊 [useEnrollments] Fallback - Raw Firestore result:', enrollmentsSnap.size, 'documents');

      // Fetch course details for each enrollment (N+1 pattern)
      const enrollmentsWithCourses = await Promise.all(
        enrollmentsSnap.docs.map(async (enrollmentDoc) => {
          const enrollmentData = enrollmentDoc.data()

          const courseRef = doc(db, 'courses', enrollmentData.courseId)
          const courseSnap = await getDoc(courseRef)
          const courseData = courseSnap.exists() ? courseSnap.data() : null

          let instructorName = 'Unknown Instructor'
          if (courseData?.instructorId) {
            try {
              const instructorRef = doc(db, 'instructors', courseData.instructorId)
              const instructorSnap = await getDoc(instructorRef)
              if (instructorSnap.exists()) {
                instructorName = instructorSnap.data()?.name || 'Unknown Instructor'
              }
            } catch (error) {
              console.error('Error fetching instructor:', error)
            }
          }

          let enrolledAtDate: Date = enrollmentData.enrolledAt?.toDate?.() ||
            (typeof enrollmentData.enrolledAt === 'string' ? new Date(enrollmentData.enrolledAt) : new Date());

          let lastAccessedAtDate: Date | undefined = enrollmentData.lastAccessedAt?.toDate?.() ||
            (typeof enrollmentData.lastAccessedAt === 'string' ? new Date(enrollmentData.lastAccessedAt) : undefined);

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
