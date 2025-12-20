/**
 * Course Completion Detection Hook
 *
 * Detects when a course reaches 100% completion and manages
 * the celebration modal state.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { COURSE_COMPLETION_THRESHOLD } from '@/lib/progress'

const STORAGE_KEY = 'dma_completed_celebrations'

interface CompletionState {
  /** Whether the course is 100% complete */
  isCompleted: boolean
  /** Whether the user just completed the course (triggers celebration) */
  justCompleted: boolean
  /** Dismiss the celebration modal */
  dismissCompletion: () => void
  /** Reset completion state (for re-triggering if needed) */
  resetCompletion: () => void
}

/**
 * Get stored completion celebrations from localStorage
 */
function getStoredCompletions(): Record<string, number> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Store a completion celebration in localStorage
 */
function storeCompletion(courseId: string): void {
  if (typeof window === 'undefined') return

  try {
    const completions = getStoredCompletions()
    completions[courseId] = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completions))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if a completion celebration has been shown for this course
 */
function hasSeenCompletion(courseId: string): boolean {
  const completions = getStoredCompletions()
  return !!completions[courseId]
}

/**
 * Hook to detect course completion and manage celebration state
 *
 * @param courseId - The course ID to track
 * @param progress - Current progress percentage (0-100)
 * @returns Completion state and handlers
 */
export function useCourseCompletion(
  courseId: string,
  progress: number
): CompletionState {
  const { user } = useAuthStore()
  const [justCompleted, setJustCompleted] = useState(false)
  const previousProgressRef = useRef<number | null>(null)
  const hasTriggeredRef = useRef(false)

  // Track if course is at completion threshold (considered complete)
  const isCompleted = progress >= COURSE_COMPLETION_THRESHOLD

  // Detect transition from incomplete to complete
  useEffect(() => {
    if (!courseId || !user) return

    const prevProgress = previousProgressRef.current
    const isAtThreshold = progress >= COURSE_COMPLETION_THRESHOLD
    const hasNotTriggered = !hasTriggeredRef.current
    const hasNotSeen = !hasSeenCompletion(courseId)

    // Case 1: Transition from incomplete to complete
    if (
      prevProgress !== null &&
      prevProgress < COURSE_COMPLETION_THRESHOLD &&
      isAtThreshold &&
      hasNotTriggered &&
      hasNotSeen
    ) {
      console.log('🎉 Course completed! (transition detected)', { courseId, progress })
      setJustCompleted(true)
      hasTriggeredRef.current = true
    }

    // Case 2: Initial load when already complete but celebration not seen
    // This handles page refresh after completing last lesson
    if (
      prevProgress === null &&
      isAtThreshold &&
      hasNotTriggered &&
      hasNotSeen
    ) {
      console.log('🎉 Course completed! (initial load)', { courseId, progress })
      setJustCompleted(true)
      hasTriggeredRef.current = true
    }

    previousProgressRef.current = progress
  }, [courseId, progress, user])

  // Dismiss the celebration and store that user has seen it
  const dismissCompletion = useCallback(() => {
    if (courseId) {
      storeCompletion(courseId)
    }
    setJustCompleted(false)
  }, [courseId])

  // Reset completion state (useful for testing or re-triggering)
  const resetCompletion = useCallback(() => {
    hasTriggeredRef.current = false
    previousProgressRef.current = null
    setJustCompleted(false)
  }, [])

  return {
    isCompleted,
    justCompleted,
    dismissCompletion,
    resetCompletion,
  }
}

/**
 * Hook to manually trigger completion celebration
 * Useful when completion is detected server-side
 */
export function useTriggerCompletion(courseId: string) {
  const [showCelebration, setShowCelebration] = useState(false)

  const trigger = useCallback(() => {
    if (!hasSeenCompletion(courseId)) {
      setShowCelebration(true)
    }
  }, [courseId])

  const dismiss = useCallback(() => {
    storeCompletion(courseId)
    setShowCelebration(false)
  }, [courseId])

  return {
    showCelebration,
    trigger,
    dismiss,
  }
}

/**
 * Clear all stored completion celebrations (for testing)
 */
export function clearAllCompletions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
