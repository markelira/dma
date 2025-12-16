'use client';

export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel';
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow';
import { DashboardSearch } from '@/components/dashboard/DashboardSearch';
import { EnrolledCourseCarousel } from '@/components/dashboard/EnrolledCourseCarousel';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useTargetAudiences } from '@/hooks/useTargetAudienceQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import type { Course } from '@/types';
import { shuffleArray } from '@/lib/utils';
import { sortByContentCreatedAt, shufflePopularCourses } from '@/lib/carouselUtils';

/**
 * Company Dashboard - Netflix-Style Content Browser
 *
 * Sections:
 * 1. Hero carousel (latest opened + latest by course type)
 * 2. "Folytatás" - enrolled courses
 * 3. Category carousels (one per category)
 * 4. Target audience carousels (top 2 most popular)
 */

export default function CompanyDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Data hooks
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: targetAudiences, isLoading: audiencesLoading } = useTargetAudiences();
  const { data: instructors, isLoading: instructorsLoading } = useInstructors();

  // Build hero slides - only non-enrolled courses
  const heroSlides = useMemo(() => {
    if (!courses) return [];

    // Helper to get first lesson ID from course (flat lessons array)
    const getFirstLessonId = (course: Course): string | undefined => {
      const lessons = (course as any).lessons || [];
      if (lessons.length === 0) return undefined;

      const sortedLessons = [...lessons]
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

      return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
    };

    // Get enrolled course IDs to exclude from hero
    const enrolledCourseIds = new Set(enrollments?.map(e => e.courseId) || []);

    // Filter to non-enrolled courses only
    const nonEnrolledCourses = courses.filter(c => !enrolledCourseIds.has(c.id));

    // If no non-enrolled courses, return empty
    if (nonEnrolledCourses.length === 0) return [];

    const slides: Array<{
      id: string;
      title: string;
      description?: string;
      thumbnailUrl?: string;
      courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
      duration?: string;
      isEnrolled?: boolean;
      firstLessonId?: string;
    }> = [];

    // Sort non-enrolled courses by createdAt (newest first)
    const sortedCourses = [...nonEnrolledCourses].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Add latest of each course type (non-enrolled only)
    const courseTypes: Array<'MASTERCLASS' | 'WEBINAR' | 'ACADEMIA' | 'PODCAST'> = ['MASTERCLASS', 'WEBINAR', 'ACADEMIA', 'PODCAST'];

    courseTypes.forEach(type => {
      const latestOfType = sortedCourses.find(c => c.courseType === type);
      if (latestOfType && !slides.some(s => s.id === latestOfType.id)) {
        slides.push({
          id: latestOfType.id,
          title: latestOfType.title,
          description: latestOfType.description,
          thumbnailUrl: latestOfType.thumbnailUrl,
          courseType: type,
          duration: latestOfType.duration,
          isEnrolled: false,
          firstLessonId: getFirstLessonId(latestOfType),
        });
      }
    });

    // Fill remaining slots with other non-enrolled courses (up to 5 total)
    if (slides.length < 5) {
      const remainingCourses = sortedCourses.filter(c => !slides.some(s => s.id === c.id));
      remainingCourses.slice(0, 5 - slides.length).forEach(course => {
        slides.push({
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnailUrl: course.thumbnailUrl,
          courseType: course.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
          duration: course.duration,
          isEnrolled: false,
          firstLessonId: getFirstLessonId(course),
        });
      });
    }

    return shuffleArray(slides);
  }, [courses, enrollments]);

  // Build enrolled courses list (Saját listám)
  const enrolledCourses = useMemo(() => {
    if (!enrollments || !courses) return [];

    return enrollments
      .map(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (!course) return null;
        return {
          ...course,
          progress: enrollment.progress,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [enrollments, courses]);

  // Build enriched enrollments for player links (Folytatás)
  const enrichedEnrollments = useMemo(() => {
    if (!enrollments || !courses) return [];

    return enrollments
      .map(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (!course) return null;
        const instructor = instructors?.find(i => i.id === course.instructorId);
        return {
          id: enrollment.id || `${enrollment.courseId}-${enrollment.progress}`,
          courseId: enrollment.courseId,
          courseName: course.title,
          courseInstructor: instructor?.name,
          progress: enrollment.progress || 0,
          status: enrollment.status || (enrollment.progress > 0 ? 'in_progress' : 'not_started'),
          thumbnailUrl: course.thumbnailUrl,
          courseType: course.courseType,
          duration: course.duration,
          currentLessonId: enrollment.currentLessonId,
          firstLessonId: enrollment.firstLessonId,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [enrollments, courses, instructors]);

  // Build category rows - check multiple category field formats
  const categoryRows = useMemo(() => {
    if (!categories || !courses) return [];

    return categories
      .map(category => {
        const categoryCourses = courses.filter(course => {
          // Check array format (categoryIds)
          if (course.categoryIds?.includes(category.id)) return true;
          // Check nested object format (category.id)
          if (course.category?.id === category.id) return true;
          // Check string format (categoryId) - fallback for older data
          if ((course as any).categoryId === category.id) return true;
          return false;
        });
        return {
          category,
          courses: shuffleArray(categoryCourses),
        };
      })
      .filter(row => row.courses.length > 0);
  }, [categories, courses]);

  // Always prepare a "Felkapott" section with top courses (shuffled)
  const popularCourses = useMemo(() => {
    if (!courses) return [];
    return shufflePopularCourses(courses, 10);
  }, [courses]);

  // Newest courses (for "Legújabb tartalmak" section)
  const newestCourses = useMemo(() => {
    if (!courses) return [];
    return sortByContentCreatedAt(courses).slice(0, 10);
  }, [courses]);

  // Check if we need to show a fallback "Felfedezés" section
  const showFallbackSection = useMemo(() => {
    // Show fallback if we have courses but no category/audience rows matched
    return courses && courses.length > 0 && categoryRows.length === 0;
  }, [courses, categoryRows]);

  // Build target audience rows (top 2 most popular)
  const audienceRows = useMemo(() => {
    if (!targetAudiences || !courses) return [];

    const audienceCounts = targetAudiences.map(audience => {
      const audienceCourses = courses.filter(course =>
        course.targetAudienceIds?.includes(audience.id)
      );
      return {
        audience,
        courses: shuffleArray(audienceCourses),
        count: audienceCourses.length,
      };
    });

    // Sort by course count and take top 2
    return audienceCounts
      .sort((a, b) => b.count - a.count)
      .filter(row => row.count > 0)
      .slice(0, 2);
  }, [targetAudiences, courses]);

  const isLoading = enrollmentsLoading || coursesLoading || categoriesLoading || audiencesLoading || instructorsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Carousel */}
      {heroSlides.length > 0 && (
        <DashboardHeroCarousel slides={heroSlides} />
      )}

      {/* Search Bar */}
      <DashboardSearch className="my-2" />

      {/* Felkapott tartalmak - most popular */}
      {popularCourses.length > 0 && (
        <CourseCarouselRow
          title="Felkapott tartalmak"
          courses={popularCourses}
          categories={categories || []}
          instructors={instructors || []}
          enrollments={enrollments || []}
          viewAllLink="/company/dashboard/courses"
        />
      )}

      {/* Legújabb tartalmak */}
      {newestCourses.length > 0 && (
        <CourseCarouselRow
          title="Legújabb tartalmak"
          courses={newestCourses}
          categories={categories || []}
          instructors={instructors || []}
          enrollments={enrollments || []}
        />
      )}

      {/* Kaland folytatása - Only in-progress courses, no icon */}
      {enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100)).length > 0 && (
        <EnrolledCourseCarousel
          title="Kaland folytatása"
          enrollments={enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100))}
          categories={categories || []}
          instructors={instructors || []}
        />
      )}

      {/* Category Carousels */}
      {categoryRows.map(({ category, courses: categoryCourses }) => (
        <CourseCarouselRow
          key={category.id}
          title={category.name}
          courses={categoryCourses}
          categories={categories || []}
          instructors={instructors || []}
          enrollments={enrollments || []}
          viewAllLink={`/company/dashboard/courses?category=${category.id}`}
        />
      ))}

      {/* Fallback: All Courses if no categories matched */}
      {showFallbackSection && courses && (
        <CourseCarouselRow
          title="Felfedezés"
          courses={courses}
          categories={categories || []}
          instructors={instructors || []}
          enrollments={enrollments || []}
          viewAllLink="/company/dashboard/courses"
        />
      )}

      {/* Target Audience Carousels (Top 2) */}
      {audienceRows.map(({ audience, courses: audienceCourses }) => (
        <CourseCarouselRow
          key={audience.id}
          title={audience.name}
          courses={audienceCourses}
          categories={categories || []}
          instructors={instructors || []}
          enrollments={enrollments || []}
          viewAllLink={`/company/dashboard/courses?audience=${audience.id}`}
        />
      ))}

      {/* Course Type Carousels */}
      {courses && ['WEBINAR', 'ACADEMIA', 'MASTERCLASS', 'PODCAST'].map(type => {
        const typeCourses = shuffleArray(courses.filter(c => c.courseType === type));
        if (typeCourses.length === 0) return null;

        const typeLabels: Record<string, string> = {
          'WEBINAR': 'Webinár',
          'ACADEMIA': 'Akadémia',
          'MASTERCLASS': 'Masterclass',
          'PODCAST': 'Podcast'
        };

        return (
          <CourseCarouselRow
            key={type}
            title={typeLabels[type]}
            courses={typeCourses}
            categories={categories || []}
            instructors={instructors || []}
            enrollments={enrollments || []}
            viewAllLink={`/company/dashboard/${type.toLowerCase()}`}
          />
        );
      })}

      {/* Empty State */}
      {heroSlides.length === 0 && enrolledCourses.length === 0 && (!courses || courses.length === 0) && (
        <div className="text-center py-16">
          <p className="text-gray-500">Nincs megjeleníthető tartalom</p>
        </div>
      )}
    </div>
  );
}
