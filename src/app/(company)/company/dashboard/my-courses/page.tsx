'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Play, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'
import { useCourses } from '@/hooks/useCourseQueries'
import { useCategories } from '@/hooks/useCategoryQueries'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { DashboardSearch } from '@/components/dashboard/DashboardSearch'
import { EnrolledCourseCarousel } from '@/components/dashboard/EnrolledCourseCarousel'
import type { Course } from '@/types'

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
 * Company My Courses Page - Netflix Style
 *
 * Displays enrolled courses with carousels grouped by status
 */
export default function CompanyMyCoursesPage() {
  const router = useRouter()
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments()
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const { data: categories = [] } = useCategories()
  const { data: instructors = [] } = useInstructors()

  // Merge enrollment data with course data
  const enrichedEnrollments = useMemo(() => {
    return enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId)
      if (!course) return null;
      return {
        ...enrollment,
        course,
        thumbnailUrl: course?.thumbnailUrl,
        courseType: course?.courseType,
        duration: course?.duration,
        // Add lesson IDs for player navigation
        currentLessonId: enrollment.currentLessonId,
        firstLessonId: enrollment.firstLessonId || getFirstLessonId(course),
      }
    }).filter((e): e is NonNullable<typeof e> => e !== null) // Only show enrollments with valid courses
  }, [enrollments, courses])

  // Group by status
  const inProgressCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100)),
    [enrichedEnrollments]
  )

  const completedCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'completed' || e.progress === 100),
    [enrichedEnrollments]
  )

  const notStartedCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'not_started' || e.progress === 0),
    [enrichedEnrollments]
  )

  // Most recent course for hero
  const mostRecentCourse = useMemo(() => {
    if (inProgressCourses.length > 0) {
      return inProgressCourses[0]
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saját tartalmaim</h1>
          <p className="text-gray-600 mt-1">Kezeld és folytasd a tartalmaidat egy helyen</p>
        </div>

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
            href="/company/dashboard/courses"
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

      {/* Hero - Continue Watching */}
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

              {/* Progress */}
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

      {/* Kaland folytatása - In Progress */}
      {inProgressCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Kaland folytatása"
          enrollments={inProgressCourses}
          categories={categories}
          instructors={instructors}
        />
      )}

      {/* Saját listám - Not Started / Saved */}
      {notStartedCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Saját listám"
          enrollments={notStartedCourses}
          categories={categories}
          instructors={instructors}
        />
      )}

      {/* Befejezett - Completed */}
      {completedCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Befejezett"
          enrollments={completedCourses}
          categories={categories}
          instructors={instructors}
        />
      )}
    </div>
  )
}
