'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel';
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow';
import { DashboardSearch, DashboardFilters } from '@/components/dashboard/DashboardSearch';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { useEnrollments } from '@/hooks/useEnrollments';
import type { Course } from '@/types';

interface CategoryCoursesPageProps {
  courseType: 'MASTERCLASS' | 'WEBINAR' | 'ACADEMIA' | 'PODCAST';
  title: string;
  description: string;
}

// Helper to get first lesson ID from course (flat lessons array)
function getFirstLessonId(course: Course): string | undefined {
  const lessons = (course as any).lessons || [];
  if (lessons.length === 0) return undefined;

  const sortedLessons = [...lessons]
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

  return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
}

export function CategoryCoursesPage({ courseType, title, description }: CategoryCoursesPageProps) {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: instructors, isLoading: instructorsLoading } = useInstructors();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    query: '',
    categoryId: null,
    audienceId: null,
    courseType: null,
    instructorId: null,
  });

  // Filter courses by type and user filters
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    let result = courses.filter(course => course.courseType === courseType);

    // Apply search query
    if (filters.query) {
      const searchLower = filters.query.toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.categoryId) {
      result = result.filter(course => {
        if (course.categoryIds?.includes(filters.categoryId!)) return true;
        if (course.category?.id === filters.categoryId) return true;
        if ((course as any).categoryId === filters.categoryId) return true;
        return false;
      });
    }

    // Apply target audience filter
    if (filters.audienceId) {
      result = result.filter(course =>
        course.targetAudienceIds?.includes(filters.audienceId!)
      );
    }

    // Apply instructor filter
    if (filters.instructorId) {
      result = result.filter(course =>
        (course as any).instructorId === filters.instructorId ||
        (course as any).instructorIds?.includes(filters.instructorId)
      );
    }

    return result;
  }, [courses, courseType, filters]);

  // Build hero slides from filtered courses
  const heroSlides = useMemo(() => {
    if (!filteredCourses.length) return [];

    const getInstructorName = (course: Course) => {
      if (!instructors || !course.instructorId) return undefined;
      const instructor = instructors.find(i => i.id === course.instructorId);
      return instructor?.name;
    };

    // Sort by createdAt (newest first) and take top 5
    const sortedCourses = [...filteredCourses].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    }).slice(0, 5);

    return sortedCourses.map(course => {
      const enrollment = enrollments?.find(e => e.courseId === course.id);
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        courseType: course.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
        instructorName: getInstructorName(course),
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

  // Popular courses in this category
  const popularCourses = useMemo(() => {
    if (!filteredCourses.length) return [];
    return [...filteredCourses]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 10);
  }, [filteredCourses]);

  const isLoading = coursesLoading || categoriesLoading || instructorsLoading || enrollmentsLoading;

  // Check if any filters are active
  const hasActiveFilters = filters.query || filters.categoryId || filters.audienceId || filters.instructorId;

  // Check if there are any courses of this type at all (before user filters)
  const allCoursesOfType = useMemo(() => {
    if (!courses) return [];
    return courses.filter(course => course.courseType === courseType);
  }, [courses, courseType]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
      </div>
    );
  }

  // No courses of this type at all
  if (allCoursesOfType.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Nincs megjeleníthető tartalom ebben a kategóriában</p>
        </div>
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
      <DashboardSearch className="my-2" onFilterChange={setFilters} courseType={courseType} />

      {/* No results message when filters are active but no matches */}
      {hasActiveFilters && filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-2">Nincs találat a megadott szűrőkkel</p>
          <p className="text-sm text-gray-400">Próbálj más szűrőket választani</p>
        </div>
      )}

      {/* Popular in this category */}
      {popularCourses.length > 0 && (
        <CourseCarouselRow
          title={`Népszerű ${title.toLowerCase()} tartalmak`}
          courses={popularCourses}
          categories={categories || []}
          instructors={instructors || []}
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
        />
      ))}

      {/* All courses in this type if no category rows */}
      {categoryRows.length === 0 && filteredCourses.length > 0 && (
        <CourseCarouselRow
          title="Összes tartalom"
          courses={filteredCourses}
          categories={categories || []}
          instructors={instructors || []}
        />
      )}
    </div>
  );
}
