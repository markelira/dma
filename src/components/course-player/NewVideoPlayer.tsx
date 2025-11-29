'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

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

  // Extract Mux playback ID from URL if it's a Mux stream
  const playbackId = extractMuxPlaybackId(src);

  // Use src directly only if it's NOT a Mux URL (fallback for non-Mux videos)
  const useSrc = !playbackId && src;

  // Determine accent color for MuxPlayer
  const primaryColor = accentColor === 'red' ? '#DC2626' : '#3B82F6';

  // Handle time update for progress tracking (every 10 seconds)
  const handleTimeUpdate = useCallback((event: any) => {
    const video = event.target;
    if (!video?.duration) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    // Report progress every 10 seconds
    if (currentTime - lastReportedTimeRef.current >= 10) {
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

  return (
    <div className="w-full rounded-lg overflow-hidden">
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId || undefined}
        src={useSrc || undefined}
        streamType="on-demand"
        autoPlay={autoPlay}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        startTime={initialTime}
        primaryColor={primaryColor}
        accentColor={primaryColor}
        metadata={{
          video_title: 'Lecke videó',
        }}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '0.5rem',
        }}
      />
    </div>
  );
}

