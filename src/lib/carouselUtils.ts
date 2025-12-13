import { Course } from '@/types'

/**
 * Sort courses by contentCreatedAt (newest first)
 * Falls back to createdAt if contentCreatedAt is missing
 */
export function sortByContentCreatedAt(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => {
    const dateA = a.contentCreatedAt || a.createdAt
    const dateB = b.contentCreatedAt || b.createdAt
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * User-specific randomization (generates new order on every call)
 */
export function shuffleForUser<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get popular courses and shuffle them
 * First sorts by enrollmentCount, takes top N, then shuffles
 */
export function shufflePopularCourses(courses: Course[], limit: number = 12): Course[] {
  const topPopular = [...courses]
    .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
    .slice(0, limit)

  return shuffleForUser(topPopular)
}

/**
 * Format duration in seconds to Hungarian text
 * Examples:
 * - 2700 seconds (45 min) → "45 perc"
 * - 7200 seconds (2 hours) → "2 óra"
 * - 8100 seconds (2h 15m) → "2 óra 15 perc"
 *
 * @param seconds - Duration in seconds
 * @returns Formatted Hungarian duration string
 */
export function formatDurationHungarian(seconds: number): string {
  if (!seconds || seconds <= 0) return '';

  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} perc`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} óra`;
  }

  return `${hours} óra ${minutes} perc`;
}

/**
 * Calculate total course duration from lessons
 * @param lessons - Array of lessons with duration in seconds
 * @returns Total duration in seconds
 */
export function calculateCourseDuration(lessons: Array<{ duration?: number }>): number {
  if (!lessons || lessons.length === 0) return 0;

  return lessons.reduce((total, lesson) => {
    return total + (lesson.duration || 0);
  }, 0);
}
