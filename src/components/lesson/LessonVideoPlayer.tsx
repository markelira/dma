"use client"

import React from 'react'
import { VideoPlayer, VideoChapter, VideoBookmark } from '@/components/video/VideoPlayer'

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

  // Enhanced features
  enableAnalytics?: boolean
  chapters?: VideoChapter[]
  bookmarks?: VideoBookmark[]

  // Deprecated props (ignored)
  videoType?: 'standard' | 'enhanced' | 'firebase' | 'mux'
  resumeContext?: any
  [key: string]: any
}

/**
 * LessonVideoPlayer component
 * Enhanced video player with chapters, bookmarks, and analytics
 */
export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  videoUrl,
  src,
  muxPlaybackId,
  playbackId,
  muxData,
  poster,
  lessonTitle = 'Video Lesson',
  lessonId,
  courseId,
  userId,
  onProgress,
  onTimeUpdate,
  onEnded,
  onError,
  autoPlay = false,
  startTime,
  className,
  enableAnalytics = true,
  chapters = [],
  bookmarks = [],
  ...props
}) => {
  console.log('📺 [LessonVideoPlayer] Called with:', {
    videoUrl,
    src,
    muxPlaybackId,
    playbackId,
    muxData,
    chapters: chapters.length,
    bookmarks: bookmarks.length
  })

  // Determine playback ID (priority order)
  const finalPlaybackId = muxPlaybackId || playbackId || muxData?.playbackId

  // Determine video URL (priority order)
  const finalVideoUrl = videoUrl || src

  // For Mux playback ID, construct the URL
  let videoSource = finalVideoUrl
  if (finalPlaybackId && !finalVideoUrl) {
    videoSource = `https://stream.mux.com/${finalPlaybackId}.m3u8`
  }

  console.log('📺 [LessonVideoPlayer] Final video source:', { finalPlaybackId, videoSource })

  // If no valid source, show error
  if (!videoSource && !finalPlaybackId) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg">
        <div className="text-white text-center p-4">
          <p className="text-lg font-medium">Nincs elérhető videó</p>
          <p className="text-sm opacity-70 mt-1">A videó forrása hiányzik</p>
        </div>
      </div>
    )
  }

  return (
    <VideoPlayer
      src={videoSource || `https://stream.mux.com/${finalPlaybackId}.m3u8`}
      poster={poster}
      lessonTitle={lessonTitle}
      lessonId={lessonId}
      courseId={courseId}
      userId={userId}
      onProgress={onProgress}
      onEnded={onEnded}
      onError={onError}
      autoPlay={autoPlay}
      className={className}
      enableAnalytics={enableAnalytics}
      chapters={chapters}
      bookmarks={bookmarks}
    />
  )
}
