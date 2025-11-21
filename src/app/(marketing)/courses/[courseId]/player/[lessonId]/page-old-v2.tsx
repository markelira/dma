'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useLesson, fetchLesson } from '@/hooks/useLessonQueries';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useEnrollmentTracking } from '@/hooks/useEnrollmentTracking';
import { useCourseProgress, useResumePosition } from '@/hooks/useCourseProgress';
import { useAuthStore } from '@/stores/authStore';
import { PlayerSkeleton } from '@/components/course-player/PlayerSkeleton';
import { CustomVideoPlayer } from '@/components/course-player/CustomVideoPlayer';
import { CourseNavigationSidebarV2 } from '@/components/course-player/CourseNavigationSidebarV2';
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

export default function PlayerPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string };
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [showAutoAdvance, setShowAutoAdvance] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: playerData, isLoading: playerLoading, error: playerError } = usePlayerData(courseId, lessonId);
  const course = playerData?.course;
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId, courseId);
  const { data: subStatus } = useSubscriptionStatus();
  const progressMutation = useLessonProgress();
  const { trackLessonAccess } = useEnrollmentTracking();
  const { data: courseProgress } = useCourseProgress(courseId);
  const { data: resumePosition } = useResumePosition(lessonId);

  const hasSub = subStatus?.hasActiveSubscription ?? false;

  // Calculate navigation
  const modules = course?.modules || [];
  const flatLessons = useMemo(() => {
    return modules.flatMap((m: any) =>
      (m.lessons as any[])
        .filter((l: any) => l.status === 'PUBLISHED')
        .sort((a: any, b: any) => a.order - b.order)
        .map((l: any) => ({
          ...l,
          moduleId: m.id,
          moduleOrder: m.order
        }))
    );
  }, [modules]);

  const currentIndex = flatLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  // Get current module for breadcrumb
  const currentModule = modules.find((m: any) => m.lessons.some((l: any) => l.id === lessonId));

  // Get completed lesson IDs from course progress
  const completedLessonIds = courseProgress?.completedLessonIds || [];

  // Auto-redirect if course/lesson not found
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    if (playerLoading || lessonLoading) return;

    if (!playerLoading && !lessonLoading) {
      if (!course && !playerError) {
        console.error('Player: Course not found, redirecting to /courses');
        router.push('/courses');
        return;
      }

      if (!lesson && !lessonError) {
        console.error('Player: Lesson not found, redirecting to course page');
        router.push(`/courses/${courseId}`);
        return;
      }
    }
  }, [authReady, isAuthenticated, playerLoading, lessonLoading, course, lesson, courseId, router, playerError, lessonError]);

  // Preload next lesson data
  useEffect(() => {
    if (nextLesson && course) {
      queryClient.prefetchQuery({
        queryKey: ['lesson', nextLesson.id, courseId],
        queryFn: () => fetchLesson(nextLesson.id, courseId),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [nextLesson, courseId, queryClient, course]);

  // Track lesson access
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    if (playerLoading || lessonLoading) return;
    if (!course || !lesson) return;

    trackLessonAccess(courseId, lessonId);
  }, [authReady, isAuthenticated, playerLoading, lessonLoading, course, lesson, courseId, lessonId, trackLessonAccess]);

  // Auto-advance countdown
  useEffect(() => {
    if (!showAutoAdvance || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1 && nextLesson) {
          router.push(`/courses/${courseId}/player/${nextLesson.id}`);
          setShowAutoAdvance(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAutoAdvance, countdown, router, courseId, nextLesson]);

  // Scroll to top on lesson change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lessonId]);

  // Check auth status first
  if (!authReady) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Átirányítás az előfizetés oldalra...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (playerLoading || lessonLoading) {
    return <PlayerSkeleton />;
  }

  // Show error
  if (playerError || lessonError) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Hiba történt a betöltés során</h2>
          <p className="text-gray-300 mb-4">
            {playerError?.message || lessonError?.message || 'Ismeretlen hiba'}
          </p>
          <Button onClick={() => router.push('/courses')}>
            Vissza a kurzusokhoz
          </Button>
        </div>
      </div>
    );
  }

  // Show error if data missing
  if (!course || !lesson) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Tartalom nem található</h2>
          <p className="text-gray-300 mb-4">A kért lecke vagy kurzus nem érhető el.</p>
          <Button onClick={() => router.push('/courses')}>
            Vissza a kurzusokhoz
          </Button>
        </div>
      </div>
    );
  }

  const handleProgress = (currentTime: number, duration: number, percentage: number) => {
    if (percentage < 5) return;
    progressMutation.mutate({ lessonId, watchPercentage: percentage, timeSpent: currentTime });
  };

  const handleEnded = () => {
    progressMutation.mutate({ lessonId, watchPercentage: 100 });

    if (course?.autoplayNext !== false && nextLesson) {
      setShowAutoAdvance(true);
      setCountdown(5);
    }
  };

  const handleSelectLesson = (newLessonId: string) => {
    router.push(`/courses/${courseId}/player/${newLessonId}`);
    setSheetOpen(false);
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      router.push(`/courses/${courseId}/player/${prevLesson.id}`);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      router.push(`/courses/${courseId}/player/${nextLesson.id}`);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar - Fixed 384px */}
        <aside className="hidden md:block w-96 border-r">
          <CourseNavigationSidebarV2
            course={course as unknown as Course}
            modules={modules}
            currentLessonId={lessonId}
            onSelectLesson={handleSelectLesson}
            completedLessonIds={completedLessonIds}
          />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden border-b bg-background p-4 flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <CourseNavigationSidebarV2
                  course={course as unknown as Course}
                  modules={modules}
                  currentLessonId={lessonId}
                  onSelectLesson={handleSelectLesson}
                  completedLessonIds={completedLessonIds}
                />
              </SheetContent>
            </Sheet>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-base truncate">{lesson.title}</h1>
              {currentModule && (
                <p className="text-xs text-muted-foreground truncate">{currentModule.title}</p>
              )}
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full">
              {/* Video Player or Content */}
              {lesson.type === 'VIDEO' ? (
                <CustomVideoPlayer
                  src={lesson.videoUrl || lesson.muxPlaybackId ? `https://stream.mux.com/${lesson.muxPlaybackId}.m3u8` : ''}
                  poster={lesson.thumbnailUrl || lesson.muxThumbnailUrl}
                  initialTime={resumePosition || 0}
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                />
              ) : (
                <LessonContentRenderer
                  lesson={lesson}
                  courseId={courseId}
                  userId={user?.uid}
                  playerData={playerData}
                  onProgress={(percentage, time) => handleProgress(time, lesson.duration || 0, percentage)}
                  onCompleted={handleEnded}
                  hasAccess={hasSub}
                />
              )}

              {/* Lesson Info Card */}
              <Card className="mt-8 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{lesson.title}</h1>
                    {currentModule && (
                      <p className="text-muted-foreground">{currentModule.title}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Prev/Next Navigation */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevLesson}
                  disabled={!prevLesson}
                  className="flex-1 md:flex-none"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Előző
                </Button>
                <Button
                  onClick={handleNextLesson}
                  disabled={!nextLesson}
                  className="flex-1 md:flex-none ml-auto"
                >
                  Következő lecke
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Lesson Description */}
              {lesson.description && (
                <Card className="mt-6 p-6">
                  <h2 className="text-xl font-semibold mb-4">A leckéről</h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed">{lesson.description}</p>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Auto-advance countdown overlay */}
      {showAutoAdvance && nextLesson && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Lecke befejezve!</h3>
              <p className="text-gray-600">Következő lecke indítása {countdown} másodperc múlva...</p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Következő:</p>
              <p className="font-semibold text-gray-900">{nextLesson.title}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAutoAdvance(false);
                  setCountdown(5);
                }}
                className="flex-1"
              >
                Mégse
              </Button>
              <Button
                onClick={() => router.push(`/courses/${courseId}/player/${nextLesson.id}`)}
                className="flex-1"
              >
                Indítás most
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
