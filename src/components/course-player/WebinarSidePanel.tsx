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
  // Format duration from seconds to readable format
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} óra ${mins} perc`;
    }
    return `${mins} perc`;
  };

  const duration = formatDuration(totalDuration || currentLesson.duration);

  // Determine which instructors to display
  const displayInstructors = instructors.length > 0 ? instructors : instructor ? [instructor] : [];

  return (
    <aside className="w-[380px] flex-shrink-0 bg-[#1a1a1a] h-full overflow-y-auto border-r border-gray-800">
      <div className="p-6 space-y-6">
        {/* Mentor/Guest Section - All Displayed */}
        {displayInstructors.length > 0 && (
          <div className="space-y-6">
            {displayInstructors.map((inst) => (
              <div key={inst.id} className="space-y-3">
                {/* Photo */}
                <div className="flex justify-center">
                  {inst.profilePictureUrl ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-red-600/50">
                      <Image
                        src={inst.profilePictureUrl}
                        alt={inst.name}
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
                  {inst.name}
                </h3>

                {/* Title */}
                {inst.title && (
                  <p className="text-sm text-gray-400 text-center">
                    {inst.title}
                  </p>
                )}

                {/* Bio */}
                {inst.bio && (
                  <p className="text-sm text-gray-300 text-center leading-relaxed">
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
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* Webinar Details */}
        <div className="space-y-4">
          {/* Duration */}
          {duration && (
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Időtartam</p>
                <p className="font-medium">{duration}</p>
              </div>
            </div>
          )}
        </div>

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
