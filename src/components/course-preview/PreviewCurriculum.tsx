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
  /** Dark mode styling */
  darkMode?: boolean;
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
function getLessonIcon(lesson: Lesson, darkMode: boolean) {
  const iconClass = `w-4 h-4 flex-shrink-0 ${darkMode ? 'text-brand-secondary' : 'text-blue-500'}`;
  const docClass = `w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`;

  if (lesson.type === 'VIDEO' || lesson.muxPlaybackId || lesson.videoUrl) {
    return <Play className={iconClass} />;
  }
  if (lesson.type === 'PDF' || lesson.type === 'READING') {
    return <FileText className={docClass} />;
  }
  return <FileText className={docClass} />;
}

/**
 * Single lesson item
 */
function LessonItem({ lesson, darkMode }: { lesson: Lesson; darkMode: boolean }) {
  const duration = lesson.muxDuration || lesson.duration || 0;

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
      darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
    }`}>
      {getLessonIcon(lesson, darkMode)}
      <span className={`text-sm flex-1 line-clamp-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {lesson.title}
      </span>
      {duration > 0 && (
        <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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
  darkMode,
}: {
  title: string;
  lessons: Lesson[];
  moduleIndex: number;
  maxLessonsInitial: number;
  darkMode: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(moduleIndex === 0); // First module open by default
  const [showAll, setShowAll] = useState(false);

  const publishedLessons = lessons.filter(l => l.status === 'PUBLISHED' || !l.status);
  const visibleLessons = showAll ? publishedLessons : publishedLessons.slice(0, maxLessonsInitial);
  const hasMore = publishedLessons.length > maxLessonsInitial;

  const totalDuration = publishedLessons.reduce((sum, l) => sum + (l.muxDuration || l.duration || 0), 0);

  return (
    <div className={`rounded-lg overflow-hidden ${darkMode ? 'border border-gray-800' : 'border border-gray-200'}`}>
      {/* Module header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 transition-colors text-left ${
          darkMode
            ? 'bg-gray-800/50 hover:bg-gray-800'
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {moduleIndex + 1}. {title}
          </h4>
          <div className={`flex items-center gap-2 text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            <span>{publishedLessons.length} videó</span>
            {totalDuration > 0 && (
              <>
                <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>|</span>
                <span>{formatDuration(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        )}
      </button>

      {/* Lessons list */}
      {isExpanded && (
        <div className={`p-2 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
          {visibleLessons.map((lesson, idx) => (
            <LessonItem key={lesson.id || idx} lesson={lesson} darkMode={darkMode} />
          ))}

          {/* Show more button */}
          {hasMore && !showAll && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(true);
              }}
              className="w-full text-center text-sm text-brand-secondary hover:text-brand-secondary-hover py-2 font-medium"
            >
              + {publishedLessons.length - maxLessonsInitial} további videó
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
  darkMode = false,
}: PreviewCurriculumProps) {
  // Use flat lessons if available, otherwise use modules
  if (lessons && lessons.length > 0) {
    // Create a single "module" from flat lessons
    const publishedLessons = lessons
      .filter(l => l.status === 'PUBLISHED' || !l.status)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (publishedLessons.length === 0) {
      return (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Nincs elérhető videó
        </div>
      );
    }

    // For flat lessons, show as a simple list without module wrapper
    const totalDuration = publishedLessons.reduce((sum, l) => sum + (l.muxDuration || l.duration || 0), 0);
    const [showAll, setShowAll] = useState(false);
    const visibleLessons = showAll ? publishedLessons : publishedLessons.slice(0, maxLessonsInitial);

    return (
      <div className="space-y-4">
        <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="font-medium">{publishedLessons.length} videó</span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(totalDuration)}
            </span>
          )}
        </div>

        <div className={`rounded-lg overflow-hidden ${darkMode ? 'border border-gray-800' : 'border border-gray-200'}`}>
          <div className={darkMode ? 'divide-y divide-gray-800' : 'divide-y divide-gray-100'}>
            {visibleLessons.map((lesson, idx) => (
              <LessonItem key={lesson.id || idx} lesson={lesson} darkMode={darkMode} />
            ))}
          </div>

          {publishedLessons.length > maxLessonsInitial && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className={`w-full p-3 text-center ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
            >
              <span className="text-sm text-brand-secondary hover:text-brand-secondary-hover font-medium">
                + {publishedLessons.length - maxLessonsInitial} további videó
              </span>
            </button>
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
        <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
            darkMode={darkMode}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
      Nincs elérhető tananyag
    </div>
  );
}
