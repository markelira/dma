'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Loader2 } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'
import { useCourses } from '@/hooks/useCourseQueries'
import { useCategories } from '@/hooks/useCategoryQueries'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { useAuthStore } from '@/stores/authStore'
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel'
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow'
import type { Course } from '@/types'
import { COURSE_COMPLETION_THRESHOLD } from '@/lib/progress'
import { shuffleArray } from '@/lib/utils'

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
 * Displays ONLY enrolled courses with carousels grouped by status
 * Uses main dashboard design (DashboardHeroCarousel + CourseCarouselRow)
 */
export default function DashboardCoursesPage() {
  const { user } = useAuthStore()
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments()
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const { data: categories = [] } = useCategories()
  const { data: instructors = [] } = useInstructors()

  // Build hero slides from enrolled courses only
  const heroSlides = useMemo(() => {
    if (!courses || !enrollments || enrollments.length === 0) return [];

    // Sort enrollments by lastAccessedAt (most recent first)
    const sortedEnrollments = [...enrollments].sort((a, b) => {
      const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return dateB - dateA;
    });

    // Take top 5 most recently accessed enrolled courses
    const slides = sortedEnrollments.slice(0, 5).map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      if (!course) return null;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        courseType: course.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
        duration: course.duration,
        isEnrolled: false, // Don't show progress on hero
        firstLessonId: enrollment.firstLessonId || getFirstLessonId(course),
        currentLessonId: enrollment.currentLessonId,
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    return shuffleArray(slides);
  }, [enrollments, courses]);

  // Build enrolled course lists for carousel rows
  const enrolledCoursesWithProgress = useMemo(() => {
    if (!enrollments || !courses) return [];

    return enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      if (!course) return null;
      return {
        ...course,
        progress: enrollment.progress || 0,
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);
  }, [enrollments, courses]);

  // Group by status - courses at completion threshold are considered completed
  const inProgressCourses = useMemo(() =>
    enrolledCoursesWithProgress.filter(c => c.progress > 0 && c.progress < COURSE_COMPLETION_THRESHOLD),
    [enrolledCoursesWithProgress]
  )

  const completedCourses = useMemo(() =>
    enrolledCoursesWithProgress.filter(c => c.progress >= COURSE_COMPLETION_THRESHOLD),
    [enrolledCoursesWithProgress]
  )

  const notStartedCourses = useMemo(() =>
    enrolledCoursesWithProgress.filter(c => c.progress === 0),
    [enrolledCoursesWithProgress]
  )

  const isLoading = enrollmentsLoading || coursesLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
      </div>
    )
  }

  // Empty state - no search bar
  if (enrollments.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Carousel - Enrolled Courses (same design as main dashboard) */}
      {heroSlides.length > 0 && (
        <DashboardHeroCarousel slides={heroSlides} />
      )}

      {/* In Progress Courses - NO ICON */}
      {inProgressCourses.length > 0 && (
        <CourseCarouselRow
          title="Folytatás"
          courses={inProgressCourses}
          categories={categories}
          instructors={instructors}
          enrollments={enrollments}
        />
      )}

      {/* Not Started Courses - NO ICON */}
      {notStartedCourses.length > 0 && (
        <CourseCarouselRow
          title="Saját listám"
          courses={notStartedCourses}
          categories={categories}
          instructors={instructors}
        />
      )}

      {/* Completed Courses - NO ICON */}
      {completedCourses.length > 0 && (
        <CourseCarouselRow
          title="Befejezett"
          courses={completedCourses}
          categories={categories}
          instructors={instructors}
        />
      )}
    </div>
  )
}
