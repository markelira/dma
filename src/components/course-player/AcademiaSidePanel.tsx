"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { User, PlayCircle, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Instructor, Module, Lesson } from '@/types';

interface AcademiaSidePanelProps {
  courseTitle: string;
  courseDescription?: string;
  instructors?: Instructor[];
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
  instructors = [],
  modules,
  currentLessonId,
  completedLessonIds,
  onLessonClick,
}: AcademiaSidePanelProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedInstructorIndex, setSelectedInstructorIndex] = useState(0);

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

  // Selected instructor for main display
  const selectedInstructor = instructors[selectedInstructorIndex];
  const hasMultipleInstructors = instructors.length > 1;

  return (
    <aside className="w-[380px] flex-shrink-0 bg-[#1a1a1a] h-full overflow-y-auto border-r border-gray-800">
      <div className="p-6 space-y-6">
        {/* Instructors Section */}
        {instructors.length > 0 && (
          <div className="space-y-4">
            {/* Multiple Instructors - Stacked Avatars */}
            {hasMultipleInstructors ? (
              <div className="space-y-4">
                {/* Stacked avatar row */}
                <div className="flex justify-center">
                  <div className="flex -space-x-3">
                    {instructors.map((instructor, index) => (
                      <button
                        key={instructor.id}
                        onClick={() => setSelectedInstructorIndex(index)}
                        className={`relative transition-all ${
                          index === selectedInstructorIndex
                            ? 'z-10 scale-110'
                            : 'z-0 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {instructor.profilePictureUrl ? (
                          <div className={`relative w-16 h-16 rounded-full overflow-hidden ring-2 ${
                            index === selectedInstructorIndex
                              ? 'ring-red-600'
                              : 'ring-gray-700'
                          }`}>
                            <Image
                              src={instructor.profilePictureUrl}
                              alt={instructor.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center ring-2 ${
                            index === selectedInstructorIndex
                              ? 'ring-red-600'
                              : 'ring-gray-700'
                          }`}>
                            <User className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Instructor Info */}
                {selectedInstructor && (
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{selectedInstructor.name}</h3>
                    {selectedInstructor.title && (
                      <p className="text-sm text-gray-400 mt-1">{selectedInstructor.title}</p>
                    )}
                    <span className="inline-block mt-2 px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                      {selectedInstructor.role === 'SZEREPLŐ' ? 'Vendég' : 'Mentor'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedInstructorIndex + 1} / {instructors.length} oktató
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Single Instructor - Full Display */
              selectedInstructor && (
                <>
                  {/* Instructor Photo */}
                  <div className="flex justify-center">
                    {selectedInstructor.profilePictureUrl ? (
                      <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-red-600/50">
                        <Image
                          src={selectedInstructor.profilePictureUrl}
                          alt={selectedInstructor.name}
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
                    <h3 className="text-lg font-bold text-white">{selectedInstructor.name}</h3>
                    {selectedInstructor.title && (
                      <p className="text-sm text-gray-400 mt-1">{selectedInstructor.title}</p>
                    )}
                    <span className="inline-block mt-2 px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                      {selectedInstructor.role === 'SZEREPLŐ' ? 'Vendég' : 'Mentor'}
                    </span>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* About Section - Collapsible */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Leírás
          </h4>
          {courseDescription ? (
            <div>
              <p className={`text-gray-300 leading-relaxed text-sm ${
                !descriptionExpanded ? 'line-clamp-2' : ''
              }`}>
                {courseDescription}
              </p>
              {courseDescription.length > 100 && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="flex items-center gap-1 text-red-400 text-xs font-medium mt-2 hover:text-red-300 transition-colors"
                >
                  {descriptionExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Kevesebb
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Több
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nincs leírás.</p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* Lesson Navigation */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Részek
          </h4>

          {/* Lessons (flat list without module headers) */}
          <div className="space-y-1">
            {modules.map((module) => {
              const publishedLessons = module.lessons?.filter(
                l => !l.status || l.status.toUpperCase() === 'PUBLISHED'
              ) || [];

              return publishedLessons
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((lesson) => {
                  const isCurrent = lesson.id === currentLessonId;

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
                });
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AcademiaSidePanel;
