'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, Loader2, Play } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'
import { useCourses } from '@/hooks/useCourseQueries'
import { useCategories } from '@/hooks/useCategoryQueries'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { useAuthStore } from '@/stores/authStore'
import { DashboardSearch } from '@/components/dashboard/DashboardSearch'
import { EnrolledCourseCarousel } from '@/components/dashboard/EnrolledCourseCarousel'
import type { Course } from '@/types'
import { calculateCourseDuration } from '@/lib/carouselUtils'
import { COURSE_COMPLETION_THRESHOLD } from '@/lib/progress'

// Helper to get first lesson ID from course (flat lessons array)
function getFirstLessonId(course: Course): string | undefined {
  const lessons = (course as any).lessons || [];
  if (lessons.length === 0) return undefined;

  const sortedLessons = [...lessons]
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

  return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
}

/**
 * Dashboard Courses Page - Netflix Style
 *
 * Displays enrolled courses with carousels grouped by status
 */
export default function DashboardCoursesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments()
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const { data: categories = [] } = useCategories()
  const { data: instructors = [] } = useInstructors()

  // Merge enrollment data with course data
  const enrichedEnrollments = useMemo(() => {
    return enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId)
      if (!course) return null;

      // Calculate total duration from lessons
      let totalDuration = 0;
      if (course.lessons && Array.isArray(course.lessons)) {
        totalDuration = calculateCourseDuration(course.lessons);
      } else if (course.modules && Array.isArray(course.modules)) {
        const allLessons = course.modules.flatMap((module: any) => module.lessons || []);
        totalDuration = calculateCourseDuration(allLessons);
      }

      return {
        ...enrollment,
        course,
        thumbnailUrl: course?.thumbnailUrl,
        courseType: course?.courseType,
        duration: totalDuration, // Now in seconds
        // Add lesson IDs for player navigation
        currentLessonId: enrollment.currentLessonId,
        firstLessonId: enrollment.firstLessonId || getFirstLessonId(course),
      }
    }).filter((e): e is NonNullable<typeof e> => e !== null) // Only show enrollments with valid courses
  }, [enrollments, courses])

  // Group by status - courses at completion threshold are considered completed
  const inProgressCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < COURSE_COMPLETION_THRESHOLD)),
    [enrichedEnrollments]
  )

  const completedCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'completed' || e.progress >= COURSE_COMPLETION_THRESHOLD),
    [enrichedEnrollments]
  )

  const notStartedCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'not_started' || e.progress === 0),
    [enrichedEnrollments]
  )

  // Most recent course for simple hero (like company admin)
  const mostRecentCourse = useMemo(() => {
    if (inProgressCourses.length > 0) return inProgressCourses[0]
    return enrichedEnrollments[0]
  }, [inProgressCourses, enrichedEnrollments])

  const isLoading = enrollmentsLoading || coursesLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
      </div>
    )
  }

  // Empty state
  if (enrichedEnrollments.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardSearch className="my-2" />

        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-secondary/5">
            <BookOpen className="h-10 w-10 text-brand-secondary" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            Még nincs tartalmad
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            Kezdj el egy új tartalmat a böngészés gombra kattintva
          </p>
          <Link
            href="/courses"
            className="rounded-lg bg-brand-secondary px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-secondary/90 transition-colors"
          >
            Tartalmak böngészése
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saját tartalmaim</h1>
        <p className="text-gray-600 mt-1">Kezeld és folytasd a tartalmaidat egy helyen</p>
      </div>

      {/* Simple Hero - Continue Watching (same style as company admin) */}
      {mostRecentCourse && mostRecentCourse.course && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 min-h-[200px]">
          {/* Background Image - Full cover */}
          {mostRecentCourse.thumbnailUrl && (
            <div className="absolute inset-0">
              <img
                src={mostRecentCourse.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-gray-900/40" />
            </div>
          )}

          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
                {mostRecentCourse.courseName}
              </h2>

              {/* Progress (only show if > 0 and < 100) */}
              {mostRecentCourse.progress > 0 && mostRecentCourse.progress < 100 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                    <span>{mostRecentCourse.progress}% befejezve</span>
                  </div>
                  <div className="w-full max-w-xs bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-brand-secondary h-1.5 rounded-full transition-all"
                      style={{ width: `${mostRecentCourse.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  const targetLessonId = mostRecentCourse.currentLessonId || mostRecentCourse.firstLessonId;
                  if (targetLessonId) {
                    router.push(`/courses/${mostRecentCourse.courseId}/player/${targetLessonId}`);
                  } else {
                    router.push(`/courses/${mostRecentCourse.courseId}`);
                  }
                }}
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                {mostRecentCourse.progress > 0 ? 'Folytatás' : 'Indítás'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <DashboardSearch className="my-2" />

      {/* In Progress Courses */}
      {inProgressCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Folytatás"
          icon={<Clock className="w-5 h-5 text-brand-secondary" />}
          enrollments={inProgressCourses}
          courses={courses}
          categories={categories}
          instructors={instructors}
          userId={user?.uid}
        />
      )}

      {/* Not Started Courses */}
      {notStartedCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Saját listám"
          icon={<BookOpen className="w-5 h-5 text-gray-500" />}
          enrollments={notStartedCourses}
          courses={courses}
          categories={categories}
          instructors={instructors}
          userId={user?.uid}
        />
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Befejezett"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          enrollments={completedCourses}
          courses={courses}
          categories={categories}
          instructors={instructors}
          userId={user?.uid}
        />
      )}
    </div>
  )
}
