'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import Footer from '@/components/landing-home/ui/footer';
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel';
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow';
import { DashboardSearch, DashboardFilters } from '@/components/dashboard/DashboardSearch';
import { CrossTypeNavigation } from '@/components/courses/CrossTypeNavigation';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { useEnrollments } from '@/hooks/useEnrollments';
import { sortByContentCreatedAt } from '@/lib/carouselUtils';
import type { Course } from '@/types';

// Helper to get first lesson ID from course (flat lessons array)
function getFirstLessonId(course: Course): string | undefined {
  const lessons = (course as any).lessons || [];
  if (lessons.length === 0) return undefined;

  const sortedLessons = [...lessons]
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

  return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
}

export default function AkademiaPage() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: instructors, isLoading: instructorsLoading } = useInstructors();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    query: '',
    categoryIds: [],
    audienceIds: [],
    courseTypes: [],
    instructorIds: [],
  });

  // Filter courses by ACADEMIA type and user filters
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    // CRITICAL: Only ACADEMIA courses
    let result = courses.filter(course => course.courseType === 'ACADEMIA');

    // Apply search query
    if (filters.query) {
      const searchLower = filters.query.toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter (OR logic for multi-select)
    if (filters.categoryIds.length > 0) {
      result = result.filter(course => {
        return filters.categoryIds.some(catId => {
          if (course.categoryIds?.includes(catId)) return true;
          if (course.category?.id === catId) return true;
          if ((course as any).categoryId === catId) return true;
          return false;
        });
      });
    }

    // Apply target audience filter (OR logic for multi-select)
    if (filters.audienceIds.length > 0) {
      result = result.filter(course =>
        filters.audienceIds.some(audId => course.targetAudienceIds?.includes(audId))
      );
    }

    // Apply instructor filter (OR logic for multi-select)
    if (filters.instructorIds.length > 0) {
      result = result.filter(course =>
        filters.instructorIds.some(instId =>
          (course as any).instructorId === instId ||
          (course as any).instructorIds?.includes(instId)
        )
      );
    }

    return result;
  }, [courses, filters]);

  // Build hero slides from filtered courses
  const heroSlides = useMemo(() => {
    if (!filteredCourses.length) return [];

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

    // Sort by contentCreatedAt (newest first) and take top 5
    const sortedCourses = sortByContentCreatedAt(filteredCourses).slice(0, 5);

    return sortedCourses.map(course => {
      const enrollment = enrollments?.find(e => e.courseId === course.id);
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        courseType: course.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
        instructorNames: getInstructorNames(course),
        duration: course.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(course),
      };
    });
  }, [filteredCourses, instructors, enrollments]);

  // Build category rows
  const categoryRows = useMemo(() => {
    if (!categories || !filteredCourses.length) return [];

    return categories
      .map(category => {
        const categoryCourses = filteredCourses.filter(course => {
          if (course.categoryIds?.includes(category.id)) return true;
          if (course.category?.id === category.id) return true;
          if ((course as any).categoryId === category.id) return true;
          return false;
        });
        return { category, courses: categoryCourses };
      })
      .filter(row => row.courses.length > 0);
  }, [categories, filteredCourses]);

  // Popular courses
  const popularCourses = useMemo(() => {
    if (!filteredCourses.length) return [];
    return [...filteredCourses]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 10);
  }, [filteredCourses]);

  // Newest courses
  const newestCourses = useMemo(() => {
    if (!filteredCourses.length) return [];
    return sortByContentCreatedAt(filteredCourses).slice(0, 10);
  }, [filteredCourses]);

  const isLoading = coursesLoading || categoriesLoading || instructorsLoading || enrollmentsLoading;

  // Check if any filters are active
  const hasActiveFilters = filters.query || filters.categoryIds.length > 0 || filters.audienceIds.length > 0 || filters.instructorIds.length > 0;

  // Check if there are any ACADEMIA courses at all (before user filters)
  const allAcademiaCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(course => course.courseType === 'ACADEMIA');
  }, [courses]);

  if (isLoading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
        </div>
        <Footer border={true} />
      </AuthProvider>
    );
  }

  // No ACADEMIA courses at all
  if (allAcademiaCourses.length === 0) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gray-50">
          <div className="space-y-6 px-4 py-16">
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Nincs megjeleníthető akadémia tartalom</p>
            </div>
          </div>
        </div>
        <Footer border={true} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <FramerNavbarWrapper />

      <div className="min-h-screen bg-gray-50">
        <div className="space-y-8 px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          {/* Hero Carousel */}
          {heroSlides.length > 0 && (
            <DashboardHeroCarousel slides={heroSlides} />
          )}

          {/* Search Bar */}
          <DashboardSearch
            className="my-2"
            onFilterChange={setFilters}
            courseType="ACADEMIA"
            hideCourseTypeFilter={true}
          />

          {/* No results message when filters are active but no matches */}
          {hasActiveFilters && filteredCourses.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-2">Nincs találat a megadott szűrőkkel</p>
              <p className="text-sm text-gray-400">Próbálj más szűrőket választani</p>
            </div>
          )}

          {/* Popular academias */}
          {popularCourses.length > 0 && (
            <CourseCarouselRow
              title="Felkapott akadémia tartalmak"
              courses={popularCourses}
              categories={categories || []}
              instructors={instructors || []}
              enrollments={enrollments || []}
            />
          )}

          {/* Newest academias */}
          {newestCourses.length > 0 && (
            <CourseCarouselRow
              title="Legújabb akadémia tartalmak"
              courses={newestCourses}
              categories={categories || []}
              instructors={instructors || []}
              enrollments={enrollments || []}
            />
          )}

          {/* Category rows */}
          {categoryRows.map(({ category, courses: categoryCourses }) => (
            <CourseCarouselRow
              key={category.id}
              title={category.name}
              courses={categoryCourses}
              categories={categories || []}
              instructors={instructors || []}
              enrollments={enrollments || []}
            />
          ))}

          {/* All courses if no category rows */}
          {categoryRows.length === 0 && filteredCourses.length > 0 && (
            <CourseCarouselRow
              title="Összes akadémia tartalom"
              courses={filteredCourses}
              categories={categories || []}
              instructors={instructors || []}
              enrollments={enrollments || []}
            />
          )}

          {/* CrossTypeNavigation - marketing-specific feature */}
          <div className="w-full mx-auto max-w-[1440px] mt-12 sm:mt-16">
            <CrossTypeNavigation currentType="ACADEMIA" />
          </div>
        </div>
      </div>

      <Footer border={true} />
    </AuthProvider>
  );
}
