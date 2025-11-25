"use client";

import React, { useMemo } from 'react';
import { Lesson, CourseType } from '@/types';
import {
  PlayCircleIcon,
  CheckCircleIcon,
  EmptyCircleIcon,
  DocumentIcon,
} from '@/components/icons/CoursePlayerIcons';
import { getCourseTypeTerminology } from '@/lib/terminology';
import { Import, BookOpen } from 'lucide-react';

interface MasterclassSidebarProps {
  courseTitle: string;
  courseType?: CourseType;
  lessons: Lesson[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
  progress: number; // 0-100
  onLessonClick: (lessonId: string) => void;
  // For imported lessons - map of lessonId to source course name
  sourceCourseNames?: Record<string, string>;
}

/**
 * MasterclassSidebar Component
 * Flat lesson list with imported lesson indicators
 * Used for MASTERCLASS and other flat-structure courses
 */
export function MasterclassSidebar({
  courseTitle,
  courseType,
  lessons,
  currentLessonId,
  completedLessonIds,
  progress,
  onLessonClick,
  sourceCourseNames = {},
}: MasterclassSidebarProps) {
  const terminology = courseType ? getCourseTypeTerminology(courseType) : null;
  const lessonLabel = terminology?.lessonLabel || 'Lecke';
  const lessonsLabel = terminology?.lessonsLabel || 'Leckék';

  // Group lessons by source course for display
  const groupedLessons = useMemo(() => {
    const groups: { source: string | null; lessons: Lesson[] }[] = [];
    let currentGroup: { source: string | null; lessons: Lesson[] } | null = null;

    lessons.forEach((lesson) => {
      const sourceId = (lesson as any).sourceCourseid || (lesson as any).sourceCourseId;
      const sourceName = sourceId ? sourceCourseNames[sourceId] : null;

      if (currentGroup === null || currentGroup.source !== sourceName) {
        currentGroup = { source: sourceName, lessons: [lesson] };
        groups.push(currentGroup);
      } else {
        currentGroup.lessons.push(lesson);
      }
    });

    return groups;
  }, [lessons, sourceCourseNames]);

  const getLessonIcon = (lesson: Lesson) => {
    const isCurrentLesson = lesson.id === currentLessonId;
    const isCompleted = completedLessonIds.has(lesson.id);

    // Reading/document type lessons
    if (lesson.type === 'TEXT' || lesson.type === 'READING' || lesson.type === 'PDF') {
      return <DocumentIcon size={20} />;
    }

    // Current lesson - blue play icon
    if (isCurrentLesson) {
      return <PlayCircleIcon size={20} />;
    }

    // Completed lesson - green checkmark
    if (isCompleted) {
      return <CheckCircleIcon size={20} />;
    }

    // Default - empty circle
    return <EmptyCircleIcon size={20} />;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLessonTypeLabel = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'VIDEO':
        return 'Videó';
      case 'TEXT':
      case 'READING':
        return 'Olvasmány';
      case 'PDF':
        return 'PDF';
      case 'AUDIO':
        return 'Hanganyag';
      default:
        return 'Tartalom';
    }
  };

  // Get global lesson index for display
  const getLessonIndex = (lessonId: string) => {
    return lessons.findIndex(l => l.id === lessonId) + 1;
  };

  return (
    <div className="flex h-full w-96 flex-col bg-white border-r border-gray-200">
      {/* Course Header */}
      <div className="flex-shrink-0 border-b border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 leading-tight mb-3">
          {courseTitle}
        </h1>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-gray-600">
            <span>{Math.round(progress)}% Kész</span>
            <span>{lessons.length} {lessonsLabel.toLowerCase()}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-secondary/50 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto">
        {groupedLessons.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Source course header (if imported) */}
            {group.source && (
              <div className="px-4 py-3 bg-brand-secondary/5 border-b border-brand-secondary/10 flex items-center gap-2">
                <Import className="w-4 h-4 text-brand-secondary" />
                <span className="text-xs font-medium text-brand-secondary-hover">
                  Importálva: {group.source}
                </span>
              </div>
            )}

            {/* Lessons in this group */}
            {group.lessons.map((lesson) => {
              const isCurrentLesson = lesson.id === currentLessonId;
              const isCompleted = completedLessonIds.has(lesson.id);
              const isImported = !!(lesson as any).isImported || !!(lesson as any).sourceCourseid || !!(lesson as any).sourceCourseId;
              const lessonIndex = getLessonIndex(lesson.id);

              return (
                <button
                  key={lesson.id}
                  onClick={() => onLessonClick(lesson.id)}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-gray-100 ${
                    isCurrentLesson
                      ? 'bg-brand-secondary/5 border-l-4 border-l-brand-secondary'
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  } ${isImported && !isCurrentLesson ? 'bg-brand-secondary/5/30' : ''}`}
                >
                  {/* Lesson number */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrentLesson
                      ? 'bg-brand-secondary/50 text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {lessonIndex}
                  </div>

                  {/* Lesson Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getLessonIcon(lesson)}
                  </div>

                  {/* Lesson Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium line-clamp-2 ${
                          isCurrentLesson
                            ? 'text-brand-secondary-hover'
                            : isCompleted
                            ? 'text-gray-700'
                            : 'text-gray-900'
                        }`}
                      >
                        {lesson.title}
                      </span>
                      {isImported && !group.source && (
                        <Import className="w-3 h-3 text-white0 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{getLessonTypeLabel(lesson)}</span>
                      {lesson.duration && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(lesson.duration)}</span>
                        </>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {/* Empty state */}
        {lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">
              Még nincs {lessonLabel.toLowerCase()} hozzáadva
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          DMA Masterclass
        </div>
      </div>
    </div>
  );
}

export default MasterclassSidebar;
