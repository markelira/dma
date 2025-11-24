import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import {
  LESSON_COMPLETION_THRESHOLD,
  calculateCourseProgress,
  getStatusFromProgress,
} from '@/lib/progress'

interface ProgressPayload {
  lessonId: string
  watchPercentage?: number
  timeSpent?: number
  quizScore?: number
  deviceId?: string
  sessionId?: string
  courseId?: string
  resumePosition?: number
  completed?: boolean
}

// Generate a persistent device ID
const getDeviceId = (): string => {
  const storageKey = 'elira_device_id'
  let deviceId = localStorage.getItem(storageKey)
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(storageKey, deviceId)
  }
  
  return deviceId
}

// Generate a session ID
const getSessionId = (): string => {
  const storageKey = 'elira_session_id'
  let sessionId = sessionStorage.getItem(storageKey)
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(storageKey, sessionId)
  }
  
  return sessionId
}

export const useLessonProgress = () => {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ lessonId, courseId, ...body }: ProgressPayload) => {
      if (!user) {
        throw new Error('User must be authenticated to save progress')
      }

      const deviceId = getDeviceId()
      const sessionId = getSessionId()

      console.log('📊 Saving Progress to Firestore:', {
        lessonId,
        courseId,
        deviceId,
        sessionId,
        ...body
      })

      // Import Firestore functions
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')

      // Create progress document ID: {userId}_{lessonId}
      const progressId = `${user.uid}_${lessonId}`
      const progressRef = doc(db, 'lessonProgress', progressId)

      // Prepare progress data
      const progressData: any = {
        userId: user.uid,
        lessonId,
        deviceId,
        sessionId,
        lastWatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Add courseId if provided
      if (courseId) {
        progressData.courseId = courseId
      }

      // Add watchPercentage if provided
      if (body.watchPercentage !== undefined) {
        progressData.watchPercentage = body.watchPercentage

        // Mark as completed if >= threshold (90%)
        if (body.watchPercentage >= LESSON_COMPLETION_THRESHOLD) {
          progressData.completed = true
          progressData.completedAt = serverTimestamp()
        }
      }

      // Add timeSpent if provided
      if (body.timeSpent !== undefined) {
        progressData.timeSpent = body.timeSpent
      }

      // Add resumePosition if provided
      if (body.resumePosition !== undefined) {
        progressData.resumePosition = body.resumePosition
      }

      // Add quizScore if provided
      if (body.quizScore !== undefined) {
        progressData.quizScore = body.quizScore
      }

      // Save to Firestore (merge to preserve existing data)
      await setDoc(progressRef, progressData, { merge: true })

      console.log('✅ Progress saved to Firestore:', progressId)

      // Update enrollment progress if courseId is provided
      if (courseId) {
        try {
          const { collection, query, where, getDocs, getDoc, updateDoc } = await import('firebase/firestore')

          // Get course to count total lessons
          const courseRef = doc(db, 'courses', courseId)
          const courseDoc = await getDoc(courseRef)

          if (courseDoc.exists()) {
            const courseData = courseDoc.data()
            const courseType = courseData.courseType || courseData.type

            // Count total lessons - check lessonCount field first, then query subcollection
            let totalLessons = courseData.lessonCount || 0

            // If no lessonCount, query the lessons subcollection
            if (totalLessons === 0) {
              const lessonsRef = collection(db, 'courses', courseId, 'lessons')
              const lessonsSnapshot = await getDocs(lessonsRef)
              totalLessons = lessonsSnapshot.size
              console.log('📊 Counted lessons from flat subcollection:', totalLessons)
            }

            // For ACADEMIA courses, also check modules subcollection
            if (totalLessons === 0 && courseType === 'ACADEMIA') {
              const modulesRef = collection(db, 'courses', courseId, 'modules')
              const modulesSnapshot = await getDocs(modulesRef)

              for (const moduleDoc of modulesSnapshot.docs) {
                const moduleLessonsRef = collection(db, 'courses', courseId, 'modules', moduleDoc.id, 'lessons')
                const moduleLessonsSnapshot = await getDocs(moduleLessonsRef)
                totalLessons += moduleLessonsSnapshot.size
              }
              console.log('📊 Counted lessons from ACADEMIA modules:', totalLessons)
            }

            if (totalLessons > 0) {
              // Count completed lessons for this user in this course
              const progressQuery = query(
                collection(db, 'lessonProgress'),
                where('userId', '==', user.uid),
                where('courseId', '==', courseId),
                where('completed', '==', true)
              )
              const completedSnapshot = await getDocs(progressQuery)
              const completedCount = completedSnapshot.size

              // Calculate progress percentage using utility
              const progressPercentage = calculateCourseProgress(completedCount, totalLessons)
              const enrollmentStatus = getStatusFromProgress(progressPercentage)

              // Update enrollment document
              const enrollmentId = `${user.uid}_${courseId}`
              const enrollmentRef = doc(db, 'enrollments', enrollmentId)

              await updateDoc(enrollmentRef, {
                progress: progressPercentage,
                lastAccessedAt: serverTimestamp(),
                status: enrollmentStatus
              }).catch(() => {
                // Enrollment might not exist yet, that's okay
                console.log('📝 Enrollment not found, skipping progress update')
              })

              console.log('📈 Enrollment progress updated:', {
                courseId,
                completedLessons: completedCount,
                totalLessons,
                progressPercentage,
                status: enrollmentStatus
              })
            }
          }
        } catch (enrollmentError) {
          // Don't fail the main progress save if enrollment update fails
          console.warn('⚠️ Failed to update enrollment progress:', enrollmentError)
        }
      }

      return {
        success: true,
        progressId,
        lessonId,
        deviceId,
        sessionId,
        syncVersion: Date.now(),
        ...progressData
      }
    },
    onMutate: async ({ lessonId }) => {
      await qc.cancelQueries({ queryKey: ['player-data'] })
      await qc.cancelQueries({ queryKey: ['lesson-progress', lessonId] })
    },
    onSuccess: (data, variables) => {
      // Update cached progress data
      qc.setQueryData(['lesson-progress', variables.lessonId], data)
      
      console.log('✅ Progress synced:', {
        lesson: variables.lessonId,
        device: data.deviceId,
        syncVersion: data.syncVersion
      })
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: ['player-data'] })
      // Invalidate enrollments to refresh progress display
      if (variables.courseId) {
        qc.invalidateQueries({ queryKey: ['enrollments'] })
        qc.invalidateQueries({ queryKey: ['course-progress', variables.courseId] })
      }
    },
  })
}

// Hook to get synchronized progress across devices
export const useSyncedLessonProgress = (lessonId: string, courseId?: string) => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['lesson-progress', lessonId],
    queryFn: async () => {
      if (!user) return null
      
      const fn = httpsCallable(functions, 'getSyncedLessonProgress')
      const res = await fn({ lessonId, courseId })
      return (res.data as any)
    },
    enabled: !!user && !!lessonId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to sync progress when switching devices
export const useDeviceSync = () => {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ courseId }: { courseId?: string }) => {
      const deviceId = getDeviceId()
      
      const fn = httpsCallable(functions, 'syncProgressOnDeviceSwitch')
      const res = await fn({ deviceId, courseId })
      return (res.data as any)
    },
    onSuccess: (data) => {
      console.log('🔄 Device sync completed:', {
        device: data.deviceId,
        syncedLessons: data.syncedLessons,
        syncTime: data.syncTime
      })
      
      // Invalidate all progress queries to refresh with synced data
      qc.invalidateQueries({ queryKey: ['lesson-progress'] })
      qc.invalidateQueries({ queryKey: ['player-data'] })
    }
  })
}

// Hook to get device information
export const useDeviceInfo = () => {
  return {
    deviceId: getDeviceId(),
    sessionId: getSessionId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
} 