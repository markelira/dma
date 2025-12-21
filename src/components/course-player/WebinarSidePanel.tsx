"use client";

import React from 'react';
import Image from 'next/image';
import { Clock, User, BookOpen } from 'lucide-react';
import { Instructor, Lesson } from '@/types';

interface WebinarSidePanelProps {
  courseTitle: string;
  courseDescription?: string;
  instructor?: Instructor | null; // Backward compatibility
  instructors?: Instructor[]; // Multiple instructors support
  currentLesson: Lesson;
  totalDuration?: number; // in seconds
}

/**
 * WebinarSidePanel - Left side panel for WEBINAR course type
 * Shows mentor info, webinar details, and learning outcomes
 * Netflix-inspired dark theme with red accents
 */
export function WebinarSidePanel({
  courseTitle,
  courseDescription,
  instructor,
  instructors = [],
  currentLesson,
  totalDuration,
}: WebinarSidePanelProps) {
  // Determine which instructors to display
  const displayInstructors = instructors.length > 0 ? instructors : instructor ? [instructor] : [];

  // Selected instructor state for carousel
  const [selectedInstructorIndex, setSelectedInstructorIndex] = React.useState(0);

  return (
    <aside className="w-[380px] flex-shrink-0 bg-[#1a1a1a] min-h-full h-full overflow-y-auto border-r border-gray-800">
      <div className="p-6 space-y-6">
        {/* Mentor/Guest Section - Carousel */}
        {displayInstructors.length > 0 && (
          <>
            {displayInstructors.length > 1 ? (
              <div className="space-y-4">
                {/* Avatars Row - Clickable Carousel */}
                <div className="flex justify-center gap-1">
                  {displayInstructors.map((inst, index) => (
                    <button
                      key={inst.id}
                      onClick={() => setSelectedInstructorIndex(index)}
                      className="relative w-20 h-20 transition-all cursor-pointer hover:scale-105 focus:outline-none"
                    >
                      {inst.profilePictureUrl ? (
                        <Image
                          src={inst.profilePictureUrl}
                          alt={inst.name}
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
                  const inst = displayInstructors[selectedInstructorIndex];
                  return (
                    <div className="text-center space-y-3">
                      {/* Name */}
                      <h3 className="text-lg font-bold text-white">
                        {inst.name}
                      </h3>

                      {/* Title */}
                      {inst.title && (
                        <p className="text-sm text-gray-400">
                          {inst.title}
                        </p>
                      )}

                      {/* Bio */}
                      {inst.bio && (
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {inst.bio}
                        </p>
                      )}

                      {/* Badge */}
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                          {inst.role === 'SZEREPLŐ' ? 'Vendég' : 'Mentor'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Single Instructor */
              <div className="space-y-3">
                {/* Photo */}
                <div className="flex justify-center">
                  {displayInstructors[0].profilePictureUrl ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-red-600/50">
                      <Image
                        src={displayInstructors[0].profilePictureUrl}
                        alt={displayInstructors[0].name}
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

                {/* Name */}
                <h3 className="text-lg font-bold text-white text-center">
                  {displayInstructors[0].name}
                </h3>

                {/* Title */}
                {displayInstructors[0].title && (
                  <p className="text-sm text-gray-400 text-center">
                    {displayInstructors[0].title}
                  </p>
                )}

                {/* Bio */}
                {displayInstructors[0].bio && (
                  <p className="text-sm text-gray-300 text-center leading-relaxed">
                    {displayInstructors[0].bio}
                  </p>
                )}

                {/* Badge */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                    {displayInstructors[0].role === 'SZEREPLŐ' ? 'Vendég' : 'Mentor'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* About Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            A WEBINÁRRÓL
          </h4>
          <p className="text-gray-300 leading-relaxed text-sm">
            {courseDescription || currentLesson.description || 'Nincs leírás.'}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default WebinarSidePanel;
