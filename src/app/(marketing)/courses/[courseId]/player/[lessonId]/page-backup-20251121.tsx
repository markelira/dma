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
import { VideoPlayer } from '@/components/course-player/VideoPlayer';
import { Sidebar } from '@/components/course-player/Sidebar';
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Course } from '@/types';

export default function PlayerPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string };
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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

  // Get video source URL
  const getVideoSrc = () => {
    if (lesson.videoUrl) return lesson.videoUrl;
    if (lesson.muxPlaybackId) return `https://stream.mux.com/${lesson.muxPlaybackId}.m3u8`;
    return '';
  };

  return (
    <div className="light flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-96 h-full shrink-0 z-20 shadow-xl">
        <Sidebar
          course={course as unknown as Course}
          modules={modules}
          currentLessonId={lessonId}
          onSelectLesson={handleSelectLesson}
          completedLessonIds={completedLessonIds}
        />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background z-30">
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">{lesson.title}</h1>
            {currentModule && (
              <p className="text-xs text-muted-foreground truncate">{currentModule.title}</p>
            )}
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <Sidebar
                course={course as unknown as Course}
                modules={modules}
                currentLessonId={lessonId}
                onSelectLesson={handleSelectLesson}
                completedLessonIds={completedLessonIds}
              />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 flex flex-col gap-8">

            {/* Breadcrumb / Nav Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary pl-0 gap-2"
                onClick={() => router.push('/courses')}
              >
                <ArrowLeft className="w-4 h-4" /> Vissza a kurzusokhoz
              </Button>
            </div>

            {/* Video/Content Section */}
            <div className="space-y-6">
              {lesson.type === 'VIDEO' ? (
                <VideoPlayer
                  src={getVideoSrc()}
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

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-heading">
                    {lesson.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {currentModule?.title}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    disabled={!prevLesson}
                    onClick={handlePrevLesson}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Előző
                  </Button>
                  <Button
                    className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                    disabled={!nextLesson}
                    onClick={handleNextLesson}
                  >
                    Következő lecke <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Lesson Description / Content */}
              {lesson.description && (
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-xl font-semibold mb-4">A leckéről</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {lesson.description}
                  </p>
                  <h4 className="text-lg font-semibold mt-6 mb-2">Amit megtanulsz:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {(lesson.learningOutcomes && lesson.learningOutcomes.length > 0) ? (
                      lesson.learningOutcomes.map((outcome, index) => (
                        <li key={index}>{outcome}</li>
                      ))
                    ) : (
                      <>
                        <li>Alapvető fogalmak tisztázása</li>
                        <li>Gyakorlati példák elemzése</li>
                        <li>Szakmai tippek és trükkök</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
