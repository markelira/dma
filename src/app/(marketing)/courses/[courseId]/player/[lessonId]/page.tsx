'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { NewSidebar } from '@/components/course-player/NewSidebar';
import { NewVideoPlayer } from '@/components/course-player/NewVideoPlayer';
import { NewLessonContent } from '@/components/course-player/NewLessonContent';
import { NewLessonNavigation } from '@/components/course-player/NewLessonNavigation';
import { MobileBottomTabs, MobileTab } from '@/components/course-player/MobileBottomTabs';
import { NetflixPlayerLayout } from '@/components/course-player/NetflixPlayerLayout';
import { MasterclassSidebar } from '@/components/course-player/MasterclassSidebar';
import { ArrowLeftIcon } from '@/components/icons/CoursePlayerIcons';
import { usePlayerData, NETFLIX_STYLE_COURSE_TYPES } from '@/hooks/usePlayerData';
import { useCourseProgress, useResumePosition } from '@/hooks/useCourseProgress';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useEnrollmentTracking } from '@/hooks/useEnrollmentTracking';
import { useAuthStore } from '@/stores/authStore';
import { fetchLesson } from '@/hooks/useLessonQueries';
import { Module, Lesson, CourseType } from '@/types';

/**
 * Course Player Page - New Design
 * Pixel-perfect implementation matching the approved design
 */
export default function CoursePlayerPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  // Get route parameters
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  // Auth state
  const { user, authReady, isAuthenticated } = useAuthStore();

  // State
  const [currentLessonId, setCurrentLessonId] = useState(lessonId);
  const [mobileTab, setMobileTab] = useState<MobileTab>('video');

  // Fetch data
  const { data: playerData, isLoading: isLoadingPlayer, error: playerError } = usePlayerData(courseId, currentLessonId);
  const { data: progressData } = useCourseProgress(courseId);
  const { data: subStatus } = useSubscriptionStatus();
  const { data: resumePosition } = useResumePosition(currentLessonId);
  const { trackLessonAccess } = useEnrollmentTracking();

  // Progress mutation
  const progressMutation = useLessonProgress();

  // Extract data
  const course = playerData?.course;
  const modules = course?.modules || [];  // Fixed: modules are in course object
  const signedPlaybackUrl = playerData?.signedPlaybackUrl;
  const flatLessons = playerData?.flatLessons || [];
  const sourceCourseNames = playerData?.sourceCourseNames || {};
  const usesNetflixLayout = playerData?.usesNetflixLayout || false;
  const courseType = course?.type as CourseType | undefined;

  // DIAGNOSTIC: Log player layout decision
  useEffect(() => {
    if (playerData) {
      console.log('[CoursePlayer] Layout decision:', {
        courseId,
        courseTitle: course?.title,
        'course?.type': course?.type,
        'playerData.usesNetflixLayout': playerData.usesNetflixLayout,
        usesNetflixLayout,
        courseType,
        willRenderNetflix: usesNetflixLayout,
        willRenderMasterclass: !usesNetflixLayout && courseType === 'MASTERCLASS',
        willRenderDefault: !usesNetflixLayout && courseType !== 'MASTERCLASS',
      });
    }
  }, [playerData, course, courseId, usesNetflixLayout, courseType]);

  // Subscription check
  const hasSub = subStatus?.hasActiveSubscription ?? false;

  // Find current lesson
  const currentLesson = useMemo(() => {
    // First check flat lessons
    if (flatLessons.length > 0) {
      const flatLesson = flatLessons.find(l => l.id === currentLessonId);
      if (flatLesson) return flatLesson;
    }
    // Fall back to module lessons
    for (const module of modules) {
      const lesson = module.lessons?.find(l => l.id === currentLessonId);
      if (lesson) {
        return lesson;
      }
    }
    return null;
  }, [modules, flatLessons, currentLessonId]);

  // Find current module
  const currentModule = useMemo(() => {
    return modules.find(m =>
      m.lessons?.some(l => l.id === currentLessonId)
    );
  }, [modules, currentLessonId]);

  // Get completed lesson IDs
  const completedLessonIds = useMemo(() => {
    return new Set(progressData?.completedLessonIds || []);
  }, [progressData]);

  // Calculate course progress
  const courseProgress = useMemo(() => {
    const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    if (totalLessons === 0) return 0;
    return (completedLessonIds.size / totalLessons) * 100;
  }, [modules, completedLessonIds]);

  // Find previous/next lessons
  const { previousLesson, nextLesson } = useMemo(() => {
    // For flat lesson courses, use flatLessons directly
    if (flatLessons.length > 0) {
      const publishedLessons = flatLessons
        .filter(l => !l.status || l.status.toUpperCase() === 'PUBLISHED')
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const currentIndex = publishedLessons.findIndex(l => l.id === currentLessonId);

      return {
        previousLesson: currentIndex > 0 ? publishedLessons[currentIndex - 1] : null,
        nextLesson: currentIndex < publishedLessons.length - 1 ? publishedLessons[currentIndex + 1] : null,
      };
    }

    // Fall back to module-based navigation
    const allLessons: Array<{ lesson: Lesson; moduleIndex: number }> = [];
    modules.forEach((module, moduleIndex) => {
      module.lessons
        ?.filter(l => l.status?.toUpperCase() === 'PUBLISHED')
        .sort((a, b) => a.order - b.order)
        .forEach(lesson => {
          allLessons.push({ lesson, moduleIndex });
        });
    });

    const currentIndex = allLessons.findIndex(
      item => item.lesson.id === currentLessonId
    );

    return {
      previousLesson: currentIndex > 0 ? allLessons[currentIndex - 1]?.lesson : null,
      nextLesson: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1]?.lesson : null,
    };
  }, [modules, flatLessons, currentLessonId]);

  // Handlers
  const handleLessonClick = useCallback((newLessonId: string) => {
    setCurrentLessonId(newLessonId);
    router.push(`/courses/${courseId}/player/${newLessonId}`);
    setMobileTab('video');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [courseId, router]);

  const handlePreviousLesson = useCallback(() => {
    if (previousLesson) {
      handleLessonClick(previousLesson.id);
    }
  }, [previousLesson, handleLessonClick]);

  const handleNextLesson = useCallback(() => {
    if (nextLesson) {
      handleLessonClick(nextLesson.id);
    }
  }, [nextLesson, handleLessonClick]);

  const handleProgress = useCallback((currentTime: number, duration: number, percentage: number) => {
    if (percentage < 5) return;
    progressMutation.mutate({
      lessonId: currentLessonId,
      watchPercentage: percentage,
      timeSpent: currentTime,
      courseId,
    });
  }, [currentLessonId, courseId, progressMutation]);

  const handleVideoEnded = useCallback(() => {
    // Mark as completed
    progressMutation.mutate({
      lessonId: currentLessonId,
      watchPercentage: 100,
      completed: true,
      courseId,
    });

    // Auto-advance to next lesson after 2 seconds
    if (nextLesson) {
      setTimeout(() => {
        handleNextLesson();
      }, 2000);
    }
  }, [currentLessonId, courseId, nextLesson, handleNextLesson, progressMutation]);

  // Get video source
  const videoSource = useMemo(() => {
    if (!currentLesson) return '';
    if (signedPlaybackUrl) return signedPlaybackUrl;
    if (currentLesson.videoUrl) return currentLesson.videoUrl;
    if (currentLesson.muxPlaybackId) {
      return `https://stream.mux.com/${currentLesson.muxPlaybackId}.m3u8`;
    }
    return '';
  }, [currentLesson, signedPlaybackUrl]);

  // Track lesson access
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    if (isLoadingPlayer) return;
    if (!course || !currentLesson) return;

    trackLessonAccess(courseId, currentLessonId);
  }, [authReady, isAuthenticated, isLoadingPlayer, course, currentLesson, courseId, currentLessonId, trackLessonAccess]);

  // Preload next lesson
  useEffect(() => {
    if (nextLesson && course) {
      queryClient.prefetchQuery({
        queryKey: ['lesson', nextLesson.id, courseId],
        queryFn: () => fetchLesson(nextLesson.id, courseId),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [nextLesson, courseId, queryClient, course]);

  // Sync currentLessonId with URL lessonId
  useEffect(() => {
    if (lessonId !== currentLessonId) {
      setCurrentLessonId(lessonId);
    }
  }, [lessonId, currentLessonId]);

  // Check auth status first
  if (!authReady) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Autentikáció inicializálása...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  // Check subscription status
  if (subStatus && !hasSub) {
    const returnUrl = `/courses/${courseId}/player/${lessonId}`;
    router.push(`/pricing?reason=subscription_required&returnTo=${encodeURIComponent(returnUrl)}`);
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Átirányítás az előfizetés oldalra...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingPlayer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4 mx-auto" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (playerError || !course || !currentLesson) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Hiba történt a betöltés során
          </h1>
          <p className="text-gray-600 mb-6">
            {playerError?.message || 'A tartalom vagy lecke nem található.'}
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon size={20} />
            Vissza a tartalomhoz
          </Link>
        </div>
      </div>
    );
  }

  // Render Netflix-style layout for WEBINAR/PODCAST
  if (usesNetflixLayout) {
    const lessonsForPlayer = flatLessons.length > 0 ? flatLessons : modules.flatMap(m => m.lessons || []);

    return (
      <NetflixPlayerLayout
        course={{
          id: course.id,
          title: course.title,
          type: courseType,
          description: course.description,
        }}
        lessons={lessonsForPlayer}
        currentLesson={currentLesson}
        currentLessonId={currentLessonId}
        completedLessonIds={completedLessonIds}
        progress={courseProgress}
        videoSource={videoSource}
        resumePosition={resumePosition || 0}
        onLessonClick={handleLessonClick}
        onProgress={handleProgress}
        onVideoEnded={handleVideoEnded}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
        onPreviousLesson={handlePreviousLesson}
        onNextLesson={handleNextLesson}
      />
    );
  }

  // Determine which sidebar to use based on course type
  const useMasterclassSidebar = courseType === 'MASTERCLASS';
  const lessonsForSidebar = flatLessons.length > 0 ? flatLessons : modules.flatMap(m => m.lessons || []);

  // Render sidebar-based layout (MASTERCLASS, ACADEMIA, or default)
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen overflow-hidden">
        {/* Sidebar - Masterclass style or traditional module-based */}
        {useMasterclassSidebar ? (
          <MasterclassSidebar
            courseTitle={course.title}
            courseType={courseType}
            lessons={lessonsForSidebar}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
            progress={courseProgress}
            onLessonClick={handleLessonClick}
            sourceCourseNames={sourceCourseNames}
          />
        ) : (
          <NewSidebar
            courseTitle={course.title}
            modules={modules}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
            progress={courseProgress}
            onLessonClick={handleLessonClick}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-12 py-8 space-y-8">
            {/* Back Link */}
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeftIcon size={20} />
              Vissza a tartalomhoz
            </Link>

            {/* Video Player */}
            {videoSource && currentLesson.type === 'VIDEO' && (
              <NewVideoPlayer
                src={videoSource}
                poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                initialTime={resumePosition || 0}
                onProgress={handleProgress}
                onEnded={handleVideoEnded}
              />
            )}

            {/* Lesson Title and Breadcrumb */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {currentLesson.title}
              </h1>
              {currentModule && !useMasterclassSidebar && (
                <p className="text-sm text-gray-600">
                  {modules.findIndex(m => m.id === currentModule?.id) + 1}. Modul: {currentModule.title}
                </p>
              )}
              {useMasterclassSidebar && (
                <p className="text-sm text-gray-600">
                  Lecke {lessonsForSidebar.findIndex(l => l.id === currentLessonId) + 1} / {lessonsForSidebar.length}
                </p>
              )}
            </div>

            {/* Navigation Buttons */}
            <NewLessonNavigation
              hasPrevious={!!previousLesson}
              hasNext={!!nextLesson}
              onPrevious={handlePreviousLesson}
              onNext={handleNextLesson}
            />

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Lesson Content (Description & Outcomes) */}
            <NewLessonContent
              lesson={currentLesson}
              moduleName={currentModule?.title}
              moduleNumber={modules.findIndex(m => m.id === currentModule?.id) + 1}
              showTitle={false}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-screen overflow-hidden flex flex-col">
        {/* Back Link */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 bg-white">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeftIcon size={20} />
            Vissza a tartalomhoz
          </Link>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Video Tab Content */}
          {mobileTab === 'video' && (
            <div className="p-6 space-y-6">
              {/* Video Player */}
              {videoSource && currentLesson.type === 'VIDEO' && (
                <NewVideoPlayer
                  src={videoSource}
                  poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                  initialTime={resumePosition || 0}
                  onProgress={handleProgress}
                  onEnded={handleVideoEnded}
                />
              )}

              {/* Lesson Title and Breadcrumb */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {currentLesson.title}
                </h1>
                {currentModule && !useMasterclassSidebar && (
                  <p className="text-sm text-gray-600">
                    {modules.findIndex(m => m.id === currentModule?.id) + 1}. Modul: {currentModule.title}
                  </p>
                )}
                {useMasterclassSidebar && (
                  <p className="text-sm text-gray-600">
                    Lecke {lessonsForSidebar.findIndex(l => l.id === currentLessonId) + 1} / {lessonsForSidebar.length}
                  </p>
                )}
              </div>

              {/* Navigation Buttons */}
              <NewLessonNavigation
                hasPrevious={!!previousLesson}
                hasNext={!!nextLesson}
                onPrevious={handlePreviousLesson}
                onNext={handleNextLesson}
              />

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Lesson Content (Description & Outcomes) */}
              <NewLessonContent
                lesson={currentLesson}
                moduleName={currentModule?.title}
                moduleNumber={modules.findIndex(m => m.id === currentModule?.id) + 1}
                showTitle={false}
              />
            </div>
          )}

          {/* Lessons Tab Content */}
          {mobileTab === 'lessons' && (
            <div className="h-full overflow-y-auto">
              {useMasterclassSidebar ? (
                <MasterclassSidebar
                  courseTitle={course.title}
                  courseType={courseType}
                  lessons={lessonsForSidebar}
                  currentLessonId={currentLessonId}
                  completedLessonIds={completedLessonIds}
                  progress={courseProgress}
                  onLessonClick={handleLessonClick}
                  sourceCourseNames={sourceCourseNames}
                />
              ) : (
                <NewSidebar
                  courseTitle={course.title}
                  modules={modules}
                  currentLessonId={currentLessonId}
                  completedLessonIds={completedLessonIds}
                  progress={courseProgress}
                  onLessonClick={handleLessonClick}
                />
              )}
            </div>
          )}
        </div>

        {/* Bottom Tabs */}
        <MobileBottomTabs
          activeTab={mobileTab}
          onTabChange={setMobileTab}
        />
      </div>
    </>
  );
}

