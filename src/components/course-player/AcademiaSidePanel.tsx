"use client";

import React from 'react';
import Image from 'next/image';
import { User, PlayCircle, CheckCircle, Circle } from 'lucide-react';
import { Instructor, Module, Lesson } from '@/types';

interface AcademiaSidePanelProps {
  courseTitle: string;
  courseDescription?: string;
  instructor?: Instructor | null;
  modules: Module[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
  onLessonClick: (lessonId: string) => void;
}

/**
 * AcademiaSidePanel - Left side panel for ACADEMIA course type
 * Shows instructor info, course description, and lesson navigation
 * Netflix-inspired dark theme with red accents
 */
export function AcademiaSidePanel({
  courseTitle,
  courseDescription,
  instructor,
  modules,
  currentLessonId,
  completedLessonIds,
  onLessonClick,
}: AcademiaSidePanelProps) {
  // Format duration from seconds to readable format
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Get lesson status icon
  const getLessonStatusIcon = (lessonId: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <PlayCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    }
    if (completedLessonIds.has(lessonId)) {
      return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
    }
    return <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />;
  };

  return (
    <aside className="w-[380px] flex-shrink-0 bg-[#1a1a1a] min-h-screen overflow-y-auto border-r border-gray-800">
      <div className="p-6 space-y-6">
        {/* Instructor Card */}
        {instructor && (
          <div className="space-y-4">
            {/* Instructor Photo */}
            <div className="flex justify-center">
              {instructor.profilePictureUrl ? (
                <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-red-600/50">
                  <Image
                    src={instructor.profilePictureUrl}
                    alt={instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center ring-2 ring-red-600/50">
                  <User className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* Instructor Info */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{instructor.name}</h3>
              {instructor.title && (
                <p className="text-sm text-gray-400 mt-1">{instructor.title}</p>
              )}
              <span className="inline-block mt-2 px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                {instructor.role === 'SZEREPLŐ' ? 'Szereplő' : 'Oktató'}
              </span>
            </div>

            {/* Instructor Bio */}
            {instructor.bio && (
              <p className="text-sm text-gray-400 leading-relaxed text-center">
                {instructor.bio}
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* About Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            A kurzusról
          </h4>
          <p className="text-gray-300 leading-relaxed text-sm">
            {courseDescription || 'Nincs leírás.'}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* Lesson Navigation */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Leckék
          </h4>

          {/* Modules with lessons */}
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => {
              const publishedLessons = module.lessons?.filter(
                l => !l.status || l.status.toUpperCase() === 'PUBLISHED'
              ) || [];

              if (publishedLessons.length === 0) return null;

              return (
                <div key={module.id} className="space-y-2">
                  {/* Module Header */}
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {moduleIndex + 1}. Modul: {module.title}
                  </h5>

                  {/* Lessons in this module */}
                  <div className="space-y-1">
                    {publishedLessons
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((lesson) => {
                        const isCurrent = lesson.id === currentLessonId;
                        const isCompleted = completedLessonIds.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => !isCurrent && onLessonClick(lesson.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                              isCurrent
                                ? 'bg-red-600/20 border-l-2 border-red-500'
                                : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                            }`}
                          >
                            {/* Status Icon */}
                            {getLessonStatusIcon(lesson.id, isCurrent)}

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isCurrent ? 'text-white' : 'text-gray-300'
                              }`}>
                                {lesson.title}
                              </p>
                              {lesson.duration && (
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
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AcademiaSidePanel;
