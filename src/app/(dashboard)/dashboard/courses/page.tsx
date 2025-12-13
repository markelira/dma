'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'
import { useCourses } from '@/hooks/useCourseQueries'
import { useCategories } from '@/hooks/useCategoryQueries'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { DashboardSearch } from '@/components/dashboard/DashboardSearch'
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel'
import { EnrolledCourseCarousel } from '@/components/dashboard/EnrolledCourseCarousel'
import type { Course } from '@/types'
import { calculateCourseDuration } from '@/lib/carouselUtils'
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
 * Displays enrolled courses with carousels grouped by status
 */
export default function DashboardCoursesPage() {
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments()
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const { data: categories = [] } = useCategories()
  const { data: instructors = [] } = useInstructors()

  // Build hero slides from enrolled courses only
  const heroSlides = useMemo(() => {
    if (!courses || !enrollments || enrollments.length === 0) return [];

    const slides: Array<{
      id: string;
      title: string;
      description?: string;
      thumbnailUrl?: string;
      courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
      instructorNames?: string[];
      duration?: string;
      progress?: number;
      isEnrolled?: boolean;
      currentLessonId?: string;
      firstLessonId?: string;
    }> = [];

    // Helper to get instructor names
    const getInstructorNames = (course: Course): string[] => {
      if (!instructors) return [];
      const names: string[] = [];

      if (course.instructorId) {
        const instructor = instructors.find(i => i.id === course.instructorId);
        if (instructor?.name) names.push(instructor.name);
      }

      if ((course as any).instructorIds?.length) {
        (course as any).instructorIds.forEach((id: string) => {
          const instructor = instructors.find(i => i.id === id);
          if (instructor?.name && !names.includes(instructor.name)) {
            names.push(instructor.name);
          }
        });
      }

      return names;
    };

    // Build slides from enrolled courses (sorted by lastAccessedAt)
    const sortedEnrollments = [...enrollments].sort((a, b) => {
      const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return dateB - dateA;
    });

    // Take top 5 most recently accessed enrolled courses
    sortedEnrollments.slice(0, 5).forEach(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      if (!course) return;

      slides.push({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        courseType: course.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
        instructorNames: getInstructorNames(course),
        duration: course.duration,
        progress: enrollment.progress,
        isEnrolled: true,
        currentLessonId: enrollment.currentLessonId,
        firstLessonId: enrollment.firstLessonId || getFirstLessonId(course),
      });
    });

    return shuffleArray(slides);
  }, [enrollments, courses, instructors]);

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

  // Group by status - 90%+ is considered completed
  const inProgressCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 90)),
    [enrichedEnrollments]
  )

  const completedCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'completed' || e.progress >= 90),
    [enrichedEnrollments]
  )

  const notStartedCourses = useMemo(() =>
    enrichedEnrollments.filter(e => e.status === 'not_started' || e.progress === 0),
    [enrichedEnrollments]
  )

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
      {/* Hero Carousel - Enrolled Courses */}
      {heroSlides.length > 0 && (
        <DashboardHeroCarousel slides={heroSlides} />
      )}

      {/* Search */}
      <DashboardSearch className="my-2" />

      {/* In Progress Courses */}
      {inProgressCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Folytatás"
          icon={<Clock className="w-5 h-5 text-brand-secondary" />}
          enrollments={inProgressCourses}
          categories={categories}
          instructors={instructors}
        />
      )}

      {/* Not Started Courses */}
      {notStartedCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Saját listám"
          icon={<BookOpen className="w-5 h-5 text-gray-500" />}
          enrollments={notStartedCourses}
          categories={categories}
          instructors={instructors}
        />
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <EnrolledCourseCarousel
          title="Befejezett"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          enrollments={completedCourses}
          categories={categories}
          instructors={instructors}
        />
      )}
    </div>
  )
}
