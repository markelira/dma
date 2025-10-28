"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { httpsCallable, getFunctions } from 'firebase/functions'
import { doc, onSnapshot, getFirestore, updateDoc, serverTimestamp } from 'firebase/firestore'

// Device identification and management
interface DeviceInfo {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  lastSeen: Date
  isActive: boolean
  location?: {
    country?: string
    city?: string
  }
}

// Progress sync data structure
interface ProgressSyncData {
  userId: string
  lessonId: string
  courseId: string
  contentType: 'video' | 'text' | 'quiz' | 'pdf' | 'audio'
  
  // Universal progress fields
  completionPercentage: number
  timeSpent: number
  lastPosition: number // seconds for video/audio, scroll % for text, question number for quiz
  isCompleted: boolean
  
  // Content-specific progress
  videoProgress?: {
    currentTime: number
    duration: number
    playbackRate: number
    volume: number
    qualityLevel: string
    subtitleTrack?: string
    chapters: Array<{
      id: string
      completed: boolean
      timeSpent: number
    }>
    bookmarks: Array<{
      id: string
      timestamp: number
      title: string
      note?: string
    }>
    notes: Array<{
      id: string
      timestamp: number
      content: string
      title: string
    }>
  }
  
  readingProgress?: {
    scrollPercentage: number
    readingTime: number
    wordsRead: number
    sectionsCompleted: string[]
    highlights: Array<{
      id: string
      text: string
      position: number
      color: string
    }>
    notes: Array<{
      id: string
      content: string
      position: number
    }>
  }
  
  quizProgress?: {
    currentQuestionIndex: number
    answers: Record<string, any>
    attempts: number
    timeSpent: number
    hintsUsed: string[]
    score?: number
    completed: boolean
    mistakes: Array<{
      questionId: string
      incorrectAnswer: any
      correctAnswer: any
    }>
  }
  
  // Sync metadata
  deviceId: string
  deviceInfo: DeviceInfo
  lastUpdated: Date
  syncVersion: number
  syncConflicts?: Array<{
    field: string
    localValue: any
    remoteValue: any
    resolution: 'local' | 'remote' | 'merged'
    timestamp: Date
  }>
}

// Conflict resolution strategies
type ConflictResolution = 'latest_wins' | 'most_progress' | 'user_choice' | 'merge_data'

interface SyncOptions {
  conflictResolution: ConflictResolution
  syncInterval: number // milliseconds
  offlineMode: boolean
  enableRealTimeSync: boolean
  autoResolveConflicts: boolean
}

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: Date
  pendingSyncCount: number
  conflictCount: number
  error?: string
}

// Hook interface
interface UseAdvancedProgressSyncOptions {
  lessonId: string
  courseId: string
  contentType: 'video' | 'text' | 'quiz' | 'pdf' | 'audio'
  syncOptions?: Partial<SyncOptions>
  onConflictDetected?: (conflicts: ProgressSyncData['syncConflicts']) => void
  onSyncComplete?: (data: ProgressSyncData) => void
  onSyncError?: (error: Error) => void
}

export const useAdvancedProgressSync = ({
  lessonId,
  courseId,
  contentType,
  syncOptions = {},
  onConflictDetected,
  onSyncComplete,
  onSyncError
}: UseAdvancedProgressSyncOptions) => {
  const { user } = useAuthStore()
  const [progressData, setProgressData] = useState<ProgressSyncData | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingSyncCount: 0,
    conflictCount: 0
  })
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([])
  
  // Refs for managing sync operations
  const syncIntervalRef = useRef<NodeJS.Timeout>()
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const pendingUpdatesRef = useRef<Partial<ProgressSyncData>[]>([])
  const lastSyncVersionRef = useRef<number>(0)
  
  // Default sync options
  const defaultSyncOptions: SyncOptions = {
    conflictResolution: 'most_progress',
    syncInterval: 10000, // 10 seconds
    offlineMode: false,
    enableRealTimeSync: true,
    autoResolveConflicts: true,
    ...syncOptions
  }

  // Generate device information
  const generateDeviceInfo = useCallback((): DeviceInfo => {
    const userAgent = navigator.userAgent
    const deviceId = localStorage.getItem('deviceId') || 
      `device_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', deviceId)
    }

    // Detect device type
    let deviceType: DeviceInfo['type'] = 'desktop'
    if (/Mobile|Android|iPhone/.test(userAgent)) {
      deviceType = 'mobile'
    } else if (/iPad|Tablet/.test(userAgent)) {
      deviceType = 'tablet'
    }

    // Detect browser
    let browser = 'Unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    // Detect OS
    let os = 'Unknown'
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return {
      id: deviceId,
      name: `${deviceType} - ${browser}`,
      type: deviceType,
      browser,
      os,
      lastSeen: new Date(),
      isActive: true
    }
  }, [])

  // Initialize device info
  useEffect(() => {
    const device = generateDeviceInfo()
    setDeviceInfo(device)
  }, [generateDeviceInfo])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Conflict resolution logic
  const resolveConflicts = useCallback((
    localData: ProgressSyncData,
    remoteData: ProgressSyncData
  ): ProgressSyncData => {
    const conflicts: ProgressSyncData['syncConflicts'] = []
    let resolvedData = { ...remoteData }

    switch (defaultSyncOptions.conflictResolution) {
      case 'latest_wins':
        if (localData.lastUpdated > remoteData.lastUpdated) {
          resolvedData = { ...localData }
        }
        break

      case 'most_progress':
        // Use the data with higher completion percentage
        if (localData.completionPercentage > remoteData.completionPercentage) {
          resolvedData = { ...localData }
          conflicts.push({
            field: 'completionPercentage',
            localValue: localData.completionPercentage,
            remoteValue: remoteData.completionPercentage,
            resolution: 'local',
            timestamp: new Date()
          })
        }
        
        // Merge specific progress data
        if (contentType === 'video' && localData.videoProgress && remoteData.videoProgress) {
          // Use the furthest video position
          if (localData.videoProgress.currentTime > remoteData.videoProgress.currentTime) {
            resolvedData.videoProgress = {
              ...resolvedData.videoProgress!,
              currentTime: localData.videoProgress.currentTime
            }
          }
          
          // Merge bookmarks and notes
          const allBookmarks = [
            ...(localData.videoProgress.bookmarks || []),
            ...(remoteData.videoProgress.bookmarks || [])
          ]
          const uniqueBookmarks = allBookmarks.filter((bookmark, index, self) =>
            index === self.findIndex(b => b.id === bookmark.id)
          )
          
          const allNotes = [
            ...(localData.videoProgress.notes || []),
            ...(remoteData.videoProgress.notes || [])
          ]
          const uniqueNotes = allNotes.filter((note, index, self) =>
            index === self.findIndex(n => n.id === note.id)
          )
          
          resolvedData.videoProgress = {
            ...resolvedData.videoProgress!,
            bookmarks: uniqueBookmarks,
            notes: uniqueNotes
          }
        }
        
        if (contentType === 'text' && localData.readingProgress && remoteData.readingProgress) {
          // Use the furthest reading position
          if (localData.readingProgress.scrollPercentage > remoteData.readingProgress.scrollPercentage) {
            resolvedData.readingProgress = {
              ...resolvedData.readingProgress!,
              scrollPercentage: localData.readingProgress.scrollPercentage
            }
          }
          
          // Merge highlights and notes
          const allHighlights = [
            ...(localData.readingProgress.highlights || []),
            ...(remoteData.readingProgress.highlights || [])
          ]
          const uniqueHighlights = allHighlights.filter((highlight, index, self) =>
            index === self.findIndex(h => h.id === highlight.id)
          )
          
          resolvedData.readingProgress = {
            ...resolvedData.readingProgress!,
            highlights: uniqueHighlights
          }
        }
        
        if (contentType === 'quiz' && localData.quizProgress && remoteData.quizProgress) {
          // Use the quiz with better score or more progress
          if (localData.quizProgress.score && remoteData.quizProgress.score) {
            if (localData.quizProgress.score > remoteData.quizProgress.score) {
              resolvedData.quizProgress = localData.quizProgress
            }
          } else if (localData.quizProgress.currentQuestionIndex > remoteData.quizProgress.currentQuestionIndex) {
            resolvedData.quizProgress = localData.quizProgress
          }
        }
        break

      case 'merge_data':
        // Always merge data when possible
        resolvedData = {
          ...localData,
          // Use the most recent sync version
          syncVersion: Math.max(localData.syncVersion, remoteData.syncVersion) + 1,
          // Use latest timestamp
          lastUpdated: localData.lastUpdated > remoteData.lastUpdated ? localData.lastUpdated : remoteData.lastUpdated,
          // Use highest completion percentage
          completionPercentage: Math.max(localData.completionPercentage, remoteData.completionPercentage),
          // Sum time spent
          timeSpent: localData.timeSpent + remoteData.timeSpent
        }
        break

      case 'user_choice':
        // Don't auto-resolve, let user choose
        if (onConflictDetected) {
          onConflictDetected(conflicts)
        }
        break
    }

    if (conflicts.length > 0) {
      resolvedData.syncConflicts = conflicts
      setSyncStatus(prev => ({ ...prev, conflictCount: conflicts.length }))
    }

    return resolvedData
  }, [defaultSyncOptions.conflictResolution, contentType, onConflictDetected])

  // Sync progress data to server
  const syncToServer = useCallback(async (data: Partial<ProgressSyncData>) => {
    if (!user || !deviceInfo || !syncStatus.isOnline) {
      // Store for offline sync
      pendingUpdatesRef.current.push(data)
      setSyncStatus(prev => ({ ...prev, pendingSyncCount: prev.pendingSyncCount + 1 }))
      return
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }))

      const functions = getFunctions()
      const updateProgressSync = httpsCallable(functions, 'updateProgressSync')

      const payload = {
        ...data,
        userId: user.id,
        lessonId,
        courseId,
        contentType,
        deviceId: deviceInfo.id,
        deviceInfo,
        lastUpdated: new Date(),
        syncVersion: lastSyncVersionRef.current + 1
      }

      await updateProgressSync(payload)
      
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingSyncCount: Math.max(0, prev.pendingSyncCount - 1)
      }))
      
      lastSyncVersionRef.current = payload.syncVersion
      
      if (onSyncComplete) {
        onSyncComplete(payload as ProgressSyncData)
      }
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: (error as Error).message }))
      if (onSyncError) {
        onSyncError(error as Error)
      }
    }
  }, [user, deviceInfo, syncStatus.isOnline, lessonId, courseId, contentType, onSyncComplete, onSyncError])

  // Sync pending offline updates
  const syncPendingUpdates = useCallback(async () => {
    if (pendingUpdatesRef.current.length === 0 || !syncStatus.isOnline) return

    const updates = [...pendingUpdatesRef.current]
    pendingUpdatesRef.current = []

    for (const update of updates) {
      await syncToServer(update)
    }
  }, [syncStatus.isOnline, syncToServer])

  // Set up real-time sync listener
  useEffect(() => {
    if (!user || !defaultSyncOptions.enableRealTimeSync) return

    const db = getFirestore()
    const progressDocRef = doc(db, 'lessonProgress', `${user.id}_${lessonId}`)

    const unsubscribe = onSnapshot(progressDocRef, (doc) => {
      if (doc.exists()) {
        const remoteData = doc.data() as ProgressSyncData
        
        // Check for conflicts
        if (progressData && remoteData.syncVersion !== lastSyncVersionRef.current) {
          const resolvedData = resolveConflicts(progressData, remoteData)
          setProgressData(resolvedData)
          lastSyncVersionRef.current = resolvedData.syncVersion
        } else {
          setProgressData(remoteData)
          lastSyncVersionRef.current = remoteData.syncVersion
        }
      }
    }, (error) => {
      console.error('Real-time sync error:', error)
      if (onSyncError) {
        onSyncError(error as Error)
      }
    })

    unsubscribeRef.current = unsubscribe
    return unsubscribe
  }, [user, lessonId, defaultSyncOptions.enableRealTimeSync, progressData, resolveConflicts, onSyncError])

  // Set up periodic sync
  useEffect(() => {
    if (!defaultSyncOptions.enableRealTimeSync) return

    syncIntervalRef.current = setInterval(() => {
      if (syncStatus.isOnline) {
        syncPendingUpdates()
      }
    }, defaultSyncOptions.syncInterval)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [defaultSyncOptions, syncStatus.isOnline, syncPendingUpdates])

  // Cleanup
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [])

  // Public API methods
  const updateProgress = useCallback((update: Partial<ProgressSyncData>) => {
    const newData = {
      ...progressData,
      ...update,
      lastUpdated: new Date()
    } as ProgressSyncData

    setProgressData(newData)
    syncToServer(update)
  }, [progressData, syncToServer])

  const forceSync = useCallback(async () => {
    if (progressData) {
      await syncToServer(progressData)
    }
    await syncPendingUpdates()
  }, [progressData, syncToServer, syncPendingUpdates])

  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote') => {
    if (!progressData?.syncConflicts) return

    const updatedConflicts = progressData.syncConflicts.map(conflict => {
      if (conflict.field === conflictId) {
        return { ...conflict, resolution }
      }
      return conflict
    })

    updateProgress({ syncConflicts: updatedConflicts })
  }, [progressData, updateProgress])

  const getConnectedDevices = useCallback(async () => {
    if (!user) return []

    try {
      const functions = getFunctions()
      const getDevices = httpsCallable(functions, 'getUserDevices')
      const result = await getDevices({ userId: user.id })
      const devices = (result.data as any).devices as DeviceInfo[]
      setConnectedDevices(devices)
      return devices
    } catch (error) {
      console.error('Error fetching connected devices:', error)
      return []
    }
  }, [user])

  return {
    // Data
    progressData,
    syncStatus,
    deviceInfo,
    connectedDevices,
    
    // Methods
    updateProgress,
    forceSync,
    resolveConflict,
    getConnectedDevices,
    
    // Utils
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    hasConflicts: (progressData?.syncConflicts?.length || 0) > 0,
    pendingUpdatesCount: syncStatus.pendingSyncCount
  }
}