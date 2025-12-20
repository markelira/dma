"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NewVideoPlayer } from './NewVideoPlayer';
import { NewLessonNavigation } from './NewLessonNavigation';
import { WebinarSidePanel } from './WebinarSidePanel';
import { AcademiaSidePanel } from './AcademiaSidePanel';
import { PodcastSidePanel } from './PodcastSidePanel';
import { MasterclassSidePanel } from './MasterclassSidePanel';
import { MobileBottomTabs, MobileTab } from './MobileBottomTabs';
import { ArrowLeftIcon, PlayCircleIcon, CheckCircleIcon, EmptyCircleIcon } from '@/components/icons/CoursePlayerIcons';
import { Lesson, CourseType, Instructor, Module } from '@/types';
import { getCourseTypeTerminology } from '@/lib/terminology';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface NetflixPlayerLayoutProps {
  course: {
    id: string;
    title: string;
    type?: CourseType;
    description?: string;
  };
  lessons: Lesson[];
  modules?: Module[];
  currentLesson: Lesson;
  currentLessonId: string;
  completedLessonIds: Set<string>;
  progress: number;
  videoSource: string;
  resumePosition?: number;
  onLessonClick: (lessonId: string) => void;
  onProgress: (currentTime: number, duration: number, percentage: number) => void;
  onVideoEnded: () => void;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
  instructor?: Instructor | null;
  instructors?: Instructor[];
}

/**
 * Helper function to format plain text content into readable HTML
 * Converts double newlines to paragraphs, single newlines to <br>
 */
function formatTextContent(content: string): string {
  // Check if content already has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtmlTags) {
    // Content has HTML, return as-is but ensure paragraphs have spacing
    return content;
  }

  // Plain text - convert to readable HTML with paragraphs
  // Split by double newlines (paragraph breaks)
  const paragraphs = content.split(/\n\s*\n/);

  return paragraphs
    .map(para => {
      // Convert single newlines within paragraph to <br>
      const withBreaks = para.trim().replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    })
    .filter(p => p !== '<p></p>')
    .join('\n');
}

/**
 * Netflix-style Player Layout for WEBINAR and PODCAST course types
 * Full-width video player with minimal UI, expandable episode list below
 */
export function NetflixPlayerLayout({
  course,
  lessons,
  modules = [],
  currentLesson,
  currentLessonId,
  completedLessonIds,
  progress,
  videoSource,
  resumePosition = 0,
  onLessonClick,
  onProgress,
  onVideoEnded,
  previousLesson,
  nextLesson,
  onPreviousLesson,
  onNextLesson,
  instructor,
  instructors = [],
}: NetflixPlayerLayoutProps) {
  const router = useRouter();
  const [episodesExpanded, setEpisodesExpanded] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('video');

  // Check course type for layout selection
  const isWebinar = course.type === 'WEBINAR';
  const isPodcast = course.type === 'PODCAST';
  const isAcademia = course.type === 'ACADEMIA';
  const isMasterclass = course.type === 'MASTERCLASS';

  // Calculate total duration from all lessons
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

  const terminology = course.type ? getCourseTypeTerminology(course.type) : null;
  const lessonLabel = terminology?.lessonLabel || 'Lecke';
  const lessonsLabel = terminology?.lessonsLabel || 'Leckék';
  const contentLabel = terminology?.contentLabel || 'Tartalom';

  // Get lesson status icon (red accents for Netflix style)
  const getLessonStatusIcon = (lessonId: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <PlayCircleIcon className="w-5 h-5 text-red-500" />;
    }
    if (completedLessonIds.has(lessonId)) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return <EmptyCircleIcon className="w-5 h-5 text-gray-400" />;
  };

  // Format duration
  const formatDuration = (seconds?: number | string) => {
    const numSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
    if (!numSeconds || numSeconds <= 0 || isNaN(numSeconds)) return null;
    const mins = Math.floor(numSeconds / 60);
    const secs = numSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Current lesson index for display
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);

  // DIAGNOSTIC: Log video rendering decision
  useEffect(() => {
    console.log('🎬 [NetflixPlayerLayout] Video render decision:', {
      courseType: course.type,
      isWebinar,
      isPodcast,
      isAcademia,
      isMasterclass,
      videoSource: videoSource?.substring(0, 80),
      hasVideoSource: !!videoSource,
      currentLessonType: currentLesson?.type,
      lessonTypeCheck: !currentLesson.type || currentLesson.type === 'VIDEO',
      willRenderVideo: !!videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO'),
    });
  }, [course.type, isWebinar, isPodcast, isAcademia, isMasterclass, videoSource, currentLesson]);

  // WEBINAR Layout: Side panel on left + Video on right
  if (isWebinar) {
    return (
      <>
        {/* ========== MOBILE LAYOUT ========== */}
        <div className="md:hidden min-h-[100dvh] flex flex-col bg-black">
          {/* Mobile Top Bar */}
          <div className="flex-shrink-0 bg-gray-900 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="inline-flex items-center text-white/80 hover:text-white">
                <ArrowLeftIcon size={20} />
              </Link>
              <h1 className="text-white text-sm font-medium truncate flex-1">{course.title}</h1>
            </div>
          </div>

          {/* Video Player - Full width on mobile */}
          <div className="flex-1 flex flex-col">
            {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') ? (
              <div className="w-full aspect-video bg-black">
                <NewVideoPlayer
                  src={videoSource}
                  poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                  initialTime={resumePosition}
                  onProgress={onProgress}
                  onEnded={onVideoEnded}
                  accentColor="red"
                />
              </div>
            ) : null}

            {/* Episode Info below video */}
            <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-gray-600 leading-relaxed">{currentLesson.description}</p>
              )}
              {instructor && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {instructor.profilePictureUrl ? (
                      <img src={instructor.profilePictureUrl} alt={instructor.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-sm">{instructor.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{instructor.name}</p>
                    {instructor.title && <p className="text-sm text-gray-500">{instructor.title}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden md:flex min-h-[100dvh] max-h-[100dvh] bg-black overflow-hidden">
          {/* Left Side Panel */}
          <WebinarSidePanel
            courseTitle={course.title}
            courseDescription={course.description}
            instructor={instructor}
            instructors={instructors}
            currentLesson={currentLesson}
            totalDuration={totalDuration}
          />

          {/* Right Side - Video and Controls */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors">
                  <ArrowLeftIcon size={20} />
                  <span>Vissza</span>
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <h1 className="text-white text-sm font-medium truncate">{course.title}</h1>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center">
              {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') && (
                <div className="w-full h-full">
                  <NewVideoPlayer
                    src={videoSource}
                    poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                    initialTime={resumePosition}
                    onProgress={onProgress}
                    onEnded={onVideoEnded}
                    accentColor="red"
                  />
                </div>
              )}

              {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white p-8 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                    {currentLesson.content && (
                      <div className="prose prose-invert prose-lg max-w-none">
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{currentLesson.content}</p>
                      </div>
                    )}
                    {!videoSource && !currentLesson.content && <p className="text-gray-500">Nincs elérhető tartalom</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ACADEMIA Layout: Side panel with lesson navigation + Video on right
  if (isAcademia) {
    return (
      <>
        {/* ========== MOBILE LAYOUT ========== */}
        <div className="md:hidden min-h-[100dvh] flex flex-col bg-white">
          {/* Mobile Top Bar */}
          <div className="flex-shrink-0 bg-gray-900 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
              >
                <ArrowLeftIcon size={20} />
              </Link>
              <h1 className="text-white text-sm font-medium truncate flex-1">{course.title}</h1>
            </div>
          </div>

          {/* Mobile Tab Content */}
          <div className="flex-1 overflow-y-auto pb-[72px]">
            {/* Video Tab Content */}
            {mobileTab === 'video' && (
              <div className="flex flex-col">
                {/* Video Player or Text Content */}
                {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') ? (
                  <div className="w-full aspect-video bg-black">
                    <NewVideoPlayer
                      src={videoSource}
                      poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                      initialTime={resumePosition}
                      onProgress={onProgress}
                      onEnded={onVideoEnded}
                      accentColor="red"
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.content && (
                      <div
                        className="prose prose-base prose-gray max-w-none
                                   prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                                   [&_*]:!bg-transparent [&_p]:mb-4 [&_p]:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatTextContent(currentLesson.content) }}
                      />
                    )}
                  </div>
                )}

                {/* Lesson Info */}
                <div className="p-4 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p className="text-gray-600 leading-relaxed">{currentLesson.description}</p>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={onPreviousLesson}
                      disabled={!previousLesson}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        previousLesson ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <ArrowLeftIcon size={16} />
                      Előző
                    </button>
                    <span className="text-sm text-gray-500">{currentIndex + 1} / {lessons.length}</span>
                    <button
                      onClick={onNextLesson}
                      disabled={!nextLesson}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        nextLesson ? 'bg-brand-secondary text-white' : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      Következő
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lessons Tab - Module-based list */}
            {mobileTab === 'lessons' && (
              <div className="bg-white p-4 space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
                </div>

                {/* Modules with Lessons */}
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                      {moduleIndex + 1}. Modul: {module.title}
                    </h3>
                    {module.lessons
                      ?.filter(l => !l.status || l.status.toUpperCase() === 'PUBLISHED')
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((lesson) => {
                        const isCurrent = lesson.id === currentLessonId;
                        const isCompleted = completedLessonIds.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              onLessonClick(lesson.id);
                              setMobileTab('video');
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                              isCurrent
                                ? 'bg-brand-secondary/10 border-l-4 border-brand-secondary'
                                : 'bg-gray-50 hover:bg-gray-100 border-l-4 border-transparent'
                            }`}
                          >
                            {isCurrent ? (
                              <PlayCircleIcon className="w-5 h-5 text-brand-secondary flex-shrink-0" />
                            ) : isCompleted ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <EmptyCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isCurrent ? 'text-brand-secondary' : 'text-gray-900'}`}>
                                {lesson.title}
                              </p>
                              {lesson.duration && Number(lesson.duration) > 0 && (
                                <p className="text-xs text-gray-500">{formatDuration(lesson.duration)}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Bottom Tabs */}
          <MobileBottomTabs activeTab={mobileTab} onTabChange={setMobileTab} courseType={course.type} />
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden md:flex min-h-[100dvh] max-h-[100dvh] bg-black overflow-hidden">
          {/* Left Side Panel with Lesson Navigation */}
          <AcademiaSidePanel
            courseTitle={course.title}
            courseDescription={course.description}
            instructors={instructors.length > 0 ? instructors : (instructor ? [instructor] : [])}
            modules={modules}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
            onLessonClick={onLessonClick}
          />

          {/* Right Side - Video and Controls */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors">
                  <ArrowLeftIcon size={20} />
                  <span>Vissza</span>
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <h1 className="text-white text-sm font-medium truncate">{course.title}</h1>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') && (
                <div className="w-full h-full">
                  <NewVideoPlayer
                    src={videoSource}
                    poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                    initialTime={resumePosition}
                    onProgress={onProgress}
                    onEnded={onVideoEnded}
                    accentColor="red"
                  />
                </div>
              )}

              {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
                <div className="w-full h-full overflow-y-auto bg-white">
                  <div className="max-w-3xl mx-auto px-8 py-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{currentLesson.title}</h1>
                    {currentLesson.description && (
                      <p className="text-lg text-gray-600 mb-8 leading-relaxed border-l-4 border-brand-secondary pl-4">
                        {currentLesson.description}
                      </p>
                    )}
                    {currentLesson.content && (
                      <div
                        className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold
                                   prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6 prose-p:text-lg
                                   [&_*]:!bg-transparent [&_p]:mb-6 [&_p]:leading-loose [&_p]:text-lg"
                        dangerouslySetInnerHTML={{ __html: formatTextContent(currentLesson.content) }}
                      />
                    )}
                    {!currentLesson.content && (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">Nincs elérhető tartalom ehhez a leckéhez.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                <button
                  onClick={onPreviousLesson}
                  disabled={!previousLesson}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    previousLesson ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ArrowLeftIcon size={18} />
                  Előző rész
                </button>
                <span className="text-sm text-gray-500">{currentLesson.title}</span>
                <button
                  onClick={onNextLesson}
                  disabled={!nextLesson}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    nextLesson ? 'bg-brand-secondary hover:bg-brand-secondary-hover text-white shadow-md' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Következő rész
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // MASTERCLASS Layout: Side panel with lesson navigation + Video on right + bottom nav
  if (isMasterclass) {
    return (
      <>
        {/* ========== MOBILE LAYOUT ========== */}
        <div className="md:hidden min-h-[100dvh] flex flex-col bg-white">
          {/* Mobile Top Bar */}
          <div className="flex-shrink-0 bg-gray-900 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
              >
                <ArrowLeftIcon size={20} />
              </Link>
              <h1 className="text-white text-sm font-medium truncate flex-1">{course.title}</h1>
            </div>
          </div>

          {/* Mobile Tab Content */}
          <div className="flex-1 overflow-y-auto pb-[72px]">
            {/* Video Tab Content */}
            {mobileTab === 'video' && (
              <div className="flex flex-col">
                {/* Video Player or Text Content */}
                {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') ? (
                  <div className="w-full aspect-video bg-black">
                    <NewVideoPlayer
                      src={videoSource}
                      poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                      initialTime={resumePosition}
                      onProgress={onProgress}
                      onEnded={onVideoEnded}
                      accentColor="red"
                    />
                  </div>
                ) : (
                  /* Text/Reading Content for non-video lessons */
                  <div className="p-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.description && (
                      <p className="text-base text-gray-600 mb-6 leading-relaxed border-l-4 border-brand-secondary pl-4">
                        {currentLesson.description}
                      </p>
                    )}
                    {currentLesson.content && (
                      <div
                        className="prose prose-base prose-gray max-w-none
                                   prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                                   prose-li:text-gray-700
                                   [&_*]:!bg-transparent
                                   [&_p]:mb-4 [&_p]:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatTextContent(currentLesson.content) }}
                      />
                    )}
                  </div>
                )}

                {/* Lesson Info below video */}
                <div className="p-4 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p className="text-gray-600 leading-relaxed">{currentLesson.description}</p>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={onPreviousLesson}
                      disabled={!previousLesson}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        previousLesson
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <ArrowLeftIcon size={16} />
                      Előző
                    </button>
                    <span className="text-sm text-gray-500">
                      {currentIndex + 1} / {lessons.length}
                    </span>
                    <button
                      onClick={onNextLesson}
                      disabled={!nextLesson}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        nextLesson
                          ? 'bg-brand-secondary text-white'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      Következő
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lessons Tab Content - Mobile-optimized lesson list */}
            {mobileTab === 'lessons' && (
              <div className="bg-white p-4 space-y-4">
                {/* Course Title */}
                <div className="pb-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
                  {course.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.description}</p>
                  )}
                </div>

                {/* Lessons List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Leckék</h3>
                  {lessons
                    .filter(l => !l.status || l.status.toUpperCase() === 'PUBLISHED')
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((lesson) => {
                      const isCurrent = lesson.id === currentLessonId;
                      const isCompleted = completedLessonIds.has(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            onLessonClick(lesson.id);
                            setMobileTab('video');
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                            isCurrent
                              ? 'bg-brand-secondary/10 border-l-4 border-brand-secondary'
                              : 'bg-gray-50 hover:bg-gray-100 border-l-4 border-transparent'
                          }`}
                        >
                          {/* Status Icon */}
                          {isCurrent ? (
                            <PlayCircleIcon className="w-5 h-5 text-brand-secondary flex-shrink-0" />
                          ) : isCompleted ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <EmptyCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              isCurrent ? 'text-brand-secondary' : 'text-gray-900'
                            }`}>
                              {lesson.title}
                            </p>
                            {lesson.duration && Number(lesson.duration) > 0 && (
                              <p className="text-xs text-gray-500">
                                {formatDuration(lesson.duration)}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Bottom Tabs */}
          <MobileBottomTabs activeTab={mobileTab} onTabChange={setMobileTab} courseType={course.type} />
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden md:flex min-h-[100dvh] max-h-[100dvh] bg-black overflow-hidden">
          {/* Left Side Panel with Lesson Navigation */}
          <MasterclassSidePanel
            courseTitle={course.title}
            courseDescription={course.description}
            instructors={instructors.length > 0 ? instructors : (instructor ? [instructor] : [])}
            lessons={lessons}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
            onLessonClick={onLessonClick}
          />

          {/* Right Side - Video and Controls */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top bar with back link and title */}
            <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors"
                >
                  <ArrowLeftIcon size={20} />
                  <span>Vissza</span>
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <h1 className="text-white text-sm font-medium truncate">{course.title}</h1>
              </div>
            </div>

            {/* Video Player Area */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') && (
                <div className="w-full h-full">
                  <NewVideoPlayer
                    src={videoSource}
                    poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                    initialTime={resumePosition}
                    onProgress={onProgress}
                    onEnded={onVideoEnded}
                    accentColor="red"
                  />
                </div>
              )}

              {/* Non-video content - Reading mode with light background */}
              {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
                <div className="w-full h-full overflow-y-auto bg-white">
                  <div className="max-w-3xl mx-auto px-8 py-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.description && (
                      <p className="text-lg text-gray-600 mb-8 leading-relaxed border-l-4 border-brand-secondary pl-4">
                        {currentLesson.description}
                      </p>
                    )}
                    {currentLesson.content && (
                      <div
                        className="prose prose-lg prose-gray max-w-none
                                   prose-headings:text-gray-900 prose-headings:font-bold prose-headings:leading-tight
                                   prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                                   prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                                   prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6 prose-p:text-lg
                                   prose-li:text-gray-700 prose-li:text-lg prose-li:leading-relaxed
                                   prose-ul:my-6 prose-ol:my-6
                                   prose-a:text-brand-secondary prose-a:no-underline hover:prose-a:underline
                                   prose-strong:text-gray-900 prose-strong:font-semibold
                                   prose-blockquote:border-l-brand-secondary prose-blockquote:text-gray-600 prose-blockquote:italic
                                   prose-img:rounded-lg prose-img:shadow-md
                                   [&_*]:!bg-transparent
                                   [&_p]:mb-6 [&_p]:leading-loose [&_p]:text-lg"
                        dangerouslySetInnerHTML={{ __html: formatTextContent(currentLesson.content) }}
                      />
                    )}
                    {!currentLesson.content && (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">Nincs elérhető tartalom ehhez a leckéhez.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation with Previous/Next buttons */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                <button
                  onClick={onPreviousLesson}
                  disabled={!previousLesson}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    previousLesson
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ArrowLeftIcon size={18} />
                  Előző rész
                </button>
                <span className="text-sm text-gray-500">
                  {currentLesson.title}
                </span>
                <button
                  onClick={onNextLesson}
                  disabled={!nextLesson}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    nextLesson
                      ? 'bg-brand-secondary hover:bg-brand-secondary-hover text-white shadow-md'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Következő rész
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // PODCAST Layout: Side panel on left + Video on right (single episode)
  if (isPodcast) {
    return (
      <>
        {/* ========== MOBILE LAYOUT ========== */}
        <div className="md:hidden min-h-[100dvh] flex flex-col bg-black">
          {/* Mobile Top Bar */}
          <div className="flex-shrink-0 bg-gray-900 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="inline-flex items-center text-white/80 hover:text-white">
                <ArrowLeftIcon size={20} />
              </Link>
              <h1 className="text-white text-sm font-medium truncate flex-1">{course.title}</h1>
            </div>
          </div>

          {/* Video Player - Full width on mobile */}
          <div className="flex-1 flex flex-col">
            {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') ? (
              <div className="w-full aspect-video bg-black">
                <NewVideoPlayer
                  src={videoSource}
                  poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                  initialTime={resumePosition}
                  onProgress={onProgress}
                  onEnded={onVideoEnded}
                  accentColor="red"
                />
              </div>
            ) : null}

            {/* Episode Info below video */}
            <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-gray-600 leading-relaxed">{currentLesson.description}</p>
              )}
              {instructor && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {instructor.profilePictureUrl ? (
                      <img src={instructor.profilePictureUrl} alt={instructor.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-sm">{instructor.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{instructor.name}</p>
                    {instructor.title && <p className="text-sm text-gray-500">{instructor.title}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden md:flex min-h-[100dvh] max-h-[100dvh] bg-black overflow-hidden">
          {/* Left Side Panel */}
          <PodcastSidePanel
            courseTitle={course.title}
            courseDescription={course.description}
            instructor={instructor}
            instructors={instructors}
            currentLesson={currentLesson}
            totalDuration={totalDuration}
          />

          {/* Right Side - Video and Controls */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors">
                  <ArrowLeftIcon size={20} />
                  <span>Vissza</span>
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <h1 className="text-white text-sm font-medium truncate">{course.title}</h1>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center">
              {videoSource && (!currentLesson.type || currentLesson.type === 'VIDEO') && (
                <div className="w-full h-full">
                  <NewVideoPlayer
                    src={videoSource}
                    poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
                    initialTime={resumePosition}
                    onProgress={onProgress}
                    onEnded={onVideoEnded}
                    accentColor="red"
                  />
                </div>
              )}

              {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white p-8 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                    {currentLesson.content && (
                      <div className="prose prose-invert prose-lg max-w-none">
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{currentLesson.content}</p>
                      </div>
                    )}
                    {!videoSource && !currentLesson.content && <p className="text-gray-500">Nincs elérhető tartalom</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Default fallback layout (should not normally be reached)
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
        <p className="text-gray-400">Ismeretlen kurzustípus</p>
      </div>
    </div>
  );
}

export default NetflixPlayerLayout;
