'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  LargePlayButton,
  PlayIcon,
  PauseIcon,
  FullscreenIcon,
  ExitFullscreenIcon,
} from '@/components/icons/CoursePlayerIcons';

interface NewVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  initialTime?: number;
  onProgress?: (currentTime: number, duration: number, percentage: number) => void;
  onEnded?: () => void;
  accentColor?: 'blue' | 'red';
}

// DIAGNOSTIC: Helper to check if URL is HLS
const isHlsUrl = (url: string): boolean => {
  return url?.includes('.m3u8') || url?.includes('stream.mux.com');
};

// DIAGNOSTIC: Helper to extract Mux playback ID
const extractMuxPlaybackId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/https:\/\/stream\.mux\.com\/([^./?]+)/);
  return match ? match[1] : null;
};

/**
 * NewVideoPlayer Component
 * Custom HTML5 video player matching the screenshot design exactly
 * Features: centered play button, custom controls, progress tracking
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
  // ============ DIAGNOSTIC LOGGING ============
  const isHls = isHlsUrl(src);
  const muxPlaybackId = extractMuxPlaybackId(src);

  useEffect(() => {
    console.log('🎬 [NewVideoPlayer] DIAGNOSTIC:', {
      src: src?.substring(0, 80) + (src?.length > 80 ? '...' : ''),
      isHlsUrl: isHls,
      muxPlaybackId,
      poster: poster?.substring(0, 50),
      initialTime,
      accentColor,
      WARNING: isHls ? '⚠️ HLS URL DETECTED - Plain <video> element CANNOT play HLS in Chrome/Firefox/Edge!' : 'Direct video URL - should work',
      BROWSER: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'SSR',
    });

    if (isHls) {
      console.error('❌ [NewVideoPlayer] CRITICAL: This player uses HTML5 <video> element which CANNOT play HLS (.m3u8) streams in most browsers. Use MuxPlayer or HLS.js instead!');
    }
  }, [src, isHls, muxPlaybackId, poster, initialTime, accentColor]);
  // ============ END DIAGNOSTIC ============

  // Accent color classes for progress bar
  const progressColorClass = accentColor === 'red' ? 'bg-red-600' : 'bg-brand-secondary/50';
  const progressHoverClass = accentColor === 'red' ? 'bg-red-500/50' : 'bg-brand-secondary/50';
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTrackingRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number) => {
    if (!isFinite(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return;

      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;

      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (isPlaying && !isHoveringControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHoveringControls]);

  // Handle mouse movement to show controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('✅ [NewVideoPlayer] loadedmetadata fired - duration:', video.duration);
      setDuration(video.duration);
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // DIAGNOSTIC: Error handler
    const handleError = (e: Event) => {
      const videoEl = e.target as HTMLVideoElement;
      const error = videoEl?.error;
      console.error('❌ [NewVideoPlayer] VIDEO ERROR:', {
        errorCode: error?.code,
        errorMessage: error?.message,
        src: src?.substring(0, 80),
        networkState: videoEl?.networkState,
        readyState: videoEl?.readyState,
        NETWORK_STATES: {
          0: 'NETWORK_EMPTY',
          1: 'NETWORK_IDLE',
          2: 'NETWORK_LOADING',
          3: 'NETWORK_NO_SOURCE'
        },
        currentNetworkState: videoEl?.networkState === 3 ? '⚠️ NETWORK_NO_SOURCE - Browser cannot play this format!' : 'other',
      });
    };

    // DIAGNOSTIC: Can play handler
    const handleCanPlay = () => {
      console.log('✅ [NewVideoPlayer] canplay fired - video can start playing');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [initialTime, onEnded, src]);

  // Progress tracking callback (every 10 seconds)
  useEffect(() => {
    if (!isPlaying || !onProgress) return;

    progressTrackingRef.current = setInterval(() => {
      if (videoRef.current) {
        const percentage = (currentTime / duration) * 100;
        onProgress(currentTime, duration, percentage);
      }
    }, 10000);

    return () => {
      if (progressTrackingRef.current) {
        clearInterval(progressTrackingRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, onProgress]);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: '16 / 9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHoveringControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlay}
      />

      {/* Large Centered Play Button with text prompt (visible when paused) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/20"
          onClick={togglePlay}
        >
          <div className="transition-transform hover:scale-110">
            <LargePlayButton size={72} color={accentColor} />
          </div>
          <span className="text-white text-base font-medium mt-3 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
            Kattints a lejátszáshoz
          </span>
        </div>
      )}

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/20 cursor-pointer group relative"
          onClick={handleProgressClick}
        >
          {/* Progress Fill */}
          <div
            className={`h-full ${progressColorClass} transition-all`}
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Hover effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className={`h-full ${progressHoverClass}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Play/Pause and Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:scale-110 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
            </button>
            <div className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right: Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:scale-110 transition-transform"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <ExitFullscreenIcon size={24} />
            ) : (
              <FullscreenIcon size={24} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

