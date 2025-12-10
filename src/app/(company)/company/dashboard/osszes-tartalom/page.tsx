'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { Loader2, Video, GraduationCap, Star, Mic } from 'lucide-react';
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel';
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow';
import { DashboardSearch, DashboardFilters } from '@/components/dashboard/DashboardSearch';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { useEnrollments } from '@/hooks/useEnrollments';
import type { Course } from '@/types';

// Course type definitions with display info
const courseTypes = [
  { type: 'WEBINAR' as const, title: 'Webinár', icon: Video },
  { type: 'ACADEMIA' as const, title: 'Akadémia', icon: GraduationCap },
  { type: 'MASTERCLASS' as const, title: 'Masterclass', icon: Star },
  { type: 'PODCAST' as const, title: 'Podcast', icon: Mic },
];

// Helper to get first lesson ID from course (flat lessons array)
function getFirstLessonId(course: Course): string | undefined {
  const lessons = (course as any).lessons || [];
  if (lessons.length === 0) return undefined;

  const sortedLessons = [...lessons]
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

  return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
}

export default function CompanyAllContentPage() {
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

  // Apply filters to all courses
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    let result = [...courses];

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

    // Apply course type filter (OR logic for multi-select)
    if (filters.courseTypes.length > 0) {
      result = result.filter(course =>
        filters.courseTypes.includes(course.courseType as any)
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

  // Build hero slides from newest courses (mixed types)
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
        instructorNames: getInstructorNames(course),
        duration: course.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(course),
      };
    });
  }, [filteredCourses, instructors, enrollments]);

  // Group courses by course type
  const courseTypeRows = useMemo(() => {
    if (!filteredCourses.length) return [];

    return courseTypes
      .map(({ type, title }) => {
        const typeCourses = filteredCourses.filter(course => course.courseType === type);
        return { type, title, courses: typeCourses };
      })
      .filter(row => row.courses.length > 0);
  }, [filteredCourses]);

  const isLoading = coursesLoading || categoriesLoading || instructorsLoading || enrollmentsLoading;

  // Check if any filters are active
  const hasActiveFilters = filters.query ||
    filters.categoryIds.length > 0 ||
    filters.audienceIds.length > 0 ||
    filters.courseTypes.length > 0 ||
    filters.instructorIds.length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
      </div>
    );
  }

  // No courses at all
  if (!courses || courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Nincs megjeleníthető tartalom</p>
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

      {/* Search Bar - no courseType filter since we want to show all */}
      <DashboardSearch className="my-2" onFilterChange={setFilters} />

      {/* No results message when filters are active but no matches */}
      {hasActiveFilters && filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-2">Nincs találat a megadott szűrőkkel</p>
          <p className="text-sm text-gray-400">Próbálj más szűrőket választani</p>
        </div>
      )}

      {/* Course type rows */}
      {courseTypeRows.map(({ type, title, courses: typeCourses }) => (
        <CourseCarouselRow
          key={type}
          title={title}
          courses={typeCourses}
          categories={categories || []}
          instructors={instructors || []}
          enrollments={enrollments || []}
        />
      ))}

      {/* Show message if filters removed all results but there are courses */}
      {courseTypeRows.length === 0 && filteredCourses.length === 0 && !hasActiveFilters && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Nincs megjeleníthető tartalom</p>
        </div>
      )}
    </div>
  );
}
