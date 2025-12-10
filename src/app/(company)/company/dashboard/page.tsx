'use client';

export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Building2, Star, Play } from 'lucide-react';
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

  // Build hero slides
  const heroSlides = useMemo(() => {
    if (!courses) return [];

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

    // Helper to get first lesson ID from course (flat lessons array)
    const getFirstLessonId = (course: Course): string | undefined => {
      const lessons = (course as any).lessons || [];
      if (lessons.length === 0) return undefined;

      const sortedLessons = [...lessons]
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

      return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
    };

    // Get instructor names helper (returns array for multiple instructors)
    const getInstructorNames = (course: Course): string[] => {
      if (!instructors) return [];
      const names: string[] = [];

      // Check single instructorId
      if (course.instructorId) {
        const instructor = instructors.find(i => i.id === course.instructorId);
        if (instructor?.name) names.push(instructor.name);
      }

      // Check instructorIds array
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

    // 1. Latest opened course (first enrollment)
    if (enrollments && enrollments.length > 0) {
      const latestEnrollment = enrollments[0];
      const enrolledCourse = courses.find(c => c.id === latestEnrollment.courseId);
      if (enrolledCourse) {
        slides.push({
          id: enrolledCourse.id,
          title: enrolledCourse.title,
          description: enrolledCourse.description,
          thumbnailUrl: enrolledCourse.thumbnailUrl,
          courseType: enrolledCourse.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
          instructorNames: getInstructorNames(enrolledCourse),
          duration: enrolledCourse.duration,
          progress: latestEnrollment.progress,
          isEnrolled: true,
          currentLessonId: latestEnrollment.currentLessonId,
          firstLessonId: latestEnrollment.firstLessonId || getFirstLessonId(enrolledCourse),
        });
      }
    }

    // Sort courses by createdAt (newest first)
    const sortedCourses = [...courses].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // 2. Latest MASTERCLASS
    const latestMasterclass = sortedCourses.find(c => c.courseType === 'MASTERCLASS');
    if (latestMasterclass && !slides.some(s => s.id === latestMasterclass.id)) {
      const enrollment = enrollments?.find(e => e.courseId === latestMasterclass.id);
      slides.push({
        id: latestMasterclass.id,
        title: latestMasterclass.title,
        description: latestMasterclass.description,
        thumbnailUrl: latestMasterclass.thumbnailUrl,
        courseType: 'MASTERCLASS',
        instructorNames: getInstructorNames(latestMasterclass),
        duration: latestMasterclass.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(latestMasterclass),
      });
    }

    // 3. Latest WEBINAR
    const latestWebinar = sortedCourses.find(c => c.courseType === 'WEBINAR');
    if (latestWebinar && !slides.some(s => s.id === latestWebinar.id)) {
      const enrollment = enrollments?.find(e => e.courseId === latestWebinar.id);
      slides.push({
        id: latestWebinar.id,
        title: latestWebinar.title,
        description: latestWebinar.description,
        thumbnailUrl: latestWebinar.thumbnailUrl,
        courseType: 'WEBINAR',
        instructorNames: getInstructorNames(latestWebinar),
        duration: latestWebinar.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(latestWebinar),
      });
    }

    // 4. Latest ACADEMIA
    const latestAcademia = sortedCourses.find(c => c.courseType === 'ACADEMIA');
    if (latestAcademia && !slides.some(s => s.id === latestAcademia.id)) {
      const enrollment = enrollments?.find(e => e.courseId === latestAcademia.id);
      slides.push({
        id: latestAcademia.id,
        title: latestAcademia.title,
        description: latestAcademia.description,
        thumbnailUrl: latestAcademia.thumbnailUrl,
        courseType: 'ACADEMIA',
        instructorNames: getInstructorNames(latestAcademia),
        duration: latestAcademia.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(latestAcademia),
      });
    }

    // 5. Latest PODCAST
    const latestPodcast = sortedCourses.find(c => c.courseType === 'PODCAST');
    if (latestPodcast && !slides.some(s => s.id === latestPodcast.id)) {
      const enrollment = enrollments?.find(e => e.courseId === latestPodcast.id);
      slides.push({
        id: latestPodcast.id,
        title: latestPodcast.title,
        description: latestPodcast.description,
        thumbnailUrl: latestPodcast.thumbnailUrl,
        courseType: 'PODCAST',
        instructorNames: getInstructorNames(latestPodcast),
        duration: latestPodcast.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(latestPodcast),
      });
    }

    return shuffleArray(slides);
  }, [courses, enrollments, instructors]);

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

  // Always prepare a "Népszerű" section with top courses
  const popularCourses = useMemo(() => {
    if (!courses) return [];
    // Sort by enrollment count, take top 10, then shuffle
    return shuffleArray([...courses]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 10));
  }, [courses]);

  // Newest courses (for "Legújabb tartalmak" section)
  const newestCourses = useMemo(() => {
    if (!courses) return [];
    return shuffleArray([...courses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10));
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
      {/* Company Banner */}
      <div className="rounded-xl bg-gradient-to-r from-brand-secondary/5 to-purple-50/80 border border-brand-secondary/20 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-secondary to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Vállalati fiók
            </p>
            <p className="text-sm font-normal text-gray-600">
              Korlátlan hozzáférés az összes tartalomhoz
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-normal bg-brand-secondary/10 text-brand-secondary">
            <Star className="w-3 h-3 mr-1" />
            Prémium
          </span>
        </div>
      </div>

      {/* Hero Carousel */}
      {heroSlides.length > 0 && (
        <DashboardHeroCarousel slides={heroSlides} />
      )}

      {/* Search Bar */}
      <DashboardSearch className="my-2" />

      {/* Folytatás - Enrolled courses linking to player */}
      {enrichedEnrollments.length > 0 && (
        <EnrolledCourseCarousel
          title="Folytatás"
          icon={<Play className="w-5 h-5 text-brand-secondary" />}
          enrollments={enrichedEnrollments}
          categories={categories || []}
          instructors={instructors || []}
        />
      )}

      {/* Népszerű tartalmak - always show if we have courses */}
      {popularCourses.length > 0 && (
        <CourseCarouselRow
          title="Népszerű tartalmak"
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
