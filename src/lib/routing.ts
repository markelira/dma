/**
 * Routing utilities for role-based navigation and URL generation
 */

/**
 * Get the appropriate dashboard path based on user role
 * - company_admin → /vallalkozas/kezdolap
 * - INSTRUCTOR → /instructor/dashboard
 * - ADMIN → /admin/dashboard
 * - COMPANY_EMPLOYEE and all other roles → /dashboard
 */
export function getDashboardPath(role?: string): string {
  const upperRole = role?.toUpperCase();
  if (upperRole === 'COMPANY_ADMIN') {
    return '/vallalkozas/kezdolap';
  }
  if (upperRole === 'INSTRUCTOR') {
    return '/instructor/dashboard';
  }
  if (upperRole === 'ADMIN') {
    return '/admin/dashboard';
  }
  return '/dashboard';
}

/**
 * Course type to URL prefix mapping
 */
const COURSE_TYPE_PREFIX: Record<string, string> = {
  WEBINAR: 'webinar',
  MASTERCLASS: 'masterclass',
  ACADEMIA: 'akademia',
  AKADEMIA: 'akademia',
  PODCAST: 'podcast',
};

/**
 * Generate URL for a course detail page based on courseType
 * Falls back to /courses/ prefix if courseType is missing
 */
export function getCourseUrl(course: { courseType?: string; slug?: string; id: string }): string {
  const prefix = course.courseType ? COURSE_TYPE_PREFIX[course.courseType.toUpperCase()] : 'courses';
  const identifier = course.slug || course.id;
  return `/${prefix || 'courses'}/${identifier}`;
}

/**
 * Generate URL for a course player page based on courseType
 */
export function getCoursePlayerUrl(
  course: { courseType?: string; slug?: string; id: string },
  lessonId: string
): string {
  return `${getCourseUrl(course)}/player/${lessonId}`;
}
