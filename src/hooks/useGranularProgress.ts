"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAdvancedProgressSync } from './useAdvancedProgressSync'

// Granular metrics for different content types
interface VideoMetrics {
  totalWatchTime: number
  uniqueWatchTime: number // time actually watching (not paused/background)
  pauseCount: number
  pauseDuration: number
  seekCount: number
  seekDistance: number // total seconds skipped forward/backward
  rewindCount: number
  speedChanges: number
  averagePlaybackRate: number
  qualityChanges: number
  fullscreenTime: number
  pipTime: number // picture-in-picture time
  interactionCount: number
  engagementScore: number // 0-100 based on interaction patterns
  
  // Advanced metrics
  attentionSpans: Array<{
    startTime: number
    endTime: number
    focusLevel: 'high' | 'medium' | 'low'
    interactions: number
  }>
  heatmap: Array<{
    startTime: number
    endTime: number
    viewCount: number
    pauseCount: number
    seekCount: number
  }>
  chapters: Record<string, {
    id: string
    watchTime: number
    completionPercentage: number
    averagePlaybackRate: number
    pauseCount: number
    attentionScore: number
  }>
  bookmarks: Array<{
    id: string
    timestamp: number
    title: string
    note?: string
    createdAt: Date
    accessCount: number
  }>
  notes: Array<{
    id: string
    timestamp: number
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
  }>
}

interface ReadingMetrics {
  totalReadingTime: number
  activeReadingTime: number // time actually scrolling/interacting
  scrollDistance: number // total pixels scrolled
  scrollSpeed: Array<{
    startTime: number
    endTime: number
    speed: number // pixels per second
  }>
  pausePoints: Array<{
    position: number
    duration: number
    timestamp: Date
  }>
  backtrackCount: number // times user scrolled up significantly
  wordsPerMinute: number
  comprehensionMarkers: Array<{
    position: number
    type: 'highlight' | 'note' | 'bookmark' | 'long_pause'
    duration?: number
    content?: string
  }>
  
  // Advanced reading analytics
  readingPattern: 'linear' | 'scanning' | 'detailed' | 'jumping'
  focusAreas: Array<{
    startPosition: number
    endPosition: number
    timeSpent: number
    interactionCount: number
    importanceScore: number
  }>
  vocabularyEncountered: string[]
  difficultyRating: number // 1-10 based on pause patterns and backtracking
  sections: Record<string, {
    id: string
    startPosition: number
    endPosition: number
    timeSpent: number
    completionPercentage: number
    averageReadingSpeed: number
    highlightCount: number
    noteCount: number
  }>
  highlights: Array<{
    id: string
    text: string
    position: number
    color: string
    createdAt: Date
    category?: string
  }>
  notes: Array<{
    id: string
    position: number
    content: string
    createdAt: Date
    private: boolean
  }>
}

interface QuizMetrics {
  totalAttempts: number
  questionsAttempted: number
  questionsCorrect: number
  questionsSkipped: number
  totalTimeSpent: number
  averageTimePerQuestion: number
  
  // Per question metrics
  questionMetrics: Record<string, {
    id: string
    attempts: number
    timeSpent: number
    hintsUsed: number
    finalAnswer?: any
    isCorrect?: boolean
    confidenceLevel?: number
    difficultyRating?: number
    mistakePatterns: Array<{
      incorrectAnswer: any
      timestamp: Date
      timeSpent: number
    }>
  }>
  
  // Learning patterns
  learningVelocity: number // questions per minute
  accuracyTrend: Array<{
    questionIndex: number
    accuracy: number
    timestamp: Date
  }>
  difficultyProgression: Array<{
    questionId: string
    difficulty: number
    performance: number
    adaptationSuggestion?: string
  }>
  
  // Knowledge assessment
  knowledgeAreas: Record<string, {
    topic: string
    questionsCount: number
    correctAnswers: number
    averageTime: number
    confidenceLevel: number
    masteryLevel: 'novice' | 'intermediate' | 'proficient' | 'expert'
  }>
  
  // Engagement metrics
  engagementScore: number
  persistenceScore: number // based on retry behavior
  explorationScore: number // based on hint usage and question analysis
}

interface AudioMetrics {
  totalListenTime: number
  activeListenTime: number
  pauseCount: number
  pauseDuration: number
  rewindCount: number
  fastForwardCount: number
  speedChanges: number
  averagePlaybackRate: number
  volumeChanges: number
  
  // Advanced audio metrics
  listeningPattern: 'continuous' | 'segmented' | 'selective'
  comprehensionMarkers: Array<{
    timestamp: number
    type: 'pause' | 'rewind' | 'speed_change'
    duration: number
    context?: string
  }>
  transcriptInteractions: Array<{
    timestamp: number
    action: 'highlight' | 'note' | 'bookmark'
    content: string
  }>
}

interface PDFMetrics {
  totalReadingTime: number
  pagesVisited: number[]
  pageTimeSpent: Record<number, number>
  zoomChanges: number
  averageZoomLevel: number
  annotationsCreated: number
  
  // Navigation patterns
  navigationPattern: 'sequential' | 'random' | 'targeted'
  jumpCount: number // non-sequential page changes
  backtrackCount: number
  
  // Reading behavior
  pageEngagement: Record<number, {
    page: number
    timeSpent: number
    scrollDistance: number
    zoomLevel: number
    annotationCount: number
    engagementScore: number
  }>
  
  annotations: Array<{
    id: string
    page: number
    x: number
    y: number
    type: 'highlight' | 'note' | 'bookmark' | 'drawing'
    content: string
    createdAt: Date
  }>
}

// Completion criteria system
interface CompletionCriteria {
  type: 'basic' | 'advanced' | 'mastery' | 'custom'
  
  // Basic criteria (OR conditions)
  minimumTimeSpent?: number // seconds
  minimumCompletionPercentage?: number // 0-100
  
  // Advanced criteria (AND conditions)
  advanced?: {
    minimumEngagementScore?: number
    minimumInteractionCount?: number
    requiredSections?: string[]
    masteryThreshold?: number
  }
  
  // Content-specific criteria
  video?: {
    minimumWatchPercentage: number
    maxSkipPercentage?: number
    requiredChapters?: string[]
    minimumEngagementScore?: number
    requireFullscreen?: boolean
    minimumPlaybackRate?: number
    maximumPlaybackRate?: number
  }
  
  text?: {
    minimumReadingPercentage: number
    minimumReadingTime?: number
    requiredSections?: string[]
    minimumWordsPerMinute?: number
    requireComprehensionMarkers?: boolean
    minimumHighlights?: number
    minimumNotes?: number
  }
  
  quiz?: {
    minimumScore: number
    maxAttempts?: number
    requiredQuestions?: string[]
    minimumAccuracy?: number
    timeLimit?: number
    requireAllCorrect?: boolean
    masteryLevel?: 'basic' | 'intermediate' | 'advanced'
  }
  
  audio?: {
    minimumListenPercentage: number
    maxSkipPercentage?: number
    requireActiveListening?: boolean
    minimumEngagementScore?: number
  }
  
  pdf?: {
    minimumPagesRead: number
    minimumTimePerPage?: number
    requiredPages?: number[]
    minimumAnnotations?: number
    requireSequentialReading?: boolean
  }
}

interface UseGranularProgressOptions {
  lessonId: string
  courseId: string
  contentType: 'video' | 'text' | 'quiz' | 'audio' | 'pdf'
  completionCriteria?: CompletionCriteria
  enableAdvancedTracking?: boolean
  trackingInterval?: number // milliseconds
  onMilestone?: (milestone: string, progress: number) => void
  onCompletion?: (metrics: any) => void
}

export const useGranularProgress = ({
  lessonId,
  courseId,
  contentType,
  completionCriteria,
  enableAdvancedTracking = true,
  trackingInterval = 5000,
  onMilestone,
  onCompletion
}: UseGranularProgressOptions) => {
  const [metrics, setMetrics] = useState<any>(null)
  const [milestones, setMilestones] = useState<string[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [completionScore, setCompletionScore] = useState(0)
  
  // Tracking refs
  const trackingIntervalRef = useRef<NodeJS.Timeout>()
  const sessionStartRef = useRef<Date>(new Date())
  const lastActivityRef = useRef<Date>(new Date())
  const interactionCountRef = useRef<number>(0)
  const focusTimeRef = useRef<number>(0)
  
  // Progress sync integration
  const { progressData, updateProgress } = useAdvancedProgressSync({
    lessonId,
    courseId,
    contentType
  })

  // Initialize metrics based on content type
  useEffect(() => {
    initializeMetrics()
  }, [contentType])

  // Start tracking
  useEffect(() => {
    if (enableAdvancedTracking) {
      startTracking()
    }
    
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }
  }, [enableAdvancedTracking, trackingInterval])

  const initializeMetrics = useCallback(() => {
    const now = new Date()
    
    switch (contentType) {
      case 'video':
        setMetrics({
          totalWatchTime: 0,
          uniqueWatchTime: 0,
          pauseCount: 0,
          pauseDuration: 0,
          seekCount: 0,
          seekDistance: 0,
          rewindCount: 0,
          speedChanges: 0,
          averagePlaybackRate: 1.0,
          qualityChanges: 0,
          fullscreenTime: 0,
          pipTime: 0,
          interactionCount: 0,
          engagementScore: 0,
          attentionSpans: [],
          heatmap: [],
          chapters: {},
          bookmarks: [],
          notes: []
        } as VideoMetrics)
        break
        
      case 'text':
        setMetrics({
          totalReadingTime: 0,
          activeReadingTime: 0,
          scrollDistance: 0,
          scrollSpeed: [],
          pausePoints: [],
          backtrackCount: 0,
          wordsPerMinute: 0,
          comprehensionMarkers: [],
          readingPattern: 'linear',
          focusAreas: [],
          vocabularyEncountered: [],
          difficultyRating: 1,
          sections: {},
          highlights: [],
          notes: []
        } as ReadingMetrics)
        break
        
      case 'quiz':
        setMetrics({
          totalAttempts: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          questionsSkipped: 0,
          totalTimeSpent: 0,
          averageTimePerQuestion: 0,
          questionMetrics: {},
          learningVelocity: 0,
          accuracyTrend: [],
          difficultyProgression: [],
          knowledgeAreas: {},
          engagementScore: 0,
          persistenceScore: 0,
          explorationScore: 0
        } as QuizMetrics)
        break
        
      case 'audio':
        setMetrics({
          totalListenTime: 0,
          activeListenTime: 0,
          pauseCount: 0,
          pauseDuration: 0,
          rewindCount: 0,
          fastForwardCount: 0,
          speedChanges: 0,
          averagePlaybackRate: 1.0,
          volumeChanges: 0,
          listeningPattern: 'continuous',
          comprehensionMarkers: [],
          transcriptInteractions: []
        } as AudioMetrics)
        break
        
      case 'pdf':
        setMetrics({
          totalReadingTime: 0,
          pagesVisited: [],
          pageTimeSpent: {},
          zoomChanges: 0,
          averageZoomLevel: 1.0,
          annotationsCreated: 0,
          navigationPattern: 'sequential',
          jumpCount: 0,
          backtrackCount: 0,
          pageEngagement: {},
          annotations: []
        } as PDFMetrics)
        break
    }
  }, [contentType])

  const startTracking = useCallback(() => {
    trackingIntervalRef.current = setInterval(() => {
      updateMetrics()
      checkMilestones()
      checkCompletion()
    }, trackingInterval)
  }, [trackingInterval])

  const updateMetrics = useCallback(() => {
    const now = new Date()
    const sessionTime = now.getTime() - sessionStartRef.current.getTime()
    const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime()
    
    // Update focus time (only if user was active in last 30 seconds)
    if (timeSinceLastActivity < 30000) {
      focusTimeRef.current += trackingInterval
    }
    
    setMetrics((prev: any) => {
      if (!prev) return prev
      
      const updated = { ...prev }
      
      // Update common metrics
      if (contentType === 'video') {
        updated.totalWatchTime = sessionTime / 1000
        updated.uniqueWatchTime = focusTimeRef.current / 1000
        updated.interactionCount = interactionCountRef.current
        updated.engagementScore = calculateEngagementScore(updated)
      } else if (contentType === 'text') {
        updated.totalReadingTime = sessionTime / 1000
        updated.activeReadingTime = focusTimeRef.current / 1000
        updated.wordsPerMinute = calculateReadingSpeed(updated)
      } else if (contentType === 'quiz') {
        updated.totalTimeSpent = sessionTime / 1000
        updated.engagementScore = calculateQuizEngagement(updated)
      } else if (contentType === 'audio') {
        updated.totalListenTime = sessionTime / 1000
        updated.activeListenTime = focusTimeRef.current / 1000
      } else if (contentType === 'pdf') {
        updated.totalReadingTime = sessionTime / 1000
      }
      
      return updated
    })
    
    // Sync to server
    updateProgress({
      timeSpent: sessionTime / 1000,
      lastUpdated: now
    })
  }, [contentType, trackingInterval, updateProgress])

  const calculateEngagementScore = useCallback((videoMetrics: VideoMetrics): number => {
    if (!videoMetrics) return 0
    
    let score = 0
    
    // Base score from watch time ratio
    const watchRatio = videoMetrics.uniqueWatchTime / Math.max(videoMetrics.totalWatchTime, 1)
    score += watchRatio * 40
    
    // Interaction score
    const interactionScore = Math.min(videoMetrics.interactionCount / 10, 1) * 20
    score += interactionScore
    
    // Engagement patterns
    if (videoMetrics.pauseCount > 0 && videoMetrics.pauseCount < 20) {
      score += 10 // Some pauses indicate engagement
    }
    
    if (videoMetrics.seekCount > 0 && videoMetrics.seekCount < 10) {
      score += 10 // Some seeking indicates engagement
    }
    
    // Bookmarks and notes
    score += Math.min(videoMetrics.bookmarks.length * 5, 15)
    score += Math.min(videoMetrics.notes.length * 3, 15)
    
    return Math.min(Math.round(score), 100)
  }, [])

  const calculateReadingSpeed = useCallback((readingMetrics: ReadingMetrics): number => {
    if (!readingMetrics.activeReadingTime) return 0
    
    // Estimate words read based on scroll patterns and time
    const estimatedWords = readingMetrics.scrollDistance * 0.05 // rough estimate
    return estimatedWords / (readingMetrics.activeReadingTime / 60)
  }, [])

  const calculateQuizEngagement = useCallback((quizMetrics: QuizMetrics): number => {
    if (!quizMetrics) return 0
    
    let score = 0
    
    // Accuracy score
    if (quizMetrics.questionsAttempted > 0) {
      score += (quizMetrics.questionsCorrect / quizMetrics.questionsAttempted) * 50
    }
    
    // Time management score
    if (quizMetrics.averageTimePerQuestion > 0 && quizMetrics.averageTimePerQuestion < 300) {
      score += 25 // Good time management
    }
    
    // Persistence score
    const retryRate = quizMetrics.totalAttempts / Math.max(quizMetrics.questionsAttempted, 1)
    if (retryRate > 1 && retryRate < 3) {
      score += 15 // Good persistence
    }
    
    // Exploration score (hint usage)
    score += Math.min(Object.values(quizMetrics.questionMetrics).reduce((sum, q) => sum + q.hintsUsed, 0) * 2, 10)
    
    return Math.min(Math.round(score), 100)
  }, [])

  const checkMilestones = useCallback(() => {
    if (!metrics) return
    
    const newMilestones: string[] = []
    
    // Common milestones
    const completionPercentage = progressData?.completionPercentage || 0
    
    if (completionPercentage >= 25 && !milestones.includes('25_percent')) {
      newMilestones.push('25_percent')
    }
    if (completionPercentage >= 50 && !milestones.includes('50_percent')) {
      newMilestones.push('50_percent')
    }
    if (completionPercentage >= 75 && !milestones.includes('75_percent')) {
      newMilestones.push('75_percent')
    }
    
    // Content-specific milestones
    if (contentType === 'video') {
      const videoMetrics = metrics as VideoMetrics
      if (videoMetrics.bookmarks.length >= 3 && !milestones.includes('bookmark_creator')) {
        newMilestones.push('bookmark_creator')
      }
      if (videoMetrics.notes.length >= 5 && !milestones.includes('note_taker')) {
        newMilestones.push('note_taker')
      }
      if (videoMetrics.engagementScore >= 80 && !milestones.includes('highly_engaged')) {
        newMilestones.push('highly_engaged')
      }
    } else if (contentType === 'text') {
      const readingMetrics = metrics as ReadingMetrics
      if (readingMetrics.highlights.length >= 10 && !milestones.includes('highlighter')) {
        newMilestones.push('highlighter')
      }
      if (readingMetrics.wordsPerMinute >= 250 && !milestones.includes('speed_reader')) {
        newMilestones.push('speed_reader')
      }
    } else if (contentType === 'quiz') {
      const quizMetrics = metrics as QuizMetrics
      if (quizMetrics.questionsCorrect >= 10 && !milestones.includes('quiz_master')) {
        newMilestones.push('quiz_master')
      }
      if (quizMetrics.engagementScore >= 90 && !milestones.includes('perfectionist')) {
        newMilestones.push('perfectionist')
      }
    }
    
    // Notify about new milestones
    newMilestones.forEach(milestone => {
      if (onMilestone) {
        onMilestone(milestone, completionPercentage)
      }
    })
    
    if (newMilestones.length > 0) {
      setMilestones(prev => [...prev, ...newMilestones])
    }
  }, [metrics, milestones, progressData, contentType, onMilestone])

  const checkCompletion = useCallback(() => {
    if (!metrics || !completionCriteria || isCompleted) return
    
    let completed = false
    let score = 0
    
    const completionPercentage = progressData?.completionPercentage || 0
    
    // Check basic criteria
    if (completionCriteria.type === 'basic') {
      completed = (completionCriteria.minimumCompletionPercentage || 0) <= completionPercentage &&
                 (completionCriteria.minimumTimeSpent || 0) <= (metrics.totalWatchTime || metrics.totalReadingTime || metrics.totalTimeSpent || 0)
      score = completed ? 100 : completionPercentage
    }
    
    // Check content-specific criteria
    else if (completionCriteria[contentType]) {
      const criteria = completionCriteria[contentType]!
      
      if (contentType === 'video' && criteria) {
        const videoMetrics = metrics as VideoMetrics
        const videoCriteria = criteria as NonNullable<CompletionCriteria['video']>
        
        completed = completionPercentage >= videoCriteria.minimumWatchPercentage
        
        if (videoCriteria.minimumEngagementScore) {
          completed = completed && videoMetrics.engagementScore >= videoCriteria.minimumEngagementScore
        }
        
        if (videoCriteria.maxSkipPercentage) {
          const skipPercentage = (videoMetrics.seekDistance / videoMetrics.totalWatchTime) * 100
          completed = completed && skipPercentage <= videoCriteria.maxSkipPercentage
        }
        
        score = Math.min(completionPercentage, videoMetrics.engagementScore)
      }
      
      else if (contentType === 'text' && criteria) {
        const readingMetrics = metrics as ReadingMetrics
        const textCriteria = criteria as NonNullable<CompletionCriteria['text']>
        
        completed = completionPercentage >= textCriteria.minimumReadingPercentage
        
        if (textCriteria.minimumReadingTime) {
          completed = completed && readingMetrics.totalReadingTime >= textCriteria.minimumReadingTime
        }
        
        if (textCriteria.minimumHighlights) {
          completed = completed && readingMetrics.highlights.length >= textCriteria.minimumHighlights
        }
        
        if (textCriteria.minimumNotes) {
          completed = completed && readingMetrics.notes.length >= textCriteria.minimumNotes
        }
        
        score = completionPercentage
      }
      
      else if (contentType === 'quiz' && criteria) {
        const quizMetrics = metrics as QuizMetrics
        const quizCriteria = criteria as NonNullable<CompletionCriteria['quiz']>
        
        const accuracy = quizMetrics.questionsAttempted > 0 ? 
          (quizMetrics.questionsCorrect / quizMetrics.questionsAttempted) * 100 : 0
        
        completed = accuracy >= quizCriteria.minimumScore
        
        if (quizCriteria.maxAttempts) {
          completed = completed && quizMetrics.totalAttempts <= quizCriteria.maxAttempts
        }
        
        if (quizCriteria.minimumAccuracy) {
          completed = completed && accuracy >= quizCriteria.minimumAccuracy
        }
        
        score = Math.min(accuracy, quizMetrics.engagementScore)
      }
    }
    
    if (completed && !isCompleted) {
      setIsCompleted(true)
      setCompletionScore(score)
      
      if (onCompletion) {
        onCompletion(metrics)
      }
    }
  }, [metrics, completionCriteria, isCompleted, progressData, contentType, onCompletion])

  // Public methods for tracking specific events
  const trackInteraction = useCallback((type: string, data?: any) => {
    interactionCountRef.current++
    lastActivityRef.current = new Date()
    
    // Content-specific interaction tracking
    setMetrics((prev: any) => {
      if (!prev) return prev
      
      const updated = { ...prev }
      
      switch (type) {
        case 'video_pause':
          updated.pauseCount++
          break
        case 'video_seek':
          updated.seekCount++
          if (data?.distance) updated.seekDistance += Math.abs(data.distance)
          break
        case 'video_speed_change':
          updated.speedChanges++
          if (data?.rate) updated.averagePlaybackRate = (updated.averagePlaybackRate + data.rate) / 2
          break
        case 'text_highlight':
          updated.highlights = [...(updated.highlights || []), data]
          break
        case 'text_note':
          updated.notes = [...(updated.notes || []), data]
          break
        case 'quiz_answer':
          if (data?.questionId) {
            updated.questionMetrics = {
              ...updated.questionMetrics,
              [data.questionId]: {
                ...updated.questionMetrics[data.questionId],
                attempts: (updated.questionMetrics[data.questionId]?.attempts || 0) + 1,
                finalAnswer: data.answer,
                isCorrect: data.isCorrect
              }
            }
          }
          break
      }
      
      return updated
    })
  }, [])

  const getProgressSummary = useCallback(() => {
    if (!metrics) return null
    
    const completionPercentage = progressData?.completionPercentage || 0
    
    return {
      completionPercentage,
      completionScore,
      isCompleted,
      milestones: milestones.length,
      engagementScore: metrics.engagementScore || 0,
      timeSpent: metrics.totalWatchTime || metrics.totalReadingTime || metrics.totalTimeSpent || 0,
      interactionCount: interactionCountRef.current,
      focusTime: focusTimeRef.current / 1000
    }
  }, [metrics, progressData, completionScore, isCompleted, milestones.length])

  return {
    // State
    metrics,
    milestones,
    isCompleted,
    completionScore,
    
    // Tracking
    trackInteraction,
    
    // Analysis
    progressSummary: getProgressSummary(),
    
    // Utils
    canComplete: completionCriteria ? checkCompletion : () => true,
    meetsCriteria: isCompleted
  }
}