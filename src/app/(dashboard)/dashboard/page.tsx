'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Building2, Star, Play } from 'lucide-react';
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel';
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow';
import { DashboardSearch, DashboardFilters } from '@/components/dashboard/DashboardSearch';
import { EnrolledCourseCarousel } from '@/components/dashboard/EnrolledCourseCarousel';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FreeTrialModal } from '@/components/subscription/FreeTrialModal';
import { WelcomePopup } from '@/components/dashboard/WelcomePopup';
import { useTrialPopup } from '@/hooks/useTrialPopup';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useTargetAudiences } from '@/hooks/useTargetAudienceQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { useGamificationData, useSaveUserPreferences } from '@/hooks/useGamification';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { UserPreferences, Course } from '@/types';

/**
 * DMA Dashboard - Netflix-Style Content Browser
 *
 * Sections:
 * 1. Hero carousel (latest opened + latest by course type)
 * 2. "Saját listám" - enrolled courses
 * 3. Category carousels (one per category)
 * 4. Target audience carousels (top 2 most popular)
 */

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Data hooks
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: targetAudiences, isLoading: audiencesLoading } = useTargetAudiences();
  const { data: instructors, isLoading: instructorsLoading } = useInstructors();

  const { preferences } = useGamificationData();
  const savePreferences = useSaveUserPreferences();

  // Trial popup state
  const { shouldShowForAuthUser, dismiss: dismissTrial, hasActiveSubscription } = useTrialPopup();
  const [showTrialModal, setShowTrialModal] = useState(false);

  // Welcome popup state (shows first after registration)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; id: string } | null>(null);

  // Filter state for search
  const [activeFilters, setActiveFilters] = useState<DashboardFilters>({
    query: '',
    categoryId: null,
    audienceId: null,
  });

  // Check if user is company employee
  const isCompanyEmployee = user?.companyId && user?.companyRole === 'employee';

  // Fetch company info for employees
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!isCompanyEmployee || !user?.companyId) return;

      try {
        const db = getFirestore();
        const companyDoc = await getDoc(doc(db, 'companies', user.companyId));
        if (companyDoc.exists()) {
          setCompanyInfo({
            id: companyDoc.id,
            name: companyDoc.data().name || 'Vállalat'
          });
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
      }
    };

    fetchCompanyInfo();
  }, [user?.companyId, isCompanyEmployee]);

  // Check for welcome popup on mount (shows FIRST after registration)
  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showWelcomePopup');
    if (shouldShow === 'true') {
      setShowWelcomePopup(true);
      sessionStorage.removeItem('showWelcomePopup');
    }
  }, []);

  // Check if trial popup should show (AFTER welcome popup is dismissed)
  // Company employees bypass trial popup (they have company subscription)
  useEffect(() => {
    if (shouldShowForAuthUser && !isCompanyEmployee && !hasActiveSubscription && !showWelcomePopup) {
      setShowTrialModal(true);
    }
  }, [shouldShowForAuthUser, isCompanyEmployee, hasActiveSubscription, showWelcomePopup]);

  // Check if onboarding is needed (only if trial modal not showing)
  useEffect(() => {
    if (preferences.data && !preferences.data.onboardingCompleted && !showTrialModal) {
      setShowOnboarding(true);
    }
  }, [preferences.data, showTrialModal]);

  // Redirect admin users
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (prefs: Partial<UserPreferences>) => {
    try {
      await savePreferences.mutateAsync({
        ...prefs,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Onboarding save error:', error);
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Handle trial modal actions
  const handleTrialStart = () => {
    // Redirect to Stripe checkout with 7-day trial
    router.push('/subscribe/start?plan=monthly');
  };

  const handleTrialDismiss = () => {
    dismissTrial();
    setShowTrialModal(false);
    // Now onboarding can show if needed
  };

  // Handle welcome popup dismiss - then show trial modal
  const handleWelcomePopupDismiss = () => {
    setShowWelcomePopup(false);
    // Trial modal will show via the useEffect above if conditions are met
  };

  // Build hero slides
  const heroSlides = useMemo(() => {
    if (!courses) return [];

    const slides: Array<{
      id: string;
      title: string;
      description?: string;
      thumbnailUrl?: string;
      courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
      instructorName?: string;
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

    // Get instructor name helper
    const getInstructorName = (course: Course) => {
      if (!instructors || !course.instructorId) return undefined;
      const instructor = instructors.find(i => i.id === course.instructorId);
      return instructor?.name;
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
          instructorName: getInstructorName(enrolledCourse),
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
        instructorName: getInstructorName(latestMasterclass),
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
        instructorName: getInstructorName(latestWebinar),
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
        instructorName: getInstructorName(latestAcademia),
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
        instructorName: getInstructorName(latestPodcast),
        duration: latestPodcast.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(latestPodcast),
      });
    }

    return slides;
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
          courses: categoryCourses,
        };
      })
      .filter(row => row.courses.length > 0);
  }, [categories, courses]);

  // Always prepare a "Népszerű" section with top courses
  const popularCourses = useMemo(() => {
    if (!courses) return [];
    // Sort by enrollment count and take top 10
    return [...courses]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 10);
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
        courses: audienceCourses,
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

  // Check if any filters are active
  const hasActiveFilters = activeFilters.query || activeFilters.categoryId || activeFilters.audienceId;

  // Filter courses based on active filters
  const filteredCourses = useMemo(() => {
    if (!courses || !hasActiveFilters) return null;

    let results = [...courses];

    // Filter by search query
    if (activeFilters.query) {
      const searchLower = activeFilters.query.toLowerCase();
      results = results.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (activeFilters.categoryId) {
      results = results.filter(course => {
        if (course.categoryIds?.includes(activeFilters.categoryId!)) return true;
        if (course.category?.id === activeFilters.categoryId) return true;
        if ((course as any).categoryId === activeFilters.categoryId) return true;
        return false;
      });
    }

    // Filter by target audience
    if (activeFilters.audienceId) {
      results = results.filter(course =>
        course.targetAudienceIds?.includes(activeFilters.audienceId!)
      );
    }

    return results;
  }, [courses, hasActiveFilters, activeFilters]);

  // Handle filter change from search component
  const handleFilterChange = (filters: DashboardFilters) => {
    setActiveFilters(filters);
  };

  // Don't render for admin users
  if (user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-brand-secondary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
      </div>
    );
  }

  return (
    <>
      {/* Welcome Popup - Shows FIRST after registration */}
      {showWelcomePopup && (
        <WelcomePopup onDismiss={handleWelcomePopupDismiss} />
      )}

      {/* Free Trial Modal - Shows AFTER welcome popup is dismissed */}
      <FreeTrialModal
        open={showTrialModal}
        onOpenChange={setShowTrialModal}
        variant="dashboard"
        onStartTrial={handleTrialStart}
        onDismiss={handleTrialDismiss}
      />

      {/* Onboarding Wizard - Shows only if trial modal not showing */}
      {showOnboarding && !showTrialModal && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          initialData={preferences.data || undefined}
        />
      )}

      <div className="space-y-8">
        {/* Company Employee Banner */}
        {isCompanyEmployee && companyInfo && (
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
                  A(z) <span className="font-medium text-brand-secondary">{companyInfo.name}</span> tagjaként hozzáférsz az összes tartalomhoz
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-normal bg-brand-secondary/10 text-brand-secondary">
                <Star className="w-3 h-3 mr-1" />
                Prémium
              </span>
            </div>
          </div>
        )}

        {/* Hero Carousel */}
        {heroSlides.length > 0 && (
          <DashboardHeroCarousel slides={heroSlides} />
        )}

        {/* Search Bar */}
        <DashboardSearch className="my-2" onFilterChange={handleFilterChange} />

        {/* Filtered Results - shown when filters are active */}
        {hasActiveFilters && filteredCourses && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Találatok ({filteredCourses.length})
              </h2>
              <button
                onClick={() => setActiveFilters({ query: '', categoryId: null, audienceId: null })}
                className="text-sm text-brand-secondary hover:text-brand-secondary/80"
              >
                Szűrők törlése
              </button>
            </div>
            {filteredCourses.length > 0 ? (
              <CourseCarouselRow
                title=""
                courses={filteredCourses}
                categories={categories || []}
                instructors={instructors || []}
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">Nincs találat a szűrőknek megfelelő tartalom</p>
              </div>
            )}
          </div>
        )}

        {/* Regular content - hidden when filters are active */}
        {!hasActiveFilters && (
          <>
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
            viewAllLink="/courses"
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
            viewAllLink={`/courses?category=${category.id}`}
          />
        ))}

        {/* Fallback: All Courses if no categories matched */}
        {showFallbackSection && courses && (
          <CourseCarouselRow
            title="Felfedezés"
            courses={courses}
            categories={categories || []}
            instructors={instructors || []}
            viewAllLink="/courses"
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
            viewAllLink={`/courses?audience=${audience.id}`}
          />
        ))}


        {/* Empty State */}
        {heroSlides.length === 0 && enrolledCourses.length === 0 && (!courses || courses.length === 0) && (
          <div className="text-center py-16">
            <p className="text-gray-500">Nincs megjeleníthető tartalom</p>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
