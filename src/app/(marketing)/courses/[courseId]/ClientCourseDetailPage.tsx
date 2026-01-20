'use client';

import { useRouter } from 'next/navigation';
import { useCourse } from '@/hooks/useCourseQueries';
import { useEnrollInCourse } from '@/hooks/useCourseQueries';
import { useSearchParams } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React, { useState, useMemo, useRef } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import Footer from '@/components/landing-home/ui/footer';
import { NetflixStyleHero } from '@/components/course/heroes/NetflixStyleHero';
import { CourseTypeInfo } from '@/components/course/CourseTypeInfo';
import { CourseCurriculumSection } from '@/components/course/CourseCurriculumSection';
import { CourseInstructorCard } from '@/components/course/CourseInstructorCard';
import { CourseFeaturesSection } from '@/components/course/CourseFeaturesSection';
import { RelatedCoursesSection } from '@/components/course/RelatedCoursesSection';
import { StickyBottomCTA } from '@/components/course/StickyBottomCTA';
import { CourseEnrollmentCard } from '@/components/course/CourseEnrollmentCard';
import { SubscriptionRequiredModal } from '@/components/payment/SubscriptionRequiredModal';
import { FreeTrialModal } from '@/components/subscription/FreeTrialModal';
import { CompanyEmployeeNoAccessModal } from '@/components/subscription/CompanyEmployeeNoAccessModal';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { motion } from "motion/react";
import { CheckCircle, ArrowRight } from 'lucide-react';
import { getCourseTypeTerminology, getDefaultInstructorRole } from '@/lib/terminology';
import { CourseType } from '@/types';

export default function ClientCourseDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { user, isAuthenticated, authReady } = useAuthStore();
  const { data: course, isLoading, error } = useCourse(id);
  const enrollMutation = useEnrollInCourse();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showCompanyNoAccessModal, setShowCompanyNoAccessModal] = useState(false);
  const [trialVariant, setTrialVariant] = useState<'course-auth' | 'course-unauth'>('course-auth');

  // Check if user is company employee (they have companyId and companyRole 'employee')
  const isCompanyEmployee = !!(user?.companyId && user?.companyRole === 'employee');
  const { data: subscription, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const detailsRef = useRef<HTMLDivElement>(null);

  // Fetch only the instructors for this course (targeted query)
  const { data: courseInstructors = [] } = useQuery({
    queryKey: ['course-instructors', course?.instructorIds, course?.instructorId],
    queryFn: async () => {
      if (!course) return [];

      // Get instructor IDs from course
      const instructorIds = course.instructorIds?.length
        ? course.instructorIds
        : course.instructorId
          ? [course.instructorId]
          : [];

      if (instructorIds.length === 0) {
        // Fallback to legacy instructor data if available
        const legacyInstructor = course.instructor || {};
        if (legacyInstructor.firstName || legacyInstructor.lastName) {
          return [{
            id: course.instructorId || 'legacy',
            name: `${legacyInstructor.firstName || ''} ${legacyInstructor.lastName || ''}`.trim(),
            title: legacyInstructor.title,
            bio: legacyInstructor.bio,
            profilePictureUrl: legacyInstructor.profilePictureUrl,
          }];
        }
        // Default fallback
        return [{
          id: 'default',
          name: course.instructorName || 'DMA Oktató',
          title: course.instructorTitle,
          bio: course.instructorBio || 'Tapasztalt oktató az ELIRA platformon.',
          profilePictureUrl: course.instructorImageUrl,
        }];
      }

      // Fetch only the instructors we need
      const instructorDocs = await Promise.all(
        instructorIds.map(instId => getDoc(doc(db, 'users', instId)))
      );

      const fetchedInstructors = instructorDocs
        .filter(d => d.exists())
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data?.name || `${data?.firstName || ''} ${data?.lastName || ''}`.trim() || 'Ismeretlen',
            title: data?.title,
            bio: data?.bio,
            profilePictureUrl: data?.profilePictureUrl,
            role: data?.role,
          };
        });

      return fetchedInstructors.length > 0 ? fetchedInstructors : [{
        id: 'default',
        name: course.instructorName || 'DMA Oktató',
        title: course.instructorTitle,
        bio: course.instructorBio || 'Tapasztalt oktató az ELIRA platformon.',
        profilePictureUrl: course.instructorImageUrl,
      }];
    },
    enabled: !!course,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch only the categories for this course (targeted query)
  const { data: courseCategories = [] } = useQuery({
    queryKey: ['course-categories', course?.categoryIds, course?.categoryId],
    queryFn: async () => {
      if (!course) return [];

      // Get category IDs from course
      const categoryIds = course.categoryIds?.length
        ? course.categoryIds
        : course.categoryId
          ? [course.categoryId]
          : [];

      if (categoryIds.length === 0) {
        // Fallback to legacy category data
        if (course.category && typeof course.category === 'object' && 'name' in course.category) {
          return [{ id: 'legacy', name: (course.category as any).name }];
        }
        if (course.category && typeof course.category === 'string') {
          return [{ id: 'legacy', name: course.category }];
        }
        return [];
      }

      // Fetch only the categories we need
      const categoryDocs = await Promise.all(
        categoryIds.map(catId => getDoc(doc(db, 'categories', catId)))
      );

      return categoryDocs
        .filter(d => d.exists())
        .map(d => ({
          id: d.id,
          name: d.data()?.name || 'Kategória',
        }));
    },
    enabled: !!course,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Get category names from fetched categories
  const courseCategoryNames = useMemo(() => {
    if (courseCategories.length > 0) {
      return courseCategories.map(cat => cat.name);
    }
    // Fallback to legacy category string if no categories fetched
    if (course?.category && typeof course.category === 'string') {
      return [course.category];
    }
    return ['Általános'];
  }, [courseCategories, course?.category]);

  // Fetch related courses (targeted query - only 7 courses max)
  const { data: relatedCourses = [] } = useQuery({
    queryKey: ['related-courses', course?.id, course?.categoryIds, course?.categoryId],
    queryFn: async () => {
      if (!course) return [];

      // Get the primary category for finding related courses
      const primaryCategoryId = course.categoryIds?.[0] || course.categoryId;

      if (!primaryCategoryId) return [];

      try {
        // Query for courses in the same category
        const relatedQuery = query(
          collection(db, 'courses'),
          where('status', '==', 'PUBLISHED'),
          where('categoryIds', 'array-contains', primaryCategoryId),
          limit(7) // Fetch 7 to have room after excluding current
        );

        const snap = await getDocs(relatedQuery);
        const courses = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(c => c.id !== course.id) // Exclude current course
          .slice(0, 6);

        // If we don't have enough, try a fallback query with categoryId field
        if (courses.length < 3) {
          const fallbackQuery = query(
            collection(db, 'courses'),
            where('status', '==', 'PUBLISHED'),
            where('categoryId', '==', primaryCategoryId),
            limit(7)
          );
          const fallbackSnap = await getDocs(fallbackQuery);
          const fallbackCourses = fallbackSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .filter(c => c.id !== course.id && !courses.some(existing => existing.id === c.id));

          courses.push(...fallbackCourses.slice(0, 6 - courses.length));
        }

        return courses.slice(0, 6);
      } catch (error) {
        console.error('Error fetching related courses:', error);
        return [];
      }
    },
    enabled: !!course && !!(course.categoryIds?.[0] || course.categoryId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get unique category IDs from related courses for displaying category badges
  const relatedCoursesCategoryIds = useMemo(() => {
    const categoryIds = new Set<string>();
    relatedCourses.forEach(c => {
      if (c.categoryIds) c.categoryIds.forEach((id: string) => categoryIds.add(id));
      if (c.categoryId) categoryIds.add(c.categoryId);
    });
    return Array.from(categoryIds);
  }, [relatedCourses]);

  // Fetch categories needed for related courses display
  const { data: relatedCoursesCategories = [] } = useQuery({
    queryKey: ['related-courses-categories', relatedCoursesCategoryIds],
    queryFn: async () => {
      if (relatedCoursesCategoryIds.length === 0) return [];

      const categoryDocs = await Promise.all(
        relatedCoursesCategoryIds.map(catId => getDoc(doc(db, 'categories', catId)))
      );

      return categoryDocs
        .filter(d => d.exists())
        .map(d => ({
          id: d.id,
          name: d.data()?.name || 'Kategória',
        }));
    },
    enabled: relatedCoursesCategoryIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  // Handle payment success/cancel
  React.useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success) {
      toast.success('Sikeres beiratkozás! A tartalomhoz hozzáférsz.');
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      router.replace(`/courses/${id}`);
    } else if (canceled) {
      toast.error('A fizetés megszakítva.');
      router.replace(`/courses/${id}`);
    }
  }, [searchParams, id, queryClient, router]);

  // Scroll to details section
  const scrollToDetails = () => {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-700 border-t-white" />
            <p className="text-base font-normal text-gray-400">Tartalom betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </AuthProvider>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Tartalom nem található</h1>
            <p className="text-base font-normal text-gray-400 mb-6">
              A keresett tartalom nem létezik vagy nem elérhető.
            </p>
            <button
              onClick={() => router.push('/courses')}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
            >
              Vissza a tartalmakhoz
            </button>
          </div>
        </div>
        <Footer border={true} />
      </AuthProvider>
    );
  }

  // Process course data
  const c = course;
  const modulesData = Array.isArray(c.modules) ? c.modules : [];
  const lessonsData = modulesData.flatMap(mod => Array.isArray(mod.lessons) ? mod.lessons : []);

  // Get course type-specific terminology
  const courseType = (c.courseType || c.type || 'ACADEMIA') as CourseType;
  const terminology = getCourseTypeTerminology(courseType);
  const defaultInstructorRole = getDefaultInstructorRole(courseType);

  // Calculate course stats
  const stats = {
    modules: modulesData.length,
    lessons: lessonsData.length,
    students: c.enrollmentCount || c.students || 0,
    rating: c.averageRating || c.rating || 4.5,
    duration: c.duration
  };

  // Course pricing
  const isFreeCourse = !c.price || c.price === 0;
  const coursePrice = c.price || 0;

  // Prepare modules for curriculum section (includes Netflix episode data)
  const formattedModules = modulesData.map((module: any, index) => ({
    id: module.id || `module-${index}`,
    title: module.title || `Modul ${index + 1}`,
    description: module.description,
    duration: module.duration,
    lessons: (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
      id: lesson.id || `lesson-${index}-${lessonIndex}`,
      title: lesson.title || `Lecke ${lessonIndex + 1}`,
      description: lesson.description, // For Netflix episode description
      duration: lesson.duration,
      durationSeconds: lesson.durationSeconds || lesson.duration, // Duration in seconds
      muxDuration: lesson.muxDuration, // Mux-reported duration (more accurate)
      muxThumbnailUrl: lesson.muxThumbnailUrl, // Video thumbnail from Mux
      muxPlaybackId: lesson.muxPlaybackId, // Mux playback ID
      type: lesson.type || 'video',
      completed: lesson.completed || false,
      locked: lesson.locked || false,
      preview: lesson.preview || lessonIndex === 0 // First lesson is preview
    }))
  }));

  // Helper to get first lesson ID from subcollection
  const getFirstLessonId = async (courseId: string): Promise<string | undefined> => {
    try {
      const lessonsRef = collection(db, 'courses', courseId, 'lessons');
      const q = query(lessonsRef, orderBy('order', 'asc'), limit(1));
      const snap = await getDocs(q);
      return snap.docs[0]?.id;
    } catch (error) {
      console.error('Error fetching first lesson:', error);
      return undefined;
    }
  };

  // Enrollment handler - PROACTIVELY shows trial modal if no subscription
  const handleEnroll = async () => {
    // SCENARIO 1: Unauthenticated - show trial popup with unauth variant
    if (!isAuthenticated) {
      setTrialVariant('course-unauth');
      setShowTrialModal(true);
      return;
    }

    // SCENARIO 2: Authenticated but no subscription
    if (!subscription?.isActive) {
      // Company employees see different modal (they can't pay, must contact admin)
      if (isCompanyEmployee) {
        setShowCompanyNoAccessModal(true);
        return;
      }
      // Regular users see trial popup
      setTrialVariant('course-auth');
      setShowTrialModal(true);
      return;
    }

    // SCENARIO 3: Has subscription - proceed to player
    const firstLessonId = await getFirstLessonId(id);
    const playerUrl = firstLessonId
      ? `/courses/${id}/player/${firstLessonId}`
      : `/courses/${id}`;

    // Redirect immediately to player
    router.push(playerUrl);

    // Enroll in background (don't await)
    enrollMutation.mutate(id, {
      onSuccess: (data) => {
        if (!data.alreadyEnrolled) {
          toast.success('Sikeres beiratkozás!');
        }
      },
      onError: (error: any) => {
        console.error('Enrollment failed:', error);

        // Check if error is subscription required
        if (error.code === 'SUBSCRIPTION_REQUIRED' || error.message?.includes('SUBSCRIPTION_REQUIRED')) {
          setShowSubscriptionModal(true);
        } else {
          // Silent retry on other errors
          setTimeout(() => enrollMutation.mutate(id), 2000);
        }
      }
    });
  };

  // Handle trial modal actions
  const handleTrialStart = () => {
    if (trialVariant === 'course-unauth') {
      // Store return URL, redirect to auth with trial flag
      sessionStorage.setItem('trialReturnTo', `/courses/${id}`);
      router.push(`/login?redirect_to=${encodeURIComponent(`/courses/${id}`)}&trial=true`);
    } else {
      // Authenticated user - go to Stripe checkout
      router.push(`/subscribe/start?plan=monthly&returnTo=${encodeURIComponent(`/courses/${id}`)}`);
    }
  };

  const handleTrialDismiss = () => {
    setShowTrialModal(false);
  };

  const courseFeatures = [
    `${stats.lessons} ${terminology.lessonsLabel.toLowerCase()}`,
    'Élethosszig tartó hozzáférés',
    'Letölthető anyagok',
    'Mobil hozzáférés'
  ];

  return (
    <AuthProvider>
      <FramerNavbarWrapper />

      <div className="min-h-screen bg-gray-950">
        {/* Netflix-Style Hero Section */}
        <NetflixStyleHero
          title={c.title}
          description={c.description || ''}
          categories={courseCategoryNames}
          imageUrl={c.thumbnailUrl || c.imageUrl}
          courseType={c.courseType}
          instructors={courseInstructors}
          modules={modulesData}
          onEnroll={handleEnroll}
          onScrollToDetails={scrollToDetails}
        />

        {/* Main Content */}
        <div ref={detailsRef} className="relative z-10 w-full mx-auto max-w-[1440px] 2xl:max-w-[1800px] 3xl:max-w-[2400px] px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 2xl:px-24 py-8 sm:py-10 lg:py-12">
          {/* Course Type Info - Type-specific details */}
          <CourseTypeInfo
            courseType={courseType}
            webinarDate={c.webinarDate}
            liveStreamUrl={c.liveStreamUrl}
            recordingAvailable={c.recordingAvailable}
            university={c.university || c.instructorUniversity}
            certificateEnabled={c.certificateEnabled}
            isPlus={c.isPlus}
            darkMode={true}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* What You'll Learn Section */}
              {c.whatYouWillLearn && c.whatYouWillLearn.length > 0 && (
                <section className="py-6 border-b border-gray-800">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {terminology.outcomesLabel}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {c.whatYouWillLearn.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Curriculum Section - Netflix-style episode layout */}
              {formattedModules.length > 0 && (
                <CourseCurriculumSection
                  modules={formattedModules}
                  totalLessons={stats.lessons}
                  totalDuration={stats.duration}
                  sectionTitle={terminology.curriculumLabel}
                  lessonLabel={terminology.lessonLabel}
                  lessonsLabel={terminology.lessonsLabel}
                  flatLessonMode={courseType !== 'ACADEMIA'}
                  darkMode={true}
                  netflixStyle={true}
                  courseThumbnail={c.thumbnailUrl || c.imageUrl}
                />
              )}

              {/* Requirements Section */}
              {c.requirements && c.requirements.length > 0 && (
                <motion.section
                  className="py-6 border-b border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Előfeltételek
                  </h2>
                  <ul className="space-y-3">
                    {c.requirements.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-gray-500 mt-1">•</span>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* Target Audience Section */}
              {c.targetAudience && c.targetAudience.length > 0 && (
                <motion.section
                  className="py-6 border-b border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Kinek ajánlott ez a tartalom?
                  </h2>
                  <div className="space-y-3">
                    {c.targetAudience.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Course Features Section - Hidden for subscribers */}
              <CourseFeaturesSection
                course={{
                  certificateEnabled: c.certificateEnabled,
                  duration: stats.duration,
                  language: c.language,
                  enrollmentCount: stats.students,
                  contentCreatedAt: c.contentCreatedAt
                }}
                darkMode={true}
                isSubscriber={subscription?.isActive || false}
              />

              {/* Instructor Card(s) - Supports multiple instructors */}
              {courseInstructors.map((instructor, idx) => (
                <CourseInstructorCard
                  key={instructor.id || idx}
                  name={instructor.name}
                  title={instructor.title}
                  bio={instructor.bio || 'Tapasztalt előadó a DMA Masterclass platformon.'}
                  imageUrl={instructor.profilePictureUrl}
                  expertise={c.tags || ['Üzleti fejlődés', 'Soft skills', 'Szakmai képzés']}
                  roleLabel={terminology.instructorLabel}
                  instructorRole={instructor.role as 'MENTOR' | 'SZEREPLŐ' | undefined}
                  darkMode={true}
                />
              ))}

              {/* FAQ Section */}
              {c.faq && c.faq.length > 0 && (
                <motion.section
                  className="py-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Gyakran Ismételt Kérdések
                  </h2>
                  <div className="space-y-4">
                    {c.faq.map((item: { question: string; answer: string }, index: number) => (
                      <details
                        key={index}
                        className="group border border-gray-700 rounded-lg overflow-hidden"
                      >
                        <summary className="cursor-pointer list-none p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">
                              {item.question}
                            </h3>
                            <svg
                              className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </summary>
                        <div className="p-4 bg-gray-900 border-t border-gray-700">
                          <p className="text-gray-300 whitespace-pre-line">
                            {item.answer}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right Column - Enrollment Card */}
            <div className="lg:col-span-1">
              <CourseEnrollmentCard
                price={coursePrice}
                originalPrice={c.originalPrice}
                duration={stats.duration}
                lessons={stats.lessons}
                rating={stats.rating}
                students={stats.students}
                lifetimeAccess={true}
                onEnroll={handleEnroll}
                isEnrolled={false}
                thumbnailUrl={c.thumbnailUrl || c.imageUrl}
                courseTitle={c.title}
                courseType={courseType}
                darkMode={true}
                isSubscriber={subscription?.isActive || false}
              />
            </div>
          </div>
        </div>

        {/* Related Courses Section */}
        {relatedCourses.length > 0 && (
          <div className="w-full mx-auto max-w-[1440px] 2xl:max-w-[1800px] 3xl:max-w-[2400px] px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 2xl:px-24 pb-8 sm:pb-10 lg:pb-12">
            <RelatedCoursesSection
              courses={relatedCourses}
              categories={relatedCoursesCategories}
              title="Kapcsolódó tartalmak"
              darkMode={true}
            />
          </div>
        )}

        {/* Free Trial Modal - Only for non-subscribers (not company employees) */}
        {!subscription?.isActive && !isCompanyEmployee && (
          <FreeTrialModal
            open={showTrialModal}
            onOpenChange={setShowTrialModal}
            variant={trialVariant}
            courseName={c.title}
            onStartTrial={handleTrialStart}
            onDismiss={handleTrialDismiss}
          />
        )}

        {/* Company Employee No Access Modal - for company employees without company subscription */}
        {/* Wait for authReady to ensure companyId is loaded from Firestore */}
        {authReady && isCompanyEmployee && !subscription?.isActive && (
          <CompanyEmployeeNoAccessModal
            open={showCompanyNoAccessModal}
            onOpenChange={setShowCompanyNoAccessModal}
            companyId={user?.companyId}
            employeeName={user?.firstName ? `${user.lastName || ''} ${user.firstName}`.trim() : undefined}
          />
        )}

        {/* Subscription Required Modal - Fallback for errors (not for company employees) */}
        {!subscription?.isActive && !isCompanyEmployee && (
          <SubscriptionRequiredModal
            open={showSubscriptionModal}
            onOpenChange={setShowSubscriptionModal}
            courseName={c.title}
            returnTo={`/courses/${id}`}
          />
        )}

        {/* Sticky Bottom CTA (Mobile) - Only for non-subscribers */}
        {!subscription?.isActive && (
          <StickyBottomCTA
            courseTitle={c.title}
            courseType={courseType}
            onEnroll={handleEnroll}
            isEnrolled={false}
          />
        )}
      </div>

      <Footer border={true} />
    </AuthProvider>
  );
}
