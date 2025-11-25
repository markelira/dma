'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NewSidebar } from '@/components/course-player/NewSidebar';
import { NewVideoPlayer } from '@/components/course-player/NewVideoPlayer';
import { NewLessonContent } from '@/components/course-player/NewLessonContent';
import { NewLessonNavigation } from '@/components/course-player/NewLessonNavigation';
import { MobileBottomTabs, MobileTab } from '@/components/course-player/MobileBottomTabs';
import { ArrowLeftIcon } from '@/components/icons/CoursePlayerIcons';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { Module, Lesson } from '@/types';
import { mockCourses } from '@/lib/mockCourses';

/**
 * Course Player Preview Page
 * Demonstrates the new pixel-perfect design matching the screenshot
 * Route: /admin/preview/course-player
 */
export default function CoursePlayerPreviewPage() {
  const router = useRouter();

  // For preview, we'll use mock data to demonstrate the design
  // This allows testing without needing Firebase data
  const USE_MOCK_DATA = true; // Set to false to use real Firebase data

  const PREVIEW_COURSE_ID = 'react-fejlesztes-alapjai';
  const PREVIEW_LESSON_ID = 'lesson-1';

  // State
  const [currentLessonId, setCurrentLessonId] = useState(PREVIEW_LESSON_ID);
  const [mobileTab, setMobileTab] = useState<MobileTab>('video');

  // Fetch course data (only if not using mock data)
  const { data: playerData, isLoading: isLoadingPlayer } = usePlayerData(
    USE_MOCK_DATA ? undefined : PREVIEW_COURSE_ID,
    USE_MOCK_DATA ? undefined : currentLessonId
  );

  // Fetch progress data (only if not using mock data)
  const { data: progressData } = useCourseProgress(
    USE_MOCK_DATA ? undefined : PREVIEW_COURSE_ID
  );

  // Progress mutation
  const progressMutation = useLessonProgress();

  // Extract data - use mock data if enabled
  const course = USE_MOCK_DATA ? mockCourses[0] : playerData?.course;
  const modules = USE_MOCK_DATA ? (mockCourses[0].modules || []) : (playerData?.modules || []);
  const signedPlaybackUrl = USE_MOCK_DATA ? null : playerData?.signedPlaybackUrl;

  // Find current lesson
  const currentLesson = useMemo(() => {
    for (const module of modules) {
      const lesson = module.lessons?.find(l => l.id === currentLessonId);
      if (lesson) return lesson;
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
      module.lessons?.forEach(lesson => {
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
  const handleLessonClick = useCallback((lessonId: string) => {
    setCurrentLessonId(lessonId);
    setMobileTab('video');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    progressMutation.mutate({
      lessonId: currentLessonId,
      watchPercentage: percentage,
      timeSpent: currentTime,
      courseId: PREVIEW_COURSE_ID,
    });
  }, [currentLessonId, progressMutation]);

  const handleVideoEnded = useCallback(() => {
    // Mark as completed and auto-advance to next lesson
    progressMutation.mutate({
      lessonId: currentLessonId,
      watchPercentage: 100,
      completed: true,
      courseId: PREVIEW_COURSE_ID,
    });

    // Auto-advance to next lesson after 2 seconds
    if (nextLesson) {
      setTimeout(() => {
        handleNextLesson();
      }, 2000);
    }
  }, [currentLessonId, nextLesson, handleNextLesson, progressMutation]);

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

  // Loading state (skip if using mock data)
  if (!USE_MOCK_DATA && isLoadingPlayer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mb-4 mx-auto" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  // Error state (skip if using mock data and we have course)
  if (!course || !currentLesson) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {USE_MOCK_DATA ? 'Mock adat hiba' : 'Előnézet nem elérhető'}
          </h1>
          <p className="text-gray-600 mb-6">
            {USE_MOCK_DATA
              ? 'Mock adatok nem érhetők el. Ellenőrizd a mockCourses.ts fájlt.'
              : 'Kérjük, frissítsd a course ID-t és lesson ID-t a page.tsx fájlban egy létező tartalomra, vagy kapcsold be a USE_MOCK_DATA opciót.'
            }
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-secondary-hover font-medium"
          >
            <ArrowLeftIcon size={20} />
            Vissza
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
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeftIcon size={20} />
              Vissza a tartalmakhoz
            </Link>

            {/* Video Player */}
            {videoSource && (
              <NewVideoPlayer
                src={videoSource}
                poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                initialTime={progressData?.progressMap?.[currentLessonId]?.resumePosition || 0}
                onProgress={handleProgress}
                onEnded={handleVideoEnded}
              />
            )}

            {/* Lesson Content */}
            <NewLessonContent
              lesson={currentLesson}
              moduleName={currentModule?.title}
              moduleNumber={modules.findIndex(m => m.id === currentModule?.id) + 1}
            />

            {/* Navigation */}
            <NewLessonNavigation
              hasPrevious={!!previousLesson}
              hasNext={!!nextLesson}
              onPrevious={handlePreviousLesson}
              onNext={handleNextLesson}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-screen overflow-hidden flex flex-col">
        {/* Back Link */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 bg-white">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeftIcon size={20} />
            Vissza a tartalmakhoz
          </Link>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Video Tab Content */}
          {mobileTab === 'video' && (
            <div className="p-6 space-y-6">
              {/* Video Player */}
              {videoSource && (
                <NewVideoPlayer
                  src={videoSource}
                  poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                  initialTime={progressData?.progressMap?.[currentLessonId]?.resumePosition || 0}
                  onProgress={handleProgress}
                  onEnded={handleVideoEnded}
                />
              )}

              {/* Lesson Content */}
              <NewLessonContent
                lesson={currentLesson}
                moduleName={currentModule?.title}
                moduleNumber={modules.findIndex(m => m.id === currentModule?.id) + 1}
              />

              {/* Navigation */}
              <NewLessonNavigation
                hasPrevious={!!previousLesson}
                hasNext={!!nextLesson}
                onPrevious={handlePreviousLesson}
                onNext={handleNextLesson}
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
