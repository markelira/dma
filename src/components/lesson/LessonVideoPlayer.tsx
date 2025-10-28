"use client"

import React from 'react'
import { VideoPlayer } from './VideoPlayer'
import { EnhancedVideoPlayer } from './EnhancedVideoPlayer'
import { FirebaseVideoPlayer } from './FirebaseVideoPlayer'

interface LessonVideoPlayerProps {
  src: string
  videoType?: 'standard' | 'enhanced' | 'firebase' | 'mux'
  onProgress?: (percentage: number, timeSpent: number, analytics?: any) => void
  onEnded?: () => void
  onError?: (error: any) => void
  poster?: string
  lessonTitle?: string
  lessonId?: string
  courseId?: string
  userId?: string
  enableAnalytics?: boolean
  chapters?: any[]
  resumeContext?: any
  bookmarks?: any[]
  playbackId?: string
  muxData?: any
  [key: string]: any
}

/**
 * LessonVideoPlayer component
 * Smart video player wrapper that selects the appropriate player based on video type
 */
export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  src,
  videoType = 'standard',
  playbackId,
  muxData,
  ...props
}) => {
  // Determine which player to use
  const getPlayerComponent = () => {
    // If Mux playback ID is provided, use EnhancedVideoPlayer
    if (playbackId || muxData) {
      return (
        <EnhancedVideoPlayer
          playbackId={playbackId || muxData?.playbackId}
          {...props}
        />
      )
    }

    // If src is from Firebase Storage, use FirebaseVideoPlayer
    if (src && (src.includes('firebasestorage') || src.includes('storage.googleapis.com'))) {
      return (
        <FirebaseVideoPlayer
          src={src}
          {...props}
        />
      )
    }

    // Check explicit videoType
    switch (videoType) {
      case 'enhanced':
        return (
          <EnhancedVideoPlayer
            playbackId={playbackId || src}
            {...props}
          />
        )
      case 'firebase':
        return (
          <FirebaseVideoPlayer
            src={src}
            {...props}
          />
        )
      case 'standard':
      default:
        return (
          <VideoPlayer
            src={src}
            {...props}
          />
        )
    }
  }

  return (
    <div className="lesson-video-player-wrapper">
      {getPlayerComponent()}
    </div>
  )
}
