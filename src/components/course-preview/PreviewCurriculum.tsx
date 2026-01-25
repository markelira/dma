'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play, FileText, Clock } from 'lucide-react';
import type { Lesson, Module } from '@/types';

interface PreviewCurriculumProps {
  /** Flat lessons array (preferred) */
  lessons?: Lesson[];
  /** Modules array (legacy) */
  modules?: Module[];
  /** Maximum lessons to show initially per module */
  maxLessonsInitial?: number;
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';

  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 0) {
    return remainingMins > 0 ? `${hours} óra ${remainingMins} perc` : `${hours} óra`;
  }
  return `${mins} perc`;
}

/**
 * Get lesson type icon
 */
function getLessonIcon(lesson: Lesson) {
  const iconClass = "w-4 h-4 flex-shrink-0";

  if (lesson.type === 'VIDEO' || lesson.muxPlaybackId || lesson.videoUrl) {
    return <Play className={`${iconClass} text-blue-500`} />;
  }
  if (lesson.type === 'PDF' || lesson.type === 'READING') {
    return <FileText className={`${iconClass} text-gray-400`} />;
  }
  return <FileText className={`${iconClass} text-gray-400`} />;
}

/**
 * Single lesson item
 */
function LessonItem({ lesson }: { lesson: Lesson }) {
  const duration = lesson.muxDuration || lesson.duration || 0;

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
      {getLessonIcon(lesson)}
      <span className="text-sm text-gray-700 flex-1 line-clamp-1">
        {lesson.title}
      </span>
      {duration > 0 && (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}

/**
 * Collapsible module section
 */
function ModuleSection({
  title,
  lessons,
  moduleIndex,
  maxLessonsInitial,
}: {
  title: string;
  lessons: Lesson[];
  moduleIndex: number;
  maxLessonsInitial: number;
}) {
  const [isExpanded, setIsExpanded] = useState(moduleIndex === 0); // First module open by default
  const [showAll, setShowAll] = useState(false);

  const publishedLessons = lessons.filter(l => l.status === 'PUBLISHED' || !l.status);
  const visibleLessons = showAll ? publishedLessons : publishedLessons.slice(0, maxLessonsInitial);
  const hasMore = publishedLessons.length > maxLessonsInitial;

  const totalDuration = publishedLessons.reduce((sum, l) => sum + (l.muxDuration || l.duration || 0), 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Module header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 line-clamp-1">
            {moduleIndex + 1}. {title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span>{publishedLessons.length} lecke</span>
            {totalDuration > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span>{formatDuration(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Lessons list */}
      {isExpanded && (
        <div className="p-2 bg-white">
          {visibleLessons.map((lesson, idx) => (
            <LessonItem key={lesson.id || idx} lesson={lesson} />
          ))}

          {/* Show more button */}
          {hasMore && !showAll && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(true);
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2 font-medium"
            >
              + {publishedLessons.length - maxLessonsInitial} további lecke
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PreviewCurriculum - Collapsible curriculum display for course preview
 * Supports both flat lessons and module-based structures
 */
export function PreviewCurriculum({
  lessons,
  modules,
  maxLessonsInitial = 5,
}: PreviewCurriculumProps) {
  // Use flat lessons if available, otherwise use modules
  if (lessons && lessons.length > 0) {
    // Create a single "module" from flat lessons
    const publishedLessons = lessons
      .filter(l => l.status === 'PUBLISHED' || !l.status)
      .sort((a, b) => a.order - b.order);

    if (publishedLessons.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nincs elérhető lecke
        </div>
      );
    }

    // For flat lessons, show as a simple list without module wrapper
    const totalDuration = publishedLessons.reduce((sum, l) => sum + (l.muxDuration || l.duration || 0), 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="font-medium">{publishedLessons.length} lecke</span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(totalDuration)}
            </span>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {publishedLessons.slice(0, maxLessonsInitial).map((lesson, idx) => (
              <LessonItem key={lesson.id || idx} lesson={lesson} />
            ))}
          </div>

          {publishedLessons.length > maxLessonsInitial && (
            <div className="p-3 bg-gray-50 text-center">
              <span className="text-sm text-gray-500">
                + {publishedLessons.length - maxLessonsInitial} további lecke
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Module-based structure
  if (modules && modules.length > 0) {
    const sortedModules = [...modules]
      .filter(m => m.status === 'PUBLISHED' || !m.status)
      .sort((a, b) => a.order - b.order);

    if (sortedModules.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nincs elérhető modul
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedModules.map((module, idx) => (
          <ModuleSection
            key={module.id || idx}
            title={module.title}
            lessons={module.lessons || []}
            moduleIndex={idx}
            maxLessonsInitial={maxLessonsInitial}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-gray-500">
      Nincs elérhető tananyag
    </div>
  );
}
