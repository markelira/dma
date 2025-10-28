import { useState, useEffect, useCallback } from 'react'
import { useSyncedLessonProgress } from './useLessonProgress'
import { Lesson } from '@/types'

interface ResumePoint {
  type: 'video' | 'text' | 'quiz' | 'audio' | 'pdf'
  position: number
  timestamp: Date
  context?: string
  metadata?: {
    totalDuration?: number
    totalQuestions?: number
    chapterTitle?: string
    sectionTitle?: string
  }
}

interface ResumeManagerOptions {
  lessonId: string
  courseId: string
  lesson: Lesson
  threshold?: number // Minimum progress percentage to show resume prompt
}

export const useResumeManager = ({ 
  lessonId, 
  courseId, 
  lesson, 
  threshold = 5 
}: ResumeManagerOptions) => {
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [resumePoint, setResumePoint] = useState<ResumePoint | null>(null)
  const [shouldAutoResume, setShouldAutoResume] = useState(false)

  const { data: progressData } = useSyncedLessonProgress(lessonId, courseId)

  // Generate resume point from progress data
  const generateResumePoint = useCallback((progress: any): ResumePoint | null => {
    if (!progress || !progress.resumePosition) return null

    const progressPercentage = progress.watchPercentage || 0
    if (progressPercentage < threshold) return null

    // Map lesson type to resume type
    let resumeType: ResumePoint['type']
    switch (lesson.type) {
      case 'VIDEO':
        resumeType = 'video'
        break
      case 'AUDIO':
        resumeType = 'audio'
        break
      case 'TEXT':
      case 'READING':
        resumeType = 'text'
        break
      case 'PDF':
        resumeType = 'pdf'
        break
      case 'QUIZ':
        resumeType = 'quiz'
        break
      default:
        resumeType = 'text'
    }

    // Create resume point based on content type
    const resumePoint: ResumePoint = {
      type: resumeType,
      position: progress.resumePosition,
      timestamp: new Date(progress.updatedAt?.toDate?.() || progress.updatedAt),
      metadata: {}
    }

    // Add type-specific context and metadata
    switch (resumeType) {
      case 'video':
      case 'audio':
        const minutes = Math.floor(resumePoint.position / 60)
        const seconds = resumePoint.position % 60
        resumePoint.context = `${minutes}:${seconds.toString().padStart(2, '0')}`
        resumePoint.metadata = {
          totalDuration: lesson.duration || 0
        }
        break

      case 'text':
      case 'pdf':
        resumePoint.context = `${Math.round(resumePoint.position)}% elolvasva`
        break

      case 'quiz':
        const totalQuestions = lesson.quiz?.questions?.length || 1
        resumePoint.context = `${resumePoint.position}. kérdés`
        resumePoint.metadata = {
          totalQuestions
        }
        break
    }

    return resumePoint
  }, [lesson, threshold])

  // Check if we should show resume prompt
  useEffect(() => {
    if (!progressData?.progress) return

    const progress = progressData.progress
    const generatedResumePoint = generateResumePoint(progress)

    if (generatedResumePoint) {
      setResumePoint(generatedResumePoint)
      
      // Show prompt if not completed and has meaningful progress
      const shouldShow = !progress.completed && 
                        (progress.watchPercentage || 0) >= threshold &&
                        (progress.watchPercentage || 0) < 95 // Don't show if almost complete

      setShowResumePrompt(shouldShow)
    }
  }, [progressData, generateResumePoint, threshold])

  // Resume handlers
  const handleResume = useCallback((fromResumePoint: boolean) => {
    setShouldAutoResume(fromResumePoint)
    setShowResumePrompt(false)
  }, [])

  const handleStartFromBeginning = useCallback(() => {
    setShouldAutoResume(false)
    setShowResumePrompt(false)
  }, [])

  const dismissResumePrompt = useCallback(() => {
    setShowResumePrompt(false)
  }, [])

  // Get resume position for specific content type
  const getResumePosition = useCallback(() => {
    if (!shouldAutoResume || !resumePoint) return 0
    return resumePoint.position
  }, [shouldAutoResume, resumePoint])

  // Check if should resume for specific content type
  const shouldResumeFromPosition = useCallback((contentType: string) => {
    if (!shouldAutoResume || !resumePoint) return false
    
    const typeMap: Record<string, ResumePoint['type']> = {
      'VIDEO': 'video',
      'AUDIO': 'audio',
      'TEXT': 'text',
      'READING': 'text',
      'PDF': 'pdf',
      'QUIZ': 'quiz'
    }

    return resumePoint.type === typeMap[contentType]
  }, [shouldAutoResume, resumePoint])

  // Create resume context for video players
  const getVideoResumeContext = useCallback(() => {
    if (!shouldResumeFromPosition('VIDEO') || !resumePoint) return null

    return {
      startTime: resumePoint.position,
      showResumeNotification: true,
      resumeMessage: `Folytatás: ${resumePoint.context}`
    }
  }, [shouldResumeFromPosition, resumePoint])

  // Create resume context for audio players
  const getAudioResumeContext = useCallback(() => {
    if (!shouldResumeFromPosition('AUDIO') || !resumePoint) return null

    return {
      startTime: resumePoint.position,
      showResumeNotification: true,
      resumeMessage: `Folytatás: ${resumePoint.context}`
    }
  }, [shouldResumeFromPosition, resumePoint])

  // Create resume context for text/PDF readers
  const getReadingResumeContext = useCallback(() => {
    if (!resumePoint || (!shouldResumeFromPosition('TEXT') && !shouldResumeFromPosition('PDF'))) {
      return null
    }

    return {
      scrollPercentage: resumePoint.position,
      showResumeNotification: true,
      resumeMessage: `Folytatás: ${resumePoint.context}`
    }
  }, [shouldResumeFromPosition, resumePoint])

  // Create resume context for quizzes
  const getQuizResumeContext = useCallback(() => {
    if (!shouldResumeFromPosition('QUIZ') || !resumePoint) return null

    return {
      startQuestion: resumePoint.position,
      showResumeNotification: true,
      resumeMessage: `Folytatás a ${resumePoint.position}. kérdéstől`
    }
  }, [shouldResumeFromPosition, resumePoint])

  return {
    // State
    showResumePrompt,
    resumePoint,
    shouldAutoResume,
    
    // Handlers
    handleResume,
    handleStartFromBeginning,
    dismissResumePrompt,
    
    // Position helpers
    getResumePosition,
    shouldResumeFromPosition,
    
    // Content-specific contexts
    getVideoResumeContext,
    getAudioResumeContext,
    getReadingResumeContext,
    getQuizResumeContext,
    
    // Progress data
    progress: progressData?.progress?.watchPercentage || 0,
    isCompleted: progressData?.progress?.completed || false,
    lastAccessed: progressData?.progress?.updatedAt
  }
}