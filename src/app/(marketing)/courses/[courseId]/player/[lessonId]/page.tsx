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
import { ArrowLeftIcon } from '@/components/icons/CoursePlayerIcons';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useCourseProgress, useResumePosition } from '@/hooks/useCourseProgress';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useEnrollmentTracking } from '@/hooks/useEnrollmentTracking';
import { useAuthStore } from '@/stores/authStore';
import { fetchLesson } from '@/hooks/useLessonQueries';
import { Module, Lesson } from '@/types';

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

  // Subscription check
  const hasSub = subStatus?.hasActiveSubscription ?? false;

  // Find current lesson
  const currentLesson = useMemo(() => {
    for (const module of modules) {
      const lesson = module.lessons?.find(l => l.id === currentLessonId);
      if (lesson) {
        return lesson;
      }
    }
    return null;
  }, [modules, currentLessonId]);

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
  }, [modules, currentLessonId]);

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
            {playerError?.message || 'A kurzus vagy lecke nem található.'}
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon size={20} />
            Vissza a kurzushoz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen overflow-hidden">
        {/* Sidebar */}
        <NewSidebar
          courseTitle={course.title}
          modules={modules}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIds}
          progress={courseProgress}
          onLessonClick={handleLessonClick}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-12 py-8 space-y-8">
            {/* Back Link */}
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeftIcon size={20} />
              Vissza a kurzushoz
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
              {currentModule && (
                <p className="text-sm text-gray-600">
                  {modules.findIndex(m => m.id === currentModule?.id) + 1}. Modul: {currentModule.title}
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
            Vissza a kurzushoz
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
                {currentModule && (
                  <p className="text-sm text-gray-600">
                    {modules.findIndex(m => m.id === currentModule?.id) + 1}. Modul: {currentModule.title}
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
              <NewSidebar
                courseTitle={course.title}
                modules={modules}
                currentLessonId={currentLessonId}
                completedLessonIds={completedLessonIds}
                progress={courseProgress}
                onLessonClick={handleLessonClick}
              />
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

