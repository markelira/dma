"use client"

import React, { useCallback, useRef, useState, useEffect } from 'react'

// Enhanced analytics tracking
interface VideoAnalytics {
  lessonId?: string
  courseId?: string
  userId?: string
  sessionId: string
  startTime: number
  engagementEvents: Array<{
    type: 'play' | 'pause' | 'seek' | 'rate_change' | 'fullscreen' | 'quality_change'
    timestamp: number
    currentTime: number
    data?: any
  }>
  progressMarkers: Array<{
    percentage: number
    timestamp: number
    watchTime: number
  }>
}

// Chapter and bookmark interfaces
interface VideoChapter {
  id: string
  title: string
  startTime: number // in seconds
  endTime?: number // in seconds
  description?: string
  thumbnail?: string
  isCompleted?: boolean
}

interface VideoBookmark {
  id: string
  title: string
  timestamp: number // in seconds
  note?: string
  createdAt: Date
}

interface ResumeContext {
  startTime?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

interface Props {
  src: string
  onProgress?: (watchedPercentage: number, timeSpent: number, analytics?: VideoAnalytics) => void
  onEnded?: () => void
  onError?: (error: any) => void
  poster?: string
  lessonTitle?: string
  lessonId?: string
  courseId?: string
  userId?: string
  enableAnalytics?: boolean
  chapters?: VideoChapter[]
  resumeContext?: ResumeContext | null
  bookmarks?: VideoBookmark[]
  onSeekTo?: (time: number) => void
  onAddBookmark?: (bookmark: Omit<VideoBookmark, 'id' | 'createdAt'>) => void
  onRemoveBookmark?: (bookmarkId: string) => void
  onUpdateBookmark?: (bookmarkId: string, bookmark: Partial<VideoBookmark>) => void
}

export const VideoPlayer: React.FC<Props> = ({ 
  src, 
  onProgress, 
  onEnded, 
  poster,
  lessonTitle = "Video Lesson",
  lessonId,
  courseId,
  userId,
  enableAnalytics = true,
  chapters = [],
  bookmarks = [],
  onSeekTo,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmark
}) => {
  const playerRef = useRef<HTMLVideoElement>(null)
  const [lastReportedTime, setLastReportedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [watchTime, setWatchTime] = useState(0)
  const [sessionStartTime] = useState(Date.now())
  const [currentChapter, setCurrentChapter] = useState<VideoChapter | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Analytics state
  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    lessonId,
    courseId,
    userId,
    sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    engagementEvents: [],
    progressMarkers: []
  })

  // Analytics helper functions
  const trackEvent = useCallback((type: VideoAnalytics['engagementEvents'][0]['type'], data?: any) => {
    if (!enableAnalytics) return
    
    const player = playerRef.current
    const event = {
      type,
      timestamp: Date.now(),
      currentTime: player?.currentTime || 0,
      data
    }
    
    setAnalytics(prev => ({
      ...prev,
      engagementEvents: [...prev.engagementEvents, event]
    }))
    
    console.log(`🎥 Analytics Event: ${type}`, event)
  }, [enableAnalytics])

  const trackProgressMarker = useCallback((percentage: number, watchTimeSeconds: number) => {
    if (!enableAnalytics) return
    
    const marker = {
      percentage,
      timestamp: Date.now(),
      watchTime: watchTimeSeconds
    }
    
    setAnalytics(prev => ({
      ...prev,
      progressMarkers: [...prev.progressMarkers, marker]
    }))
  }, [enableAnalytics])

  // Chapter detection
  useEffect(() => {
    const activeChapter = chapters.find(chapter => 
      currentTime >= chapter.startTime && 
      (chapter.endTime ? currentTime <= chapter.endTime : true)
    )
    
    if (activeChapter && activeChapter.id !== currentChapter?.id) {
      setCurrentChapter(activeChapter)
      trackEvent('seek', { chapterChange: true, chapterId: activeChapter.id })
    }
  }, [currentTime, chapters, currentChapter, trackEvent])

  // Seek to time handler
  const handleSeekTo = useCallback((time: number) => {
    const player = playerRef.current
    if (player) {
      player.currentTime = time
      trackEvent('seek', { seekTo: time, userInitiated: true })
    }
    onSeekTo?.(time)
  }, [trackEvent, onSeekTo])

  // Extract playback ID from the signed URL for Mux Player
  const getPlaybackId = useCallback((url: string): string | null => {
    if (!url) return null
    
    // Handle signed URLs: https://stream.mux.com/[playbackId].m3u8?token=...
    const match = url.match(/https:\/\/stream\.mux\.com\/([^.]+)\.m3u8/)
    if (match) {
      return match[1]
    }
    
    // Handle direct playback IDs
    if (url.length > 10 && !url.includes('/')) {
      return url
    }
    
    return null
  }, [])

  // Watch time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  // Progress tracking with 10-second intervals and analytics
  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current
    if (!player || !player.duration) return
    
    const current = player.currentTime
    const totalDuration = player.duration
    
    setCurrentTime(current)
    setDuration(totalDuration)
    
    // Report progress every 10 seconds
    if (current - lastReportedTime >= 10) {
      const percentage = (current / totalDuration) * 100
      
      // Track progress markers for analytics
      trackProgressMarker(percentage, watchTime)
      
      // Call the parent callback with analytics
      onProgress?.(Math.min(100, percentage), Math.floor(current), analytics)
      setLastReportedTime(current)
    }
  }, [onProgress, lastReportedTime, analytics, trackProgressMarker, watchTime])

  // Handle video end
  const handleEnded = useCallback(() => {
    const player = playerRef.current
    if (player && player.duration) {
      trackEvent('fullscreen', { completed: true })
      trackProgressMarker(100, watchTime)
      onProgress?.(100, Math.floor(player.duration), analytics)
    }
    onEnded?.()
    setIsPlaying(false)
  }, [onProgress, onEnded, trackEvent, trackProgressMarker, watchTime, analytics])

  // Handle play state changes with analytics
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    trackEvent('play')
  }, [trackEvent])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    trackEvent('pause')
  }, [trackEvent])

  // Additional analytics event handlers
  const handleSeeking = useCallback(() => {
    trackEvent('seek')
  }, [trackEvent])

  const handleRateChange = useCallback(() => {
    const player = playerRef.current
    if (player) {
      trackEvent('rate_change', { playbackRate: (player as any).playbackRate })
    }
  }, [trackEvent])

  const handleFullscreenChange = useCallback(() => {
    trackEvent('fullscreen', { isFullscreen: document.fullscreenElement !== null })
  }, [trackEvent])

  // Handle loading states
  const handleLoadedMetadata = useCallback(() => {
    const player = playerRef.current
    if (player) {
      setDuration(player.duration)
    }
  }, [])

  // Error handling
  const handleError = useCallback((error: any) => {
    console.error('🎥 Video Player Error:', error)
  }, [])

  const playbackId = getPlaybackId(src)
  
  // If we can't extract playback ID, fall back to basic video element
  if (!playbackId) {
    console.warn('⚠️ Could not extract Mux playback ID, falling back to basic video player')
    return (
      <video
        ref={playerRef}
        src={src}
        controls
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        className="w-full h-auto bg-black rounded-lg aspect-video"
        style={{ maxHeight: '70vh' }}
        poster={poster}
        playsInline
      />
    )
  }

  // Show loading until client hydration is complete
  if (!isClient) {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden
                      max-h-[70vh] md:max-h-[60vh] lg:max-h-[70vh]
                      aspect-video md:aspect-auto flex items-center justify-center">
        <div className="text-white">Videó lejátszó betöltése...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden
                    max-h-[70vh] md:max-h-[60vh] lg:max-h-[70vh]
                    aspect-video md:aspect-auto">
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        tokens={{ playback: src.includes('token=') ? src.split('token=')[1] : undefined }}
        streamType="on-demand"
        controls
        autoPlay={false}
        muted={false}
        loop={false}
        poster={poster}
        title={lessonTitle}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeking={handleSeeking}
        onRateChange={handleRateChange}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '16 / 9',
        }}
        className="w-full h-auto"
        // Enhanced playback features
        playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 2]}
        hotkeys
        nohotkeys={false}
        // Accessibility
        crossOrigin="anonymous"
        // Performance optimizations
        preload="metadata"
        // UI customization
        primaryColor="#3B82F6"
        secondaryColor="#1E40AF"
        className="mux-player"
      />
      
      {/* Chapter overlay */}
      {currentChapter && duration > 0 && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
          <div className="text-sm font-medium">{currentChapter.title}</div>
          {currentChapter.description && (
            <div className="text-xs text-gray-300 mt-1 max-w-xs line-clamp-2">
              {currentChapter.description}
            </div>
          )}
        </div>
      )}

      {/* Chapter markers on progress bar */}
      {chapters.length > 0 && duration > 0 && (
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div className="relative h-1">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="absolute top-0 w-1 h-3 bg-yellow-400 rounded-full cursor-pointer transform -translate-y-1 hover:scale-125 transition-transform"
                style={{
                  left: `${(chapter.startTime / duration) * 100}%`
                }}
                onClick={() => handleSeekTo(chapter.startTime)}
                title={`${chapter.title} - ${Math.floor(chapter.startTime / 60)}:${(chapter.startTime % 60).toString().padStart(2, '0')}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks markers */}
      {bookmarks.length > 0 && duration > 0 && (
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <div className="relative h-1">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="absolute top-0 w-1 h-2 bg-blue-400 rounded-full cursor-pointer transform -translate-y-1 hover:scale-125 transition-transform"
                style={{
                  left: `${(bookmark.timestamp / duration) * 100}%`
                }}
                onClick={() => handleSeekTo(bookmark.timestamp)}
                title={`${bookmark.title} - ${Math.floor(bookmark.timestamp / 60)}:${(bookmark.timestamp % 60).toString().padStart(2, '0')}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center space-y-2 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-sm">Videó betöltése...</p>
          </div>
        </div>
      )}
    </div>
  )
} 