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
    <aside className="w-[380px] flex-shrink-0 bg-[#1a1a1a] h-full overflow-y-auto border-r border-gray-800">
      <div className="p-6 space-y-6">
        {/* Instructors Section - All Instructors Displayed */}
        {instructors.length > 0 && (
          <>
            {instructors.length > 1 ? (
              <div className="space-y-4">
                {/* Avatars Row - Clickable Carousel */}
                <div className="flex justify-center gap-1">
                  {instructors.map((instructor, index) => (
                    <button
                      key={instructor.id}
                      onClick={() => setSelectedInstructorIndex(index)}
                      className="relative w-20 h-20 transition-all cursor-pointer hover:scale-105 focus:outline-none"
                    >
                      {instructor.profilePictureUrl ? (
                        <Image
                          src={instructor.profilePictureUrl}
                          alt={instructor.name}
                          fill
                          className={`rounded-full object-cover transition-all ${
                            index === selectedInstructorIndex
                              ? 'ring-4 ring-red-600'
                              : 'ring-2 ring-red-600/30 hover:ring-red-600/50'
                          }`}
                        />
                      ) : (
                        <div className={`w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center transition-all ${
                          index === selectedInstructorIndex
                            ? 'ring-4 ring-red-600'
                            : 'ring-2 ring-red-600/30 hover:ring-red-600/50'
                        }`}>
                          <User className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Selected Instructor Info Only */}
                {(() => {
                  const instructor = instructors[selectedInstructorIndex];
                  return (
                    <div className="text-center space-y-3">
                      {/* Instructor Name */}
                      <h3 className="text-lg font-bold text-white">
                        {instructor.name}
                      </h3>

                      {/* Instructor Title */}
                      {instructor.title && (
                        <p className="text-sm text-gray-400">
                          {instructor.title}
                        </p>
                      )}

                      {/* Instructor Bio */}
                      {instructor.bio && (
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {instructor.bio}
                        </p>
                      )}

                      {/* Mentor/Vendég Badge */}
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                          {instructor.role === 'SZEREPLŐ' ? 'Vendég' : 'Mentor'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Single Instructor - Keep current centered layout */
              <div className="space-y-3">
                {/* Instructor Photo */}
                <div className="flex justify-center">
                  {instructors[0].profilePictureUrl ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-red-600/50">
                      <Image
                        src={instructors[0].profilePictureUrl}
                        alt={instructors[0].name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center ring-2 ring-red-600/50">
                      <User className="w-10 h-10 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Instructor Name */}
                <h3 className="text-lg font-bold text-white text-center">
                  {instructors[0].name}
                </h3>

                {/* Instructor Title (Titulus) */}
                {instructors[0].title && (
                  <p className="text-sm text-gray-400 text-center">
                    {instructors[0].title}
                  </p>
                )}

                {/* Instructor Bio */}
                {instructors[0].bio && (
                  <p className="text-sm text-gray-300 text-center leading-relaxed">
                    {instructors[0].bio}
                  </p>
                )}

                {/* Mentor/Vendég Badge */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                    {instructors[0].role === 'SZEREPLŐ' ? 'Vendég' : 'Mentor'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* About Section - Collapsible */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            AZ AKADÉMIÁRÓL
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
                        <p className={`text-sm font-medium ${
                          isCurrent ? 'text-white' : 'text-gray-300'
                        }`}>
                          {lesson.title}
                        </p>
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
