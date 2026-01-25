'use client';

import React, { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Play, BookOpen } from 'lucide-react';
import type { CourseType } from '@/types';

// Dynamically import MuxPlayer to avoid SSR issues
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <div className="text-white flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Betöltés...</span>
        </div>
      </div>
    )
  }
);

interface PreviewVideoPlayerProps {
  /** Mux playback ID */
  playbackId: string;
  /** Poster image URL */
  poster?: string;
  /** Preview duration in seconds (default: 60) */
  previewDuration?: number;
  /** Course title for display */
  courseTitle?: string;
  /** Course type for dynamic labels */
  courseType?: CourseType;
  /** Callback when user clicks to start full course */
  onStartCourse?: () => void;
  /** Callback when preview ends */
  onPreviewEnd?: () => void;
}

/**
 * Get course type label in Hungarian (accusative form for "Kezdd el a...")
 */
function getCourseTypeLabel(courseType?: CourseType): string {
  switch (courseType) {
    case 'WEBINAR': return 'webinárt';
    case 'ACADEMIA': return 'akadémiát';
    case 'MASTERCLASS': return 'masterclasst';
    case 'PODCAST': return 'podcastot';
    default: return 'kurzust';
  }
}

/**
 * Get course type label for button (nominative form for "X indítása")
 */
function getCourseTypeButtonLabel(courseType?: CourseType): string {
  switch (courseType) {
    case 'WEBINAR': return 'Webinár';
    case 'ACADEMIA': return 'Akadémia';
    case 'MASTERCLASS': return 'Masterclass';
    case 'PODCAST': return 'Podcast';
    default: return 'Kurzus';
  }
}

/**
 * Get no preview message based on course type
 */
function getNoPreviewMessage(courseType?: CourseType): string {
  const type = getCourseTypeButtonLabel(courseType).toLowerCase();
  return `A ${type} nem tartalmaz előnézeti videót`;
}

/**
 * PreviewVideoPlayer - 60-second video preview for course modal
 * Auto-plays muted, pauses at preview limit, shows overlay to start full course
 */
export function PreviewVideoPlayer({
  playbackId,
  poster,
  previewDuration = 60,
  courseTitle,
  courseType,
  onStartCourse,
  onPreviewEnd,
}: PreviewVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [isPreviewEnded, setIsPreviewEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Handle time update - pause at preview limit
  const handleTimeUpdate = useCallback((event: any) => {
    const video = event.target;
    if (!video) return;

    const time = video.currentTime;
    setCurrentTime(time);

    // Pause at preview limit
    if (time >= previewDuration && !isPreviewEnded) {
      video.pause();
      setIsPreviewEnded(true);
      setIsPlaying(false);
      onPreviewEnd?.();
    }
  }, [previewDuration, isPreviewEnded, onPreviewEnd]);

  // Handle play state
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setHasStarted(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Calculate progress percentage
  const progressPercent = Math.min((currentTime / previewDuration) * 100, 100);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Restart preview
  const handleRestart = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.currentTime = 0;
      playerRef.current.play();
      setIsPreviewEnded(false);
      setCurrentTime(0);
    }
  }, []);

  if (!playbackId) {
    return (
      <div
        className="w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: '16 / 9' }}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-white font-medium">Nincs elérhető előnézet</p>
          <p className="text-gray-400 text-sm mt-1">{getNoPreviewMessage(courseType)}</p>
        </div>
      </div>
    );
  }

  const courseTypeLabel = getCourseTypeLabel(courseType);
  const buttonLabel = getCourseTypeButtonLabel(courseType);

  return (
    <div className="w-full rounded-lg overflow-hidden relative bg-black">
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        streamType="on-demand"
        autoPlay
        muted
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        metadata={{
          video_title: courseTitle || `${buttonLabel} előnézet`,
        }}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '0.5rem',
          '--media-primary-color': '#FFFFFF',
          '--media-secondary-color': 'transparent',
          '--media-range-bar-color': '#E72B36',
          '--media-range-thumb-background': '#E72B36',
          '--media-control-background': 'transparent',
          '--media-control-hover-background': 'rgba(255,255,255,0.1)',
          '--media-control-bar-background': 'transparent',
          '--controls-backdrop-color': 'transparent',
          '--bottom-controls-background': 'transparent',
        } as React.CSSProperties}
      />

      {/* Preview progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
        <div
          className="h-full bg-brand-secondary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Preview time indicator */}
      {hasStarted && !isPreviewEnded && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
          Előnézet: {formatTime(Math.max(0, previewDuration - currentTime))}
        </div>
      )}

      {/* Preview ended overlay */}
      {isPreviewEnded && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="text-center max-w-sm mx-4">
            <div className="w-20 h-20 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-secondary/30">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Előnézet vége
            </h3>
            <p className="text-gray-300 mb-6">
              Kezdd el a {courseTypeLabel}, hogy megnézhesd a teljes tartalmat!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                Újra lejátszás
              </button>
              <button
                onClick={onStartCourse}
                className="px-6 py-3 bg-brand-secondary hover:bg-brand-secondary-hover text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-secondary/20"
              >
                {buttonLabel} indítása
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
