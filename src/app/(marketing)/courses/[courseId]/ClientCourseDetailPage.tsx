'use client';

import { useRouter } from 'next/navigation';
import { useCourse } from '@/hooks/useCourseQueries';
import { useEnrollInCourse } from '@/hooks/useCourseQueries';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import React, { useState, useMemo } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import Footer from '@/components/landing-home/ui/footer';
import { Hero1ConversionFocused } from '@/components/course/heroes/Hero1ConversionFocused';
import { CourseCurriculumSection } from '@/components/course/CourseCurriculumSection';
import { CourseInstructorCard } from '@/components/course/CourseInstructorCard';
import { CourseFeaturesSection } from '@/components/course/CourseFeaturesSection';
import { CourseOutcomesSection } from '@/components/course/CourseOutcomesSection';
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

  // Loading state
  if (isLoading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-200 border-t-blue-600" />
            <p className="text-lg text-gray-600">Tartalom betöltése...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tartalom nem található</h1>
            <p className="text-gray-600 mb-6">
              A keresett tartalom nem létezik vagy nem elérhető.
            </p>
            <button
              onClick={() => router.push('/courses')}
              className="px-6 py-3 bg-gradient-to-t from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-md transition-all"
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

  // Prepare modules for curriculum section
  const formattedModules = modulesData.map((module: any, index) => ({
    id: module.id || `module-${index}`,
    title: module.title || `Modul ${index + 1}`,
    description: module.description,
    duration: module.duration,
    lessons: (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
      id: lesson.id || `lesson-${index}-${lessonIndex}`,
      title: lesson.title || `Lecke ${lessonIndex + 1}`,
      duration: lesson.duration,
      type: lesson.type || 'video',
      completed: lesson.completed || false,
      locked: lesson.locked || false,
      preview: lesson.preview || lessonIndex === 0 // First lesson is preview
    }))
  }));

  // Enrollment handler
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect_to=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }

    try {
      const result = await enrollMutation.mutateAsync(id);
      if (result.alreadyEnrolled) {
        toast.info('Már beiratkozott erre a tartalomra!');
      } else {
        toast.success('Sikeres beiratkozás!');
      }
      router.push('/dashboard/courses');
    } catch (error: any) {
      console.error('Enrollment failed:', error);

      // Check if error is subscription required
      if (error.code === 'SUBSCRIPTION_REQUIRED' || error.message.includes('SUBSCRIPTION_REQUIRED')) {
        setShowSubscriptionModal(true);
      } else {
        toast.error(error.message || 'Hiba történt a beiratkozáskor. Próbálja újra.');
      }
    }
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        {/* Hero Section */}
        <Hero1ConversionFocused
          title={c.title}
          description={c.description || ''}
          categories={courseCategoryNames}
          imageUrl={c.thumbnailUrl || c.imageUrl}
          courseType={c.courseType}
          instructors={courseInstructors}
          keyOutcomes={c.whatYouWillLearn?.slice(0, 3)}
          modules={modulesData}
          price={coursePrice}
          isSubscriptionIncluded={isFreeCourse || !coursePrice}
          onEnroll={handleEnroll}
          onPreview={() => console.log('Preview clicked')}
        />

        {/* Main Content */}
        <div className="container mx-auto px-6 lg:px-12 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* What You'll Learn Section */}
              {c.whatYouWillLearn && c.whatYouWillLearn.length > 0 && (
                <motion.section
                  className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {terminology.outcomesLabel}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {c.whatYouWillLearn.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Curriculum Section */}
              {formattedModules.length > 0 && (
                <CourseCurriculumSection
                  modules={formattedModules}
                  totalLessons={stats.lessons}
                  totalDuration={stats.duration}
                  sectionTitle={terminology.curriculumLabel}
                  lessonLabel={terminology.lessonLabel}
                  lessonsLabel={terminology.lessonsLabel}
                  flatLessonMode={courseType !== 'ACADEMIA'}
                />
              )}

              {/* Requirements Section */}
              {c.requirements && c.requirements.length > 0 && (
                <motion.section
                  className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Előfeltételek
                  </h2>
                  <ul className="space-y-3">
                    {c.requirements.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-gray-400 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* Target Audience Section */}
              {c.targetAudience && c.targetAudience.length > 0 && (
                <motion.section
                  className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Kinek ajánlott ez a tartalom?
                  </h2>
                  <div className="space-y-3">
                    {c.targetAudience.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Course Features Section */}
              <CourseFeaturesSection />

              {/* Course Outcomes Section */}
              {c.whatYouWillLearn && c.whatYouWillLearn.length > 0 && (
                <CourseOutcomesSection outcomes={c.whatYouWillLearn} />
              )}

              {/* Instructor Card(s) - Supports multiple instructors */}
              {courseInstructors.map((instructor, idx) => (
                <CourseInstructorCard
                  key={instructor.id || idx}
                  name={instructor.name}
                  title={instructor.title}
                  bio={instructor.bio || 'Tapasztalt előadó az Academion platformon.'}
                  imageUrl={instructor.profilePictureUrl}
                  expertise={c.tags || ['Üzleti fejlődés', 'Soft skills', 'Szakmai képzés']}
                  roleLabel={terminology.instructorLabel}
                  instructorRole={instructor.role as 'MENTOR' | 'SZEREPLŐ' | undefined}
                />
              ))}

              {/* FAQ Section */}
              {c.faq && c.faq.length > 0 && (
                <motion.section
                  className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Gyakran Ismételt Kérdések
                  </h2>
                  <div className="space-y-4">
                    {c.faq.map((item: { question: string; answer: string }, index: number) => (
                      <details
                        key={index}
                        className="group border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <summary className="cursor-pointer list-none p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">
                              {item.question}
                            </h3>
                            <svg
                              className="w-5 h-5 text-gray-500 transition-transform duration-200 group-open:rotate-180"
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
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700 whitespace-pre-line">
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
                duration={stats.duration}
                lessons={stats.lessons}
                rating={stats.rating}
                students={stats.students}
                lifetimeAccess={true}
                onEnroll={handleEnroll}
                onPreview={() => console.log('Preview')}
                isEnrolled={false}
                thumbnailUrl={c.thumbnailUrl || c.imageUrl}
                courseTitle={c.title}
              />
            </div>
          </div>
        </div>

        {/* Related Courses Section */}
        {relatedCourses.length > 0 && (
          <div className="container mx-auto px-6 lg:px-12 pb-10 lg:pb-12">
            <RelatedCoursesSection
              courses={relatedCourses}
              categories={categories}
              instructors={instructors}
              title="Kapcsolódó tartalmak"
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
