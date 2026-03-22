'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Building2, Star, Play } from 'lucide-react';
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel';
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow';
import { DashboardSearch, DashboardFilters } from '@/components/dashboard/DashboardSearch';
import { EnrolledCourseCarousel } from '@/components/dashboard/EnrolledCourseCarousel';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FreeTrialModal } from '@/components/subscription/FreeTrialModal';
import { CompanyEmployeeNoAccessModal } from '@/components/subscription/CompanyEmployeeNoAccessModal';
import { WelcomePopup } from '@/components/dashboard/WelcomePopup';
import { useTrialPopup } from '@/hooks/useTrialPopup';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useTargetAudiences } from '@/hooks/useTargetAudienceQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useGamificationData, useSaveUserPreferences } from '@/hooks/useGamification';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { UserPreferences, Course } from '@/types';
import { sortByContentCreatedAt } from '@/lib/carouselUtils';
import { shuffleArray } from '@/lib/utils';

// Performance: Max cards per carousel (reduced from 10)
const MAX_CAROUSEL_CARDS = 6;

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
  const { user, authReady } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Data hooks
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: targetAudiences, isLoading: audiencesLoading } = useTargetAudiences();
  const { data: instructors, isLoading: instructorsLoading } = useInstructors();
  // Performance: Lift subscription check to page level (was per-card before)
  const { data: subscriptionData } = useSubscriptionStatus();
  const isSubscribed = subscriptionData?.isActive ?? false;

  const { preferences } = useGamificationData();
  const savePreferences = useSaveUserPreferences();

  // Trial popup state
  const { shouldShowForAuthUser, dismiss: dismissTrial, hasActiveSubscription, hasUsedTrial, isLoading: subscriptionLoading, subscriptionFetched } = useTrialPopup();
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showCompanyNoAccessModal, setShowCompanyNoAccessModal] = useState(false);

  // Welcome popup state (shows first after registration)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; id: string } | null>(null);

  // Filter state for search - now with arrays for multi-select
  const [activeFilters, setActiveFilters] = useState<DashboardFilters>({
    query: '',
    categoryIds: [],
    audienceIds: [],
    courseTypes: [],
    instructorIds: [],
  });

  // Shuffle seed - changes on each mount to force re-shuffle even with cached data
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => {
    setShuffleSeed(Date.now());
  }, []);

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

  // Track whether we've already done the delayed refetch for company employees
  const employeeRefetchDone = useRef(false);

  // Check if trial popup should show (AFTER welcome popup is dismissed)
  // Company employees see different modal if company has no subscription
  // IMPORTANT: Wait for BOTH authReady AND subscription status to avoid race condition
  // (authReady ensures companyId is loaded from Firestore before showing modal)
  // Also wait for subscriptionFetched to prevent modal flash when isLoading becomes false
  // before data arrives (fixes "subscription not active" flash for active subscribers)
  useEffect(() => {
    // Don't show any modals while auth or subscription status is still loading
    // subscriptionFetched ensures we have actually received data from the Cloud Function
    if (!authReady || subscriptionLoading || !subscriptionFetched) return;

    if (!showWelcomePopup && !hasActiveSubscription) {
      if (isCompanyEmployee) {
        // Company employee without company subscription
        // Race condition fix: Stripe webhook may not have updated Firestore yet.
        // Wait 5 seconds and refetch subscription status before showing modal.
        if (!employeeRefetchDone.current) {
          employeeRefetchDone.current = true;
          const timer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
          }, 5000);
          return () => clearTimeout(timer);
        }
        // After refetch, if still no subscription, show modal (once per session)
        const dismissed = sessionStorage.getItem('companyNoAccessDismissed') === 'true';
        if (!dismissed) {
          setShowCompanyNoAccessModal(true);
        }
      } else if (shouldShowForAuthUser) {
        // Regular user - show trial modal
        setShowTrialModal(true);
      }
    }
  }, [authReady, shouldShowForAuthUser, isCompanyEmployee, hasActiveSubscription, showWelcomePopup, subscriptionLoading, subscriptionFetched, queryClient]);

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

  // Build hero slides - 5 random courses NOT on user's list
  const heroSlides = useMemo(() => {
    if (!courses || courses.length === 0) return [];

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

    // If no non-enrolled courses, return empty (hero won't show)
    if (nonEnrolledCourses.length === 0) return [];

    // Shuffle courses randomly and take 5 for hero
    const randomCourses = shuffleArray(nonEnrolledCourses).slice(0, 5);

    return randomCourses.map(course => {
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        courseType: course.courseType as 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | undefined,
        duration: course.duration,
        isEnrolled: false,
        firstLessonId: getFirstLessonId(course),
      };
    });
  }, [courses, enrollments, shuffleSeed]);

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

  // Build category rows - shuffled for variety
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
  }, [categories, courses, shuffleSeed]);

  // Always prepare a "Felkapott" section with courses (fully shuffled for variety)
  const popularCourses = useMemo(() => {
    if (!courses) return [];
    return shuffleArray([...courses]).slice(0, MAX_CAROUSEL_CARDS);
  }, [courses, shuffleSeed]);

  // Newest courses (for "Legújabb tartalmak" section)
  const newestCourses = useMemo(() => {
    if (!courses) return [];
    return sortByContentCreatedAt(courses).slice(0, MAX_CAROUSEL_CARDS);
  }, [courses]);

  // Check if we need to show a fallback "Felfedezés" section
  const showFallbackSection = useMemo(() => {
    // Show fallback if we have courses but no category/audience rows matched
    return courses && courses.length > 0 && categoryRows.length === 0;
  }, [courses, categoryRows]);

  // Build target audience rows (top 2 most popular) - shuffled for variety
  const audienceRows = useMemo(() => {
    if (!targetAudiences || !courses) return [];

    const audienceCounts = targetAudiences.map(audience => {
      const audienceCourses = courses.filter(course => course.targetAudienceIds?.includes(audience.id));
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
  }, [targetAudiences, courses, shuffleSeed]);

  // Memoize course type rows to prevent re-shuffling on every render
  const courseTypeRows = useMemo(() => {
    if (!courses) return [];

    const typeLabels: Record<string, string> = {
      'WEBINAR': 'Webinár',
      'ACADEMIA': 'Akadémia',
      'MASTERCLASS': 'Masterclass',
      'PODCAST': 'Podcast'
    };

    return ['WEBINAR', 'ACADEMIA', 'MASTERCLASS', 'PODCAST']
      .map(type => {
        const typeCourses = shuffleArray(courses.filter(c => c.courseType === type));
        return {
          type,
          label: typeLabels[type],
          courses: typeCourses,
        };
      })
      .filter(row => row.courses.length > 0);
  }, [courses, shuffleSeed]);

  const isLoading = enrollmentsLoading || coursesLoading || categoriesLoading || audiencesLoading || instructorsLoading;

  // Check if any filters are active (now with arrays)
  const hasActiveFilters = activeFilters.query || activeFilters.categoryIds.length > 0 || activeFilters.audienceIds.length > 0 || activeFilters.courseTypes.length > 0 || activeFilters.instructorIds.length > 0;

  // Filter courses based on active filters (with multi-select OR logic)
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

    // Filter by categories (OR logic for multi-select)
    if (activeFilters.categoryIds.length > 0) {
      results = results.filter(course => {
        return activeFilters.categoryIds.some(catId => {
          if (course.categoryIds?.includes(catId)) return true;
          if (course.category?.id === catId) return true;
          if ((course as any).categoryId === catId) return true;
          return false;
        });
      });
    }

    // Filter by target audiences (OR logic for multi-select)
    if (activeFilters.audienceIds.length > 0) {
      results = results.filter(course =>
        activeFilters.audienceIds.some(audId => course.targetAudienceIds?.includes(audId))
      );
    }

    // Filter by course types (OR logic for multi-select)
    if (activeFilters.courseTypes.length > 0) {
      results = results.filter(course =>
        activeFilters.courseTypes.includes(course.courseType)
      );
    }

    // Filter by instructors (OR logic for multi-select)
    if (activeFilters.instructorIds.length > 0) {
      results = results.filter(course =>
        activeFilters.instructorIds.some(instId =>
          (course as any).instructorId === instId ||
          (course as any).instructorIds?.includes(instId)
        )
      );
    }

    // Sort by enrollment count (most popular first)
    return results.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
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

      {/* Free Trial Modal - Shows AFTER welcome popup is dismissed (regular users only) */}
      <FreeTrialModal
        open={showTrialModal}
        onOpenChange={setShowTrialModal}
        variant="dashboard"
        onStartTrial={handleTrialStart}
        onDismiss={handleTrialDismiss}
        hasUsedTrial={hasUsedTrial}
      />

      {/* Company Employee No Access Modal - for company employees without company subscription */}
      <CompanyEmployeeNoAccessModal
        open={showCompanyNoAccessModal}
        onOpenChange={(open) => {
          setShowCompanyNoAccessModal(open);
          if (!open) {
            sessionStorage.setItem('companyNoAccessDismissed', 'true');
          }
        }}
        companyId={user?.companyId}
        employeeName={user?.firstName ? `${user.lastName || ''} ${user.firstName}`.trim() : undefined}
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
                enrollments={enrollments || []}
                isSubscribed={isSubscribed}
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
            {/* Felkapott tartalmak - most popular */}
        {popularCourses.length > 0 && (
          <CourseCarouselRow
            title="Felkapott tartalmak"
            courses={popularCourses}
            categories={categories || []}
            instructors={instructors || []}
            enrollments={enrollments || []}
            isSubscribed={isSubscribed}
            viewAllLink="/courses"
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
            isSubscribed={isSubscribed}
          />
        )}

        {/* Kaland folytatása - Only in-progress courses, no icon */}
        {enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100)).length > 0 && (
          <EnrolledCourseCarousel
            title="Kaland folytatása"
            enrollments={enrichedEnrollments.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100))}
            courses={courses || []}
            categories={categories || []}
            instructors={instructors || []}
            userId={user?.uid}
            isSubscribed={isSubscribed}
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
            isSubscribed={isSubscribed}
            viewAllLink={`/courses?category=${category.id}`}
          />
        ))}

        {/* Fallback: All Courses if no categories matched - shuffled for variety */}
        {showFallbackSection && courses && (
          <CourseCarouselRow
            title="Felfedezés"
            courses={shuffleArray([...courses]).slice(0, MAX_CAROUSEL_CARDS)}
            categories={categories || []}
            instructors={instructors || []}
            enrollments={enrollments || []}
            isSubscribed={isSubscribed}
            viewAllLink="/courses"
          />
        )}

        {/* Target Audience Carousels (Top 2) */}
        {audienceRows.map(({ audience, courses: audienceCourses }) => (
          <CourseCarouselRow
            key={audience.id}
            title={audience.name}
            courses={audienceCourses.slice(0, MAX_CAROUSEL_CARDS)}
            categories={categories || []}
            instructors={instructors || []}
            enrollments={enrollments || []}
            isSubscribed={isSubscribed}
            viewAllLink={`/courses?audience=${audience.id}`}
          />
        ))}

        {/* Course Type Carousels */}
        {courseTypeRows.map(({ type, label, courses: typeCourses }) => (
          <CourseCarouselRow
            key={type}
            title={label}
            courses={typeCourses.slice(0, MAX_CAROUSEL_CARDS)}
            categories={categories || []}
            instructors={instructors || []}
            enrollments={enrollments || []}
            isSubscribed={isSubscribed}
            viewAllLink={`/dashboard/${type.toLowerCase()}`}
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
