'use client';

import React from 'react';
import Image from 'next/image';
import { Play, FileText, Headphones, Download, HelpCircle } from 'lucide-react';

export interface NetflixEpisodeLesson {
  id: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'VIDEO' | 'QUIZ' | 'READING' | 'PDF' | 'AUDIO' | 'DOWNLOAD';
  duration?: number; // Duration in seconds
  muxDuration?: number; // Mux-reported duration (more accurate)
  muxThumbnailUrl?: string;
  muxPlaybackId?: string;
}

interface NetflixEpisodeCardProps {
  lesson: NetflixEpisodeLesson;
  episodeNumber: number;
  courseThumbnail?: string;
}

// Format seconds to "MM:SS" or "H:MM:SS"
const formatDuration = (seconds?: number): string | null => {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get lesson type icon
const getLessonTypeIcon = (type: NetflixEpisodeLesson['type']) => {
  switch (type) {
    case 'VIDEO':
      return Play;
    case 'AUDIO':
      return Headphones;
    case 'TEXT':
    case 'READING':
    case 'PDF':
      return FileText;
    case 'DOWNLOAD':
      return Download;
    case 'QUIZ':
      return HelpCircle;
    default:
      return Play;
  }
};

// Get lesson type label in Hungarian
const getLessonTypeLabel = (type: NetflixEpisodeLesson['type']): string => {
  switch (type) {
    case 'VIDEO':
      return 'Videó';
    case 'AUDIO':
      return 'Hang';
    case 'TEXT':
      return 'Szöveg';
    case 'READING':
      return 'Olvasmány';
    case 'PDF':
      return 'PDF';
    case 'DOWNLOAD':
      return 'Letöltés';
    case 'QUIZ':
      return 'Kvíz';
    default:
      return '';
  }
};

export function NetflixEpisodeCard({
  lesson,
  episodeNumber,
  courseThumbnail
}: NetflixEpisodeCardProps) {
  // Use muxDuration if available, otherwise fall back to duration
  const durationSeconds = lesson.muxDuration || lesson.duration;
  const formattedDuration = formatDuration(durationSeconds);

  // Use mux thumbnail or fall back to course thumbnail
  const thumbnailUrl = lesson.muxThumbnailUrl || courseThumbnail;

  const TypeIcon = getLessonTypeIcon(lesson.type);
  const typeLabel = getLessonTypeLabel(lesson.type);

  return (
    <div className="flex gap-4 py-6 border-b border-gray-800 last:border-b-0 group hover:bg-gray-900/50 transition-colors px-2 -mx-2 rounded-lg">
      {/* Episode Number */}
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
        <span className="text-2xl font-medium text-gray-500">{episodeNumber}</span>
      </div>

      {/* Thumbnail */}
      <div className="flex-shrink-0 relative w-32 aspect-video rounded-md overflow-hidden bg-gray-800">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={lesson.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
            <TypeIcon className="w-8 h-8 text-gray-600" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-white font-medium text-base leading-tight">
            {lesson.title}
          </h3>
          {formattedDuration && (
            <span className="flex-shrink-0 text-gray-400 text-sm">
              {formattedDuration}
            </span>
          )}
        </div>

        {/* Type label */}
        <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
          <TypeIcon className="w-3.5 h-3.5" />
          <span>{typeLabel}</span>
        </div>

        {/* Description */}
        {lesson.description && (
          <p className="mt-2 text-gray-400 text-sm leading-relaxed line-clamp-2">
            {lesson.description}
          </p>
        )}
      </div>
    </div>
  );
}
