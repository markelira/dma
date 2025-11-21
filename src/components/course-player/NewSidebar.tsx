'use client';

import React, { useState } from 'react';
import { Module, Lesson } from '@/types';
import {
  PlayCircleIcon,
  CheckCircleIcon,
  EmptyCircleIcon,
  DocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@/components/icons/CoursePlayerIcons';

interface NewSidebarProps {
  courseTitle: string;
  modules: Module[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
  progress: number; // 0-100
  onLessonClick: (lessonId: string) => void;
}

/**
 * NewSidebar Component
 * Displays course navigation with modules/lessons in accordion format
 * Matches the screenshot design exactly
 */
export function NewSidebar({
  courseTitle,
  modules,
  currentLessonId,
  completedLessonIds,
  progress,
  onLessonClick,
}: NewSidebarProps) {
  // Track which modules are expanded (default: expand module with current lesson)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const currentModule = modules.find(module =>
      module.lessons?.some(lesson => lesson.id === currentLessonId)
    );
    return new Set(currentModule ? [currentModule.id] : []);
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

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
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module, index) => {
          const isExpanded = expandedModules.has(module.id);
          const lessons = module.lessons || [];

          return (
            <div key={module.id} className="border-b border-gray-200">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                    {index + 1}. MODUL
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {module.title}
                  </div>
                </div>
                <div className="ml-2 text-gray-400">
                  {isExpanded ? (
                    <ChevronUpIcon size={20} />
                  ) : (
                    <ChevronDownIcon size={20} />
                  )}
                </div>
              </button>

              {/* Lessons List (Accordion Content) */}
              {isExpanded && (
                <div className="bg-gray-50">
                  {lessons.map((lesson) => {
                    const isCurrentLesson = lesson.id === currentLessonId;
                    const isCompleted = completedLessonIds.has(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonClick(lesson.id)}
                        className={`w-full flex items-start gap-3 p-4 pl-6 text-left transition-colors ${
                          isCurrentLesson
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100 border-l-4 border-transparent'
                        }`}
                      >
                        {/* Lesson Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getLessonIcon(lesson)}
                        </div>

                        {/* Lesson Content */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              isCurrentLesson
                                ? 'text-blue-900'
                                : isCompleted
                                ? 'text-gray-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {lesson.title}
                          </div>
                          {lesson.type === 'VIDEO' && lesson.duration && (
                            <div className="text-xs text-gray-500 mt-1">
                              Video • {formatDuration(lesson.duration)}
                            </div>
                          )}
                          {lesson.type === 'TEXT' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Olvasmány • {lesson.duration ? `${lesson.duration} perc` : '10 perc'}
                            </div>
                          )}
                          {lesson.type === 'PDF' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Olvasmány • PDF
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          © 2025 DMA
        </div>
      </div>
    </div>
  );
}
