"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAdvancedProgressSync } from './useAdvancedProgressSync'
import { useAuthStore } from '@/stores/authStore'

// Resume point types for different content
interface BaseResumePoint {
  contentType: 'video' | 'text' | 'quiz' | 'pdf' | 'audio'
  lessonId: string
  courseId: string
  timestamp: Date
  deviceInfo: {
    id: string
    name: string
    type: string
  }
  completionPercentage: number
  timeSpent: number
  sessionDuration: number
}

interface VideoResumePoint extends BaseResumePoint {
  contentType: 'video'
  currentTime: number // seconds
  duration: number
  playbackRate: number
  volume: number
  qualityLevel: string
  subtitleTrack?: string
  lastWatchSession: {
    startTime: number
    endTime: number
    pauseCount: number
    seekCount: number
    averagePlaybackRate: number
  }
  chapters?: Array<{
    id: string
    completed: boolean
    timeSpent: number
  }>
}

interface TextResumePoint extends BaseResumePoint {
  contentType: 'text'
  scrollPercentage: number
  readingPosition: {
    paragraph: number
    character: number
  }
  estimatedWordsRead: number
  readingSpeed: number // words per minute
  readingSessions: Array<{
    startTime: Date
    endTime: Date
    wordsRead: number
    scrollStart: number
    scrollEnd: number
  }>
  comprehensionMarkers: Array<{
    position: number
    timeSpent: number
    interactionType: 'highlight' | 'note' | 'pause'
  }>
}

interface QuizResumePoint extends BaseResumePoint {
  contentType: 'quiz'
  currentQuestionIndex: number
  totalQuestions: number
  answers: Record<string, any>
  partialAnswers: Record<string, any>
  attempts: number
  timeSpentPerQuestion: Record<string, number>
  score?: number
  hintsUsed: string[]
  questionStates: Record<string, 'not_started' | 'in_progress' | 'completed' | 'skipped'>
}

interface AudioResumePoint extends BaseResumePoint {
  contentType: 'audio'
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  transcript?: {
    currentPosition: number
    highlightedSections: Array<{
      start: number
      end: number
      text: string
    }>
  }
}

interface PDFResumePoint extends BaseResumePoint {
  contentType: 'pdf'
  currentPage: number
  totalPages: number
  scrollPosition: number
  zoomLevel: number
  annotations: Array<{
    page: number
    x: number
    y: number
    content: string
    type: 'highlight' | 'note' | 'bookmark'
  }>
  readingProgress: Array<{
    page: number
    timeSpent: number
    completed: boolean
  }>
}

type ResumePoint = VideoResumePoint | TextResumePoint | QuizResumePoint | AudioResumePoint | PDFResumePoint

// Resume preferences
interface ResumePreferences {
  autoResume: boolean
  resumeThreshold: number // minimum seconds/percentage before offering resume
  showResumeNotification: boolean
  notificationDuration: number // seconds
  crossDeviceResume: boolean
  preciseTiming: boolean // for video/audio, resume to exact second vs rounded
  contextualResume: boolean // provide context about where user left off
  smartResume: boolean // use AI to suggest optimal resume points
}

// Resume context for different content types
interface ResumeContext {
  contentType: string
  title: string
  description?: string
  estimatedTimeRemaining: number
  lastAccessTime: Date
  progressSummary: string
  suggestions?: Array<{
    type: 'continue' | 'restart' | 'skip_to'
    label: string
    description: string
    action: () => void
  }>
}

interface UseAdvancedResumeOptions {
  lessonId: string
  courseId: string
  contentType: 'video' | 'text' | 'quiz' | 'pdf' | 'audio'
  title: string
  preferences?: Partial<ResumePreferences>
  onResumeSelected?: (resumePoint: ResumePoint) => void
  onResumeDeclined?: () => void
  onResumeCompleted?: () => void
}

export const useAdvancedResume = ({
  lessonId,
  courseId,
  contentType,
  title,
  preferences = {},
  onResumeSelected,
  onResumeDeclined,
  onResumeCompleted
}: UseAdvancedResumeOptions) => {
  const { user } = useAuthStore()
  const [resumePoint, setResumePoint] = useState<ResumePoint | null>(null)
  const [resumeContext, setResumeContext] = useState<ResumeContext | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [resumeHistory, setResumeHistory] = useState<ResumePoint[]>([])
  
  // Session tracking
  const sessionStartRef = useRef<Date>(new Date())
  const lastInteractionRef = useRef<Date>(new Date())
  const interactionCountRef = useRef<number>(0)

  // Progress sync integration
  const {
    progressData,
    updateProgress,
    getConnectedDevices,
    syncStatus
  } = useAdvancedProgressSync({
    lessonId,
    courseId,
    contentType
  })

  // Default preferences
  const defaultPreferences: ResumePreferences = {
    autoResume: false,
    resumeThreshold: 30, // 30 seconds or 30% for other content
    showResumeNotification: true,
    notificationDuration: 10,
    crossDeviceResume: true,
    preciseTiming: true,
    contextualResume: true,
    smartResume: true,
    ...preferences
  }

  // Load resume data on mount
  useEffect(() => {
    loadResumeData()
  }, [lessonId, courseId, contentType])

  // Monitor progress data changes
  useEffect(() => {
    if (progressData) {
      generateResumePoint(progressData)
    }
  }, [progressData])

  const loadResumeData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    
    try {
      // Load current progress
      if (progressData) {
        const point = generateResumePoint(progressData)
        if (point && shouldOfferResume(point)) {
          setResumePoint(point)
          setResumeContext(generateResumeContext(point))
          
          if (defaultPreferences.showResumeNotification) {
            setShowResumePrompt(true)
          }
        }
      }
      
      // Load resume history
      const history = localStorage.getItem(`resumeHistory_${lessonId}`)
      if (history) {
        setResumeHistory(JSON.parse(history))
      }
    } catch (error) {
      console.error('Error loading resume data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, progressData, lessonId, defaultPreferences.showResumeNotification])

  const generateResumePoint = useCallback((data: any): ResumePoint | null => {
    if (!data || data.completionPercentage === 0) return null

    const now = new Date()
    const basePoint = {
      lessonId,
      courseId,
      timestamp: new Date(data.lastUpdated || now),
      deviceInfo: data.deviceInfo || { id: 'unknown', name: 'Unknown Device', type: 'unknown' },
      completionPercentage: data.completionPercentage,
      timeSpent: data.timeSpent,
      sessionDuration: now.getTime() - sessionStartRef.current.getTime()
    }

    switch (contentType) {
      case 'video':
        if (data.videoProgress) {
          return {
            ...basePoint,
            contentType: 'video',
            currentTime: data.videoProgress.currentTime,
            duration: data.videoProgress.duration,
            playbackRate: data.videoProgress.playbackRate,
            volume: data.videoProgress.volume,
            qualityLevel: data.videoProgress.qualityLevel,
            subtitleTrack: data.videoProgress.subtitleTrack,
            lastWatchSession: {
              startTime: data.videoProgress.currentTime - data.timeSpent,
              endTime: data.videoProgress.currentTime,
              pauseCount: 0, // TODO: track from analytics
              seekCount: 0, // TODO: track from analytics
              averagePlaybackRate: data.videoProgress.playbackRate
            },
            chapters: data.videoProgress.chapters
          } as VideoResumePoint
        }
        break

      case 'text':
        if (data.readingProgress) {
          return {
            ...basePoint,
            contentType: 'text',
            scrollPercentage: data.readingProgress.scrollPercentage,
            readingPosition: {
              paragraph: Math.floor(data.readingProgress.scrollPercentage / 10), // Rough estimate
              character: 0
            },
            estimatedWordsRead: data.readingProgress.wordsRead || 0,
            readingSpeed: data.readingProgress.wordsRead / (data.timeSpent / 60) || 200, // words per minute
            readingSessions: [], // TODO: implement session tracking
            comprehensionMarkers: []
          } as TextResumePoint
        }
        break

      case 'quiz':
        if (data.quizProgress) {
          return {
            ...basePoint,
            contentType: 'quiz',
            currentQuestionIndex: data.quizProgress.currentQuestionIndex,
            totalQuestions: Object.keys(data.quizProgress.answers || {}).length + data.quizProgress.currentQuestionIndex,
            answers: data.quizProgress.answers || {},
            partialAnswers: {}, // TODO: implement partial answer tracking
            attempts: data.quizProgress.attempts,
            timeSpentPerQuestion: {}, // TODO: implement per-question timing
            score: data.quizProgress.score,
            hintsUsed: data.quizProgress.hintsUsed || [],
            questionStates: {} // TODO: implement question state tracking
          } as QuizResumePoint
        }
        break

      case 'audio':
        return {
          ...basePoint,
          contentType: 'audio',
          currentTime: data.lastPosition,
          duration: 0, // TODO: get from audio metadata
          playbackRate: 1.0,
          volume: 1.0
        } as AudioResumePoint

      case 'pdf':
        return {
          ...basePoint,
          contentType: 'pdf',
          currentPage: Math.floor(data.lastPosition),
          totalPages: 0, // TODO: get from PDF metadata
          scrollPosition: data.lastPosition % 1, // Decimal part as scroll within page
          zoomLevel: 1.0,
          annotations: [],
          readingProgress: []
        } as PDFResumePoint
    }

    return null
  }, [lessonId, courseId, contentType])

  const shouldOfferResume = useCallback((point: ResumePoint): boolean => {
    // Don't offer resume if already completed
    if (point.completionPercentage >= 95) return false

    // Check minimum threshold
    if (contentType === 'video' || contentType === 'audio') {
      const timePoint = point as VideoResumePoint | AudioResumePoint
      return timePoint.currentTime >= defaultPreferences.resumeThreshold
    } else if (contentType === 'text') {
      const textPoint = point as TextResumePoint
      return textPoint.scrollPercentage >= defaultPreferences.resumeThreshold
    } else if (contentType === 'quiz') {
      const quizPoint = point as QuizResumePoint
      return quizPoint.currentQuestionIndex > 0
    }

    return point.completionPercentage >= defaultPreferences.resumeThreshold
  }, [contentType, defaultPreferences.resumeThreshold])

  const generateResumeContext = useCallback((point: ResumePoint): ResumeContext => {
    let estimatedTimeRemaining = 0
    let progressSummary = ''
    let suggestions: ResumeContext['suggestions'] = []

    switch (point.contentType) {
      case 'video':
        const videoPoint = point as VideoResumePoint
        estimatedTimeRemaining = (videoPoint.duration - videoPoint.currentTime) / videoPoint.playbackRate
        progressSummary = `${Math.floor(videoPoint.currentTime / 60)}:${(videoPoint.currentTime % 60).toFixed(0).padStart(2, '0')} / ${Math.floor(videoPoint.duration / 60)}:${(videoPoint.duration % 60).toFixed(0).padStart(2, '0')}`
        
        suggestions = [
          {
            type: 'continue',
            label: 'Folytatás',
            description: `Folytatás ${Math.floor(videoPoint.currentTime / 60)}:${(videoPoint.currentTime % 60).toFixed(0).padStart(2, '0')}-nál`,
            action: () => handleResumeAction(point)
          },
          {
            type: 'restart',
            label: 'Újrakezdés',
            description: 'Videó újrakezdése az elejétől',
            action: () => handleRestartAction()
          }
        ]
        break

      case 'text':
        const textPoint = point as TextResumePoint
        estimatedTimeRemaining = (100 - textPoint.scrollPercentage) / textPoint.readingSpeed * 60
        progressSummary = `${Math.round(textPoint.scrollPercentage)}% elolvasva`
        
        suggestions = [
          {
            type: 'continue',
            label: 'Folytatás olvasása',
            description: `Folytatás ${Math.round(textPoint.scrollPercentage)}%-nál`,
            action: () => handleResumeAction(point)
          },
          {
            type: 'restart',
            label: 'Újrakezdés',
            description: 'Szöveg újraolvasása az elejétől',
            action: () => handleRestartAction()
          }
        ]
        break

      case 'quiz':
        const quizPoint = point as QuizResumePoint
        estimatedTimeRemaining = (quizPoint.totalQuestions - quizPoint.currentQuestionIndex) * 2 * 60 // 2 min per question estimate
        progressSummary = `${quizPoint.currentQuestionIndex} / ${quizPoint.totalQuestions} kérdés`
        
        suggestions = [
          {
            type: 'continue',
            label: 'Kvíz folytatása',
            description: `Folytatás ${quizPoint.currentQuestionIndex + 1}. kérdésnél`,
            action: () => handleResumeAction(point)
          },
          {
            type: 'restart',
            label: 'Kvíz újrakezdése',
            description: 'Kvíz újrakezdése az elejétől',
            action: () => handleRestartAction()
          }
        ]
        break

      case 'audio':
        const audioPoint = point as AudioResumePoint
        estimatedTimeRemaining = (audioPoint.duration - audioPoint.currentTime) / audioPoint.playbackRate
        progressSummary = `${Math.floor(audioPoint.currentTime / 60)}:${(audioPoint.currentTime % 60).toFixed(0).padStart(2, '0')} / ${Math.floor(audioPoint.duration / 60)}:${(audioPoint.duration % 60).toFixed(0).padStart(2, '0')}`
        break

      case 'pdf':
        const pdfPoint = point as PDFResumePoint
        estimatedTimeRemaining = (pdfPoint.totalPages - pdfPoint.currentPage) * 3 * 60 // 3 min per page estimate
        progressSummary = `${pdfPoint.currentPage} / ${pdfPoint.totalPages} oldal`
        break
    }

    return {
      contentType: point.contentType,
      title,
      estimatedTimeRemaining,
      lastAccessTime: point.timestamp,
      progressSummary,
      suggestions
    }
  }, [title])

  const handleResumeAction = useCallback((point: ResumePoint) => {
    // Add to resume history
    const newHistory = [point, ...resumeHistory.slice(0, 9)] // Keep last 10
    setResumeHistory(newHistory)
    localStorage.setItem(`resumeHistory_${lessonId}`, JSON.stringify(newHistory))

    // Hide prompt
    setShowResumePrompt(false)

    // Track interaction
    interactionCountRef.current++
    lastInteractionRef.current = new Date()

    // Notify parent component
    if (onResumeSelected) {
      onResumeSelected(point)
    }
  }, [resumeHistory, lessonId, onResumeSelected])

  const handleRestartAction = useCallback(() => {
    setShowResumePrompt(false)
    
    // Reset progress
    updateProgress({
      completionPercentage: 0,
      timeSpent: 0,
      lastPosition: 0,
      isCompleted: false
    })

    if (onResumeDeclined) {
      onResumeDeclined()
    }
  }, [updateProgress, onResumeDeclined])

  const dismissResumePrompt = useCallback(() => {
    setShowResumePrompt(false)
    
    if (onResumeDeclined) {
      onResumeDeclined()
    }
  }, [onResumeDeclined])

  const saveCurrentProgress = useCallback((progressUpdate: Partial<any>) => {
    updateProgress(progressUpdate)
    lastInteractionRef.current = new Date()
  }, [updateProgress])

  const getResumeRecommendation = useCallback((): 'continue' | 'restart' | 'skip' => {
    if (!resumePoint) return 'restart'

    // Smart recommendations based on progress and time elapsed
    const timeSinceLastAccess = new Date().getTime() - resumePoint.timestamp.getTime()
    const daysSinceLastAccess = timeSinceLastAccess / (1000 * 60 * 60 * 24)

    // If it's been more than a week, suggest restart
    if (daysSinceLastAccess > 7) return 'restart'

    // If very little progress, suggest restart
    if (resumePoint.completionPercentage < 10) return 'restart'

    // If almost complete, suggest continue
    if (resumePoint.completionPercentage > 80) return 'continue'

    // For quizzes, if in the middle, always continue
    if (resumePoint.contentType === 'quiz' && resumePoint.completionPercentage > 0) {
      return 'continue'
    }

    // Default to continue
    return 'continue'
  }, [resumePoint])

  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)} másodperc`
    if (seconds < 3600) return `${Math.round(seconds / 60)} perc`
    return `${Math.round(seconds / 3600)} óra`
  }, [])

  return {
    // State
    resumePoint,
    resumeContext,
    showResumePrompt,
    isLoading,
    resumeHistory,
    
    // Progress tracking
    currentProgress: progressData,
    syncStatus,
    
    // Actions
    handleResumeAction,
    handleRestartAction,
    dismissResumePrompt,
    saveCurrentProgress,
    
    // Utilities
    recommendation: getResumeRecommendation(),
    timeRemaining: resumeContext ? formatTimeRemaining(resumeContext.estimatedTimeRemaining) : '',
    canResume: !!resumePoint && shouldOfferResume(resumePoint),
    
    // Settings
    preferences: defaultPreferences
  }
}