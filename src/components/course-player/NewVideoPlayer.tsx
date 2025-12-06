'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Play, RotateCcw } from 'lucide-react';

// Dynamically import MuxPlayer to avoid SSR issues
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        <div className="text-white flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Videó betöltése...</span>
        </div>
      </div>
    )
  }
);

interface NewVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  initialTime?: number;
  onProgress?: (currentTime: number, duration: number, percentage: number) => void;
  onEnded?: () => void;
  accentColor?: 'blue' | 'red';
}

// Extract Mux playback ID from URL
const extractMuxPlaybackId = (url: string): string | null => {
  if (!url) return null;
  // Handle: https://stream.mux.com/[playbackId].m3u8 or https://stream.mux.com/[playbackId]
  const match = url.match(/https:\/\/stream\.mux\.com\/([^./?]+)/);
  return match ? match[1] : null;
};

/**
 * NewVideoPlayer Component
 * Uses MuxPlayer for HLS streaming support across all browsers
 * Features: HLS playback, progress tracking, resume position
 */
// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function NewVideoPlayer({
  src,
  poster,
  autoPlay = false,
  initialTime = 0,
  onProgress,
  onEnded,
  accentColor = 'blue',
}: NewVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const lastReportedTimeRef = useRef(0);

  // Resume overlay state - show if user has significant progress (> 10 seconds)
  const [showResumeOverlay, setShowResumeOverlay] = useState(initialTime > 10);
  const [startFromBeginning, setStartFromBeginning] = useState(false);

  // Extract Mux playback ID from URL if it's a Mux stream
  const playbackId = extractMuxPlaybackId(src);

  // Use src directly only if it's NOT a Mux URL (fallback for non-Mux videos)
  const useSrc = !playbackId && src;


  // Handle time update for progress tracking (every 10 seconds)
  const handleTimeUpdate = useCallback((event: any) => {
    const video = event.target;
    if (!video?.duration) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    // Report progress every 5 seconds
    if (currentTime - lastReportedTimeRef.current >= 5) {
      const percentage = (currentTime / duration) * 100;
      onProgress?.(currentTime, duration, Math.min(100, percentage));
      lastReportedTimeRef.current = currentTime;
    }
  }, [onProgress]);

  // Set initial time when player loads
  useEffect(() => {
    if (playerRef.current && initialTime > 0) {
      // Small delay to ensure player is ready
      const timer = setTimeout(() => {
        try {
          if (playerRef.current) {
            playerRef.current.currentTime = initialTime;
          }
        } catch (e) {
          console.warn('[NewVideoPlayer] Failed to set initial time:', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialTime]);

  // No valid source
  if (!playbackId && !useSrc) {
    return (
      <div
        className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: '16 / 9' }}
      >
        <div className="text-white text-center p-4">
          <p className="text-lg font-medium">Nincs elérhető videó</p>
          <p className="text-sm opacity-70 mt-1">A videó forrása hiányzik</p>
        </div>
      </div>
    );
  }

  // Calculate effective start time
  const effectiveStartTime = startFromBeginning ? 0 : initialTime;

  // Handler for resume choice
  const handleResume = () => {
    setShowResumeOverlay(false);
    // Player will use initialTime
  };

  const handleStartOver = () => {
    setStartFromBeginning(true);
    setShowResumeOverlay(false);
    // Reset player to beginning
    if (playerRef.current) {
      try {
        playerRef.current.currentTime = 0;
      } catch (e) {
        console.warn('[NewVideoPlayer] Failed to reset time:', e);
      }
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden relative">
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId || undefined}
        src={useSrc || undefined}
        streamType="on-demand"
        autoPlay={autoPlay && !showResumeOverlay}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        startTime={effectiveStartTime}
        metadata={{
          video_title: 'Lecke videó',
        }}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '0.5rem',
          // YouTube-style controls using correct MuxPlayer CSS variables
          '--media-primary-color': '#FFFFFF',
          '--media-secondary-color': 'rgba(0,0,0,0.75)',
          '--media-range-bar-color': '#FF0000',
          '--media-range-thumb-background': '#FF0000',
          '--media-control-background': 'transparent',
          '--media-control-hover-background': 'rgba(255,255,255,0.1)',
        } as React.CSSProperties}
      />

      {/* Resume Overlay */}
      {showResumeOverlay && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600 ml-1" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Folytasd onnan, ahol abbahagytad
            </h3>
            <p className="text-gray-600 mb-6">
              Legutóbb itt tartottál: <span className="font-semibold text-gray-900">{formatTime(initialTime)}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Elölről
              </button>
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg"
              >
                <Play className="w-4 h-4" />
                Folytatás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

