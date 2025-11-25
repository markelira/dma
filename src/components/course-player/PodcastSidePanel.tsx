"use client";

import React from 'react';
import Image from 'next/image';
import { Clock, User, Mic } from 'lucide-react';
import { Instructor, Lesson } from '@/types';

interface PodcastSidePanelProps {
  courseTitle: string;
  courseDescription?: string;
  instructor?: Instructor | null;
  currentLesson: Lesson;
  totalDuration?: number; // in seconds
}

/**
 * PodcastSidePanel - Left side panel for PODCAST course type
 * Shows guest/speaker info, podcast details, and episode metadata
 * Netflix-inspired dark theme with red accents
 */
export function PodcastSidePanel({
  courseTitle,
  courseDescription,
  instructor,
  currentLesson,
  totalDuration,
}: PodcastSidePanelProps) {
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

  return (
    <aside className="w-[380px] flex-shrink-0 bg-[#1a1a1a] min-h-screen overflow-y-auto border-r border-gray-800">
      <div className="p-6 space-y-6">
        {/* Guest/Speaker Card */}
        {instructor && (
          <div className="space-y-4">
            {/* Guest Photo */}
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

            {/* Guest Info */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{instructor.name}</h3>
              {instructor.title && (
                <p className="text-sm text-gray-400 mt-1">{instructor.title}</p>
              )}
              <span className="inline-block mt-2 px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full">
                Szereplő
              </span>
            </div>

            {/* Guest Bio */}
            {instructor.bio && (
              <p className="text-sm text-gray-400 leading-relaxed text-center">
                {instructor.bio}
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* Podcast Details */}
        <div className="space-y-4">
          {/* Duration */}
          {duration && (
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hossz</p>
                <p className="font-medium">{duration}</p>
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
              <Mic className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Típus</p>
              <p className="font-medium">Podcast</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-800" />

        {/* About Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            A podcastról
          </h4>
          <p className="text-gray-300 leading-relaxed text-sm">
            {courseDescription || currentLesson.description || 'Nincs leírás.'}
          </p>
        </div>

        {/* Current Episode */}
        <div className="h-px bg-gray-800" />
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Most játszva
          </h4>
          <p className="text-white font-medium">{currentLesson.title}</p>
          {currentLesson.duration && (
            <p className="text-xs text-gray-500">
              {formatDuration(currentLesson.duration)}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default PodcastSidePanel;
