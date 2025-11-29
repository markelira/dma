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
import { ArrowLeftIcon, PlayCircleIcon, CheckCircleIcon, EmptyCircleIcon } from '@/components/icons/CoursePlayerIcons';
import { Lesson, CourseType, Instructor, Module } from '@/types';
import { getCourseTypeTerminology } from '@/lib/terminology';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
      <div className="h-screen bg-black flex overflow-hidden">
        {/* Left Side Panel */}
        <WebinarSidePanel
          courseTitle={course.title}
          courseDescription={course.description}
          instructor={instructor}
          currentLesson={currentLesson}
          totalDuration={totalDuration}
        />

        {/* Right Side - Video and Controls */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top bar with back link and title */}
          <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors"
              >
                <ArrowLeftIcon size={20} />
                <span className="hidden sm:inline">Vissza</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-white font-medium truncate">{course.title}</h1>
            </div>
          </div>

          {/* Video Player Area */}
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

            {/* Non-video content or no video available */}
            {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white p-8 max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                  {currentLesson.content && (
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {currentLesson.content}
                      </p>
                    </div>
                  )}
                  {!videoSource && !currentLesson.content && (
                    <p className="text-gray-500">Nincs elérhető tartalom</p>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ACADEMIA Layout: Side panel with lesson navigation + Video on right
  if (isAcademia) {
    return (
      <div className="h-screen bg-black flex overflow-hidden">
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
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top bar with back link and title */}
          <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors"
              >
                <ArrowLeftIcon size={20} />
                <span className="hidden sm:inline">Vissza</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-white font-medium truncate">{course.title}</h1>
            </div>
          </div>

          {/* Video Player Area */}
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

            {/* Non-video content or no video available */}
            {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white p-8 max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                  {currentLesson.content && (
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {currentLesson.content}
                      </p>
                    </div>
                  )}
                  {!videoSource && !currentLesson.content && (
                    <p className="text-gray-500">Nincs elérhető tartalom</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation with Previous/Next buttons */}
          <div className="bg-[#1a1a1a] border-t border-gray-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <button
                onClick={onPreviousLesson}
                disabled={!previousLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  previousLesson
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ArrowLeftIcon size={18} />
                Előző lecke
              </button>

              {/* Lesson indicator */}
              <span className="text-sm text-gray-400">
                Lecke {currentIndex + 1} / {lessons.length}
              </span>

              {/* Next Button */}
              <button
                onClick={onNextLesson}
                disabled={!nextLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  nextLesson
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                Következő lecke
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MASTERCLASS Layout: Side panel with lesson navigation + Video on right + bottom nav
  if (isMasterclass) {
    return (
      <div className="h-screen bg-black flex overflow-hidden">
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
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top bar with back link and title */}
          <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors"
              >
                <ArrowLeftIcon size={20} />
                <span className="hidden sm:inline">Vissza</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-white font-medium truncate">{course.title}</h1>
            </div>
          </div>

          {/* Video Player Area */}
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

            {/* Non-video content or no video available */}
            {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white p-8 max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                  {currentLesson.content && (
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {currentLesson.content}
                      </p>
                    </div>
                  )}
                  {!videoSource && !currentLesson.content && (
                    <p className="text-gray-500">Nincs elérhető tartalom</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation with Previous/Next buttons */}
          <div className="bg-[#1a1a1a] border-t border-gray-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <button
                onClick={onPreviousLesson}
                disabled={!previousLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  previousLesson
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ArrowLeftIcon size={18} />
                Előző lecke
              </button>

              {/* Lesson indicator */}
              <span className="text-sm text-gray-400">
                Lecke {currentIndex + 1} / {lessons.length}
              </span>

              {/* Next Button */}
              <button
                onClick={onNextLesson}
                disabled={!nextLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  nextLesson
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                Következő lecke
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PODCAST Layout: Side panel on left + Video on right (single episode)
  if (isPodcast) {
    return (
      <div className="h-screen bg-black flex overflow-hidden">
        {/* Left Side Panel */}
        <PodcastSidePanel
          courseTitle={course.title}
          courseDescription={course.description}
          instructor={instructor}
          currentLesson={currentLesson}
          totalDuration={totalDuration}
        />

        {/* Right Side - Video and Controls */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top bar with back link and title */}
          <div className="bg-black/80 px-6 py-4 flex-shrink-0 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-red-400 font-medium transition-colors"
              >
                <ArrowLeftIcon size={20} />
                <span className="hidden sm:inline">Vissza</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-white font-medium truncate">{course.title}</h1>
            </div>
          </div>

          {/* Video Player Area */}
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

            {/* Non-video content or no video available */}
            {(!videoSource || (currentLesson.type && currentLesson.type !== 'VIDEO')) && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white p-8 max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                  {currentLesson.content && (
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {currentLesson.content}
                      </p>
                    </div>
                  )}
                  {!videoSource && !currentLesson.content && (
                    <p className="text-gray-500">Nincs elérhető tartalom</p>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
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
