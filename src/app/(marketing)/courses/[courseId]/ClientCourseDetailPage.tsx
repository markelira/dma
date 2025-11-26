'use client';

import { useRouter } from 'next/navigation';
import { useCourse } from '@/hooks/useCourseQueries';
import { useEnrollInCourse } from '@/hooks/useCourseQueries';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
import { motion } from "motion/react";
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useCourses } from '@/hooks/useCourseQueries';
import { getCourseTypeTerminology, getDefaultInstructorRole } from '@/lib/terminology';
import { CourseType } from '@/types';

export default function ClientCourseDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { user, isAuthenticated, authReady } = useAuthStore();
  const { data: course, isLoading, error } = useCourse(id);
  const enrollMutation = useEnrollInCourse();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const detailsRef = useRef<HTMLDivElement>(null);

  // Fetch instructors to get full instructor data
  const { data: instructors = [] } = useInstructors();

  // Fetch categories to map categoryIds to names
  const { data: categories = [] } = useCategories();

  // Fetch all courses for related courses section
  const { data: allCourses = [] } = useCourses();

  // Get category names from categoryIds - SUPPORTS MULTIPLE CATEGORIES
  const courseCategoryNames = useMemo(() => {
    if (!course) return [];

    const c = course;
    const categoryNames: string[] = [];

    // NEW: Support multiple categories via categoryIds array
    if (c.categoryIds && c.categoryIds.length > 0 && categories.length > 0) {
      c.categoryIds.forEach(catId => {
        const found = categories.find(cat => cat.id === catId);
        if (found) categoryNames.push(found.name);
      });

      if (categoryNames.length > 0) return categoryNames;
    }

    // Fallback to single category
    if (c.category && typeof c.category === 'object' && 'name' in c.category) {
      return [c.category.name];
    }

    if (c.category && typeof c.category === 'string') {
      return [c.category];
    }

    if (c.categoryId && categories.length > 0) {
      const found = categories.find(cat => cat.id === c.categoryId);
      if (found) return [found.name];
    }

    return ['Általános'];
  }, [course, categories]);

  // Fetch instructor data from instructors collection - SUPPORTS MULTIPLE INSTRUCTORS
  const courseInstructors = useMemo(() => {
    if (!course) return [];

    const c = course;
    const foundInstructors: any[] = [];

    // NEW: Support multiple instructors via instructorIds array
    if (c.instructorIds && c.instructorIds.length > 0 && instructors.length > 0) {
      c.instructorIds.forEach(instId => {
        const found = instructors.find(inst => inst.id === instId);
        if (found) foundInstructors.push(found);
      });

      if (foundInstructors.length > 0) return foundInstructors;
    }

    // Fallback to single instructorId
    if (c.instructorId && instructors.length > 0) {
      const found = instructors.find(inst => inst.id === c.instructorId);
      if (found) return [found];
    }

    // Fallback to legacy instructor data if available
    const legacyInstructor = c.instructor || {};
    if (legacyInstructor.firstName || legacyInstructor.lastName) {
      return [{
        id: c.instructorId || 'legacy',
        name: `${legacyInstructor.firstName || ''} ${legacyInstructor.lastName || ''}`.trim(),
        title: legacyInstructor.title,
        bio: legacyInstructor.bio,
        profilePictureUrl: legacyInstructor.profilePictureUrl,
        createdAt: '',
        updatedAt: ''
      }];
    }

    // Default fallback
    return [{
      id: 'default',
      name: c.instructorName || 'DMA Oktató',
      title: c.instructorTitle,
      bio: c.instructorBio || 'Tapasztalt oktató az ELIRA platformon.',
      profilePictureUrl: c.instructorImageUrl,
      createdAt: '',
      updatedAt: ''
    }];
  }, [course, instructors]);

  // Get related courses (same category or same instructor, excluding current course)
  const relatedCourses = useMemo(() => {
    if (!course || !allCourses || allCourses.length === 0) return [];

    return allCourses
      .filter(c => c.id !== course.id) // Exclude current course
      .filter(c => {
        // Match by category
        const hasSameCategory =
          (course.categoryIds && c.categoryIds && course.categoryIds.some(catId => c.categoryIds?.includes(catId))) ||
          (course.categoryId && c.categoryId === course.categoryId);

        // Match by instructor
        const hasSameInstructor =
          (course.instructorIds && c.instructorIds && course.instructorIds.some(instId => c.instructorIds?.includes(instId))) ||
          (course.instructorId && c.instructorId === course.instructorId);

        return hasSameCategory || hasSameInstructor;
      })
      .slice(0, 6); // Limit to 6 courses
  }, [course, allCourses]);

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

  // Enrollment handler - redirects to player immediately, enrolls in background
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect_to=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }

    // Get first lesson ID for redirect
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
        <div ref={detailsRef} className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-10 lg:py-12">
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
                <motion.section
                  className="py-6 border-b border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
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
                </motion.section>
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

              {/* Course Features Section */}
              <CourseFeaturesSection
                course={{
                  certificateEnabled: c.certificateEnabled,
                  duration: stats.duration,
                  language: c.language,
                  enrollmentCount: stats.students,
                  contentCreatedAt: c.contentCreatedAt
                }}
                darkMode={true}
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
              />
            </div>
          </div>
        </div>

        {/* Related Courses Section */}
        {relatedCourses.length > 0 && (
          <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] pb-10 lg:pb-12">
            <RelatedCoursesSection
              courses={relatedCourses}
              categories={categories}
              instructors={instructors}
              title="Kapcsolódó tartalmak"
              darkMode={true}
            />
          </div>
        )}

        {/* Subscription Required Modal */}
        <SubscriptionRequiredModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          courseName={c.title}
          returnTo={`/courses/${id}`}
        />

        {/* Sticky Bottom CTA (Mobile) */}
        <StickyBottomCTA
          courseTitle={c.title}
          onEnroll={handleEnroll}
          isEnrolled={false}
        />
      </div>

      <Footer border={true} />
    </AuthProvider>
  );
}
