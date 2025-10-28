/**
 * Shared resume context types for lesson components
 */

export interface VideoResumeContext {
  startTime?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

export interface ReadingResumeContext {
  scrollPercentage?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

export interface AudioResumeContext {
  startTime?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

export interface QuizResumeContext {
  startQuestion?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

export type ResumeContext = VideoResumeContext | ReadingResumeContext | AudioResumeContext | QuizResumeContext | null