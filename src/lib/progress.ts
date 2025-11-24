/**
 * Unified Progress Calculation Utility
 *
 * Provides consistent progress calculation and status handling
 * across the application.
 */

// Enrollment status constants
export const ENROLLMENT_STATUS = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'ACTIVE', // In progress - using uppercase to match existing data
  COMPLETED: 'completed',
} as const

export type EnrollmentStatus = typeof ENROLLMENT_STATUS[keyof typeof ENROLLMENT_STATUS]

// Status values that indicate "in progress"
export const IN_PROGRESS_STATUSES = ['in_progress', 'ACTIVE', 'active'] as const

// Lesson completion threshold (percentage)
export const LESSON_COMPLETION_THRESHOLD = 90

/**
 * Normalize enrollment status to a consistent format
 */
export function normalizeEnrollmentStatus(
  status: string | undefined,
  progress: number = 0
): EnrollmentStatus {
  if (!status) {
    return progress > 0 ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.NOT_STARTED
  }

  const normalized = status.toLowerCase()

  if (normalized === 'completed') {
    return ENROLLMENT_STATUS.COMPLETED
  }

  if (['active', 'in_progress'].includes(normalized)) {
    return ENROLLMENT_STATUS.ACTIVE
  }

  return ENROLLMENT_STATUS.NOT_STARTED
}

/**
 * Check if a status indicates the enrollment is in progress
 */
export function isInProgress(status: string | undefined): boolean {
  if (!status) return false
  return IN_PROGRESS_STATUSES.includes(status as any)
}

/**
 * Calculate course progress based on completed lessons
 */
export function calculateCourseProgress(
  completedLessonCount: number,
  totalLessonCount: number
): number {
  if (totalLessonCount <= 0) return 0
  return Math.min(Math.round((completedLessonCount / totalLessonCount) * 100), 100)
}

/**
 * Determine enrollment status based on progress percentage
 */
export function getStatusFromProgress(progress: number): EnrollmentStatus {
  if (progress >= 100) {
    return ENROLLMENT_STATUS.COMPLETED
  }
  if (progress > 0) {
    return ENROLLMENT_STATUS.ACTIVE
  }
  return ENROLLMENT_STATUS.NOT_STARTED
}

/**
 * Check if a lesson is considered complete
 */
export function isLessonComplete(
  watchPercentage: number,
  completed?: boolean
): boolean {
  return completed === true || watchPercentage >= LESSON_COMPLETION_THRESHOLD
}

/**
 * Count total lessons from course modules
 */
export function countTotalLessons(
  modules: Array<{ lessons?: any[] }> | undefined,
  fallbackCount?: number
): number {
  if (modules && Array.isArray(modules)) {
    const count = modules.reduce((acc, module) => {
      return acc + (module.lessons?.length || 0)
    }, 0)
    if (count > 0) return count
  }
  return fallbackCount || 0
}

/**
 * Format progress for display
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`
}

/**
 * Get progress display color based on percentage
 */
export function getProgressColor(progress: number): string {
  if (progress >= 100) return 'green'
  if (progress >= 50) return 'blue'
  if (progress > 0) return 'yellow'
  return 'gray'
}
