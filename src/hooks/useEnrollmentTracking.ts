import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useCallback } from 'react'

/**
 * Hook to track enrollment lesson access
 * Updates the enrollment document with current lesson ID and last accessed time
 */
export function useEnrollmentTracking() {
  const { user } = useAuthStore()

  const trackLessonAccess = useCallback(async (courseId: string, lessonId: string) => {
    if (!user?.uid) {
      console.warn('Cannot track lesson access: user not authenticated')
      return
    }

    try {
      // Find enrollment document (userId_courseId format)
      const enrollmentId = `${user.uid}_${courseId}`
      const enrollmentRef = doc(db, 'enrollments', enrollmentId)

      // Update enrollment with current lesson and last access time
      await updateDoc(enrollmentRef, {
        currentLessonId: lessonId,
        lastAccessedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      console.log('✅ Enrollment tracking updated:', { courseId, lessonId })
    } catch (error) {
      // Fail silently - enrollment tracking is not critical
      console.error('Error tracking lesson access:', error)
    }
  }, [user?.uid])

  return { trackLessonAccess }
}
