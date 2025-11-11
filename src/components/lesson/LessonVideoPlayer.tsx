"use client"

import React from 'react'
import { MuxVideoPlayer } from './MuxVideoPlayer'

interface LessonVideoPlayerProps {
  // Video source props
  videoUrl?: string
  src?: string // Backward compatibility
  muxPlaybackId?: string
  playbackId?: string // Backward compatibility
  muxData?: any

  // Common props
  poster?: string
  lessonTitle?: string
  lessonId?: string
  courseId?: string
  userId?: string
  className?: string

  // Callbacks
  onProgress?: (percentage: number, timeSpent: number, analytics?: any) => void
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onError?: (error: any) => void

  // Playback options
  autoPlay?: boolean
  startTime?: number

  // Deprecated props (ignored)
  videoType?: 'standard' | 'enhanced' | 'firebase' | 'mux'
  enableAnalytics?: boolean
  chapters?: any[]
  resumeContext?: any
  bookmarks?: any[]
  [key: string]: any
}

/**
 * LessonVideoPlayer component
 * Universal video player wrapper using Mux Player for all video types
 */
export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  videoUrl,
  src,
  muxPlaybackId,
  playbackId,
  muxData,
  poster,
  lessonTitle,
  onProgress,
  onTimeUpdate,
  onEnded,
  onError,
  autoPlay,
  startTime,
  className,
  ...props
}) => {
  console.log('📺 [LessonVideoPlayer] Called with:', { videoUrl, src, muxPlaybackId, playbackId, muxData })

  // Determine playback ID (priority order)
  const finalPlaybackId = muxPlaybackId || playbackId || muxData?.playbackId

  // Determine video URL (priority order)
  const finalVideoUrl = videoUrl || src

  console.log('📺 [LessonVideoPlayer] Passing to MuxVideoPlayer:', { finalPlaybackId, finalVideoUrl })

  return (
    <MuxVideoPlayer
      muxPlaybackId={finalPlaybackId}
      videoUrl={finalVideoUrl}
      poster={poster}
      lessonTitle={lessonTitle}
      onProgress={onProgress}
      onTimeUpdate={onTimeUpdate}
      onEnded={onEnded}
      onError={onError}
      autoPlay={autoPlay}
      startTime={startTime}
      className={className}
    />
  )
}
