"use client"

import React, { useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import MuxPlayer exactly as per official docs
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video flex items-center justify-center bg-black">
        <div className="text-white flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Videó betöltése...
        </div>
      </div>
    )
  }
)

interface MuxVideoPlayerProps {
  muxPlaybackId?: string
  videoUrl?: string
  className?: string
  poster?: string
  lessonTitle?: string
  onProgress?: (watchedPercentage: number, timeSpent: number) => void
  onEnded?: () => void
  autoPlay?: boolean
  startTime?: number
}

/**
 * Mux Player implementation following official docs:
 * https://www.mux.com/docs/guides/mux-player-web
 */
export function MuxVideoPlayer({
  muxPlaybackId,
  videoUrl,
  className,
  poster,
  lessonTitle = 'Video',
  onProgress,
  onEnded,
  autoPlay = false,
  startTime = 0,
}: MuxVideoPlayerProps) {
  const playerRef = useRef<any>(null)
  const lastReportedTime = useRef(0)

  // Extract playback ID from Mux URL if needed
  const getPlaybackId = (url?: string): string | null => {
    if (!url) return null
    // Extract from https://stream.mux.com/[playbackId].m3u8
    const match = url.match(/https:\/\/stream\.mux\.com\/([^./?]+)/)
    return match ? match[1] : null
  }

  const playbackId = muxPlaybackId || getPlaybackId(videoUrl)
  const useSrc = !playbackId && videoUrl

  // Progress tracking
  const handleTimeUpdate = useCallback((event: any) => {
    const video = event.target
    if (!video?.duration) return

    const currentTime = video.currentTime
    const duration = video.duration

    // Report every 10 seconds
    if (currentTime - lastReportedTime.current >= 10) {
      const percentage = (currentTime / duration) * 100
      onProgress?.(Math.min(100, percentage), Math.floor(currentTime))
      lastReportedTime.current = currentTime
    }
  }, [onProgress])

  // Set start time on load
  useEffect(() => {
    if (playerRef.current && startTime > 0) {
      try {
        playerRef.current.currentTime = startTime
      } catch (e) {
        console.warn('Failed to set start time:', e)
      }
    }
  }, [startTime])

  // No valid source
  if (!playbackId && !useSrc) {
    return (
      <div className={cn("w-full aspect-video bg-black flex items-center justify-center", className)}>
        <div className="text-white text-center p-4">
          <p className="text-lg font-medium">Nincs elérhető videó</p>
          <p className="text-sm opacity-70 mt-1">A videó forrása hiányzik</p>
        </div>
      </div>
    )
  }

  // Official Mux Player implementation
  return (
    <div className={cn("w-full", className)}>
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId || undefined}
        src={useSrc ? videoUrl : undefined}
        streamType="on-demand"
        autoPlay={autoPlay}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        metadata={{
          video_title: lessonTitle,
        }}
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  )
}

export default MuxVideoPlayer
