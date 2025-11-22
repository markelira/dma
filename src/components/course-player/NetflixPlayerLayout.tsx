"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NewVideoPlayer } from './NewVideoPlayer';
import { NewLessonNavigation } from './NewLessonNavigation';
import { ArrowLeftIcon, PlayCircleIcon, CheckCircleIcon, EmptyCircleIcon } from '@/components/icons/CoursePlayerIcons';
import { Lesson, CourseType } from '@/types';
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
}

/**
 * Netflix-style Player Layout for WEBINAR and PODCAST course types
 * Full-width video player with minimal UI, expandable episode list below
 */
export function NetflixPlayerLayout({
  course,
  lessons,
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
}: NetflixPlayerLayoutProps) {
  const router = useRouter();
  const [episodesExpanded, setEpisodesExpanded] = useState(false);

  const terminology = course.type ? getCourseTypeTerminology(course.type) : null;
  const lessonLabel = terminology?.lessonLabel || 'Lecke';
  const lessonsLabel = terminology?.lessonsLabel || 'Leckék';
  const contentLabel = terminology?.contentLabel || 'Tartalom';

  // Get lesson status icon
  const getLessonStatusIcon = (lessonId: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <PlayCircleIcon className="w-5 h-5 text-blue-500" />;
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

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar with back link and title */}
      <div className="bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
          >
            <ArrowLeftIcon size={20} />
            <span className="hidden sm:inline">Vissza</span>
          </Link>
          <div className="h-6 w-px bg-white/20" />
          <h1 className="text-white font-medium truncate">{course.title}</h1>
        </div>
      </div>

      {/* Full-width video player */}
      <div className="w-full aspect-video max-h-[80vh] bg-black">
        {videoSource && currentLesson.type === 'VIDEO' && (
          <NewVideoPlayer
            src={videoSource}
            poster={currentLesson.thumbnailUrl || currentLesson.muxThumbnailUrl}
            initialTime={resumePosition}
            onProgress={onProgress}
            onEnded={onVideoEnded}
          />
        )}

        {/* Non-video content placeholder */}
        {currentLesson.type !== 'VIDEO' && (
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
            </div>
          </div>
        )}
      </div>

      {/* Content area below video */}
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Lesson info */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {lessonLabel} {currentIndex + 1} / {lessons.length}
                </span>
                {currentLesson.duration && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">
                      {formatDuration(currentLesson.duration)}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-gray-400 leading-relaxed max-w-3xl">
                  {currentLesson.description}
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex-shrink-0">
              <NewLessonNavigation
                hasPrevious={!!previousLesson}
                hasNext={!!nextLesson}
                onPrevious={onPreviousLesson}
                onNext={onNextLesson}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Haladás</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Expandable episodes list */}
          <div className="border-t border-gray-800 pt-6">
            <button
              onClick={() => setEpisodesExpanded(!episodesExpanded)}
              className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-900/50 rounded-lg px-4 -mx-4 transition-colors"
            >
              <span className="font-semibold text-lg">
                {lessonsLabel} ({lessons.length})
              </span>
              {episodesExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {episodesExpanded && (
              <div className="mt-4 space-y-2">
                {lessons.map((lesson, index) => {
                  const isCurrent = lesson.id === currentLessonId;
                  const isCompleted = completedLessonIds.has(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isCurrent && onLessonClick(lesson.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-gray-900/50 hover:bg-gray-800/70 border border-transparent'
                      }`}
                    >
                      {/* Status icon */}
                      {getLessonStatusIcon(lesson.id, isCurrent)}

                      {/* Episode number */}
                      <span className={`font-bold text-xl min-w-[2rem] ${
                        isCurrent ? 'text-blue-400' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>

                      {/* Episode info */}
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isCurrent ? 'text-white' : 'text-gray-200'}`}>
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      {lesson.duration && (
                        <span className="text-sm text-gray-500">
                          {formatDuration(lesson.duration)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetflixPlayerLayout;
