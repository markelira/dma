import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

interface ProgressPayload {
  lessonId: string
  watchPercentage?: number
  timeSpent?: number
  quizScore?: number
  deviceId?: string
  sessionId?: string
  courseId?: string
  resumePosition?: number
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
  
  return useMutation({
    mutationFn: async ({ lessonId, ...body }: ProgressPayload) => {
      const deviceId = getDeviceId()
      const sessionId = getSessionId()
      
      // For now, just log the progress update
      // In production, this would update Firestore
      console.log('📊 Progress Update:', {
        lessonId,
        deviceId,
        sessionId,
        ...body
      })
      
      // Return mock success response
      return {
        success: true,
        lessonId,
        deviceId,
        sessionId,
        syncVersion: Date.now(),
        ...body
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['player-data'] })
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