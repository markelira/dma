"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Subtitles, 
  BookmarkPlus, 
  StickyNote,
  PictureInPicture,
  Maximize,
  SkipBack,
  SkipForward,
  Volume2,
  Play,
  Pause,
  Loader,
  Monitor,
  Keyboard,
  Film
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdvancedPlaybackControls } from './AdvancedPlaybackControls'
import { EnhancedPiPController } from './EnhancedPiPController'

// Import existing interfaces from the original player
import type {
  QualityOption,
  SubtitleTrack,
  VideoNote,
  VideoBookmark,
  VideoChapter,
  VideoAnalytics
} from '../EnhancedVideoPlayer'

// Dynamically import MuxPlayer
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').catch(err => {
    console.warn('Failed to load MuxPlayer:', err)
    return { default: ({ src, ...props }: any) => 
      <video src={src} {...props} controls className="w-full h-auto" />
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-white flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Fejlett lejátszó betöltése...
        </div>
      </div>
    )
  }
)

// Timeline marker interface for advanced controls
interface TimelineMarker {
  id: string
  timestamp: number
  type: 'bookmark' | 'note' | 'chapter' | 'quiz' | 'assignment' | 'custom'
  title: string
  description?: string
  color?: string
  icon?: React.ReactNode
}

// Loop configuration
interface LoopConfig {
  enabled: boolean
  startTime: number
  endTime: number
  count?: number
  currentLoop: number
}

// Playback settings
interface PlaybackSettings {
  playbackRates: number[]
  defaultPlaybackRate: number
  skipIntervals: number[]
  volumeStep: number
  frameStep: number
  autoplay: boolean
  autoResume: boolean
  rememberVolume: boolean
  rememberPlaybackRate: boolean
  enableKeyboardShortcuts: boolean
  showTimestamps: boolean
  showFrameNumbers: boolean
  precisionMode: boolean
}

// PiP Configuration
interface PiPConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  size: 'small' | 'medium' | 'large' | 'custom'
  customSize?: { width: number; height: number }
  opacity: number
  showControls: boolean
  showCourseInfo: boolean
  enableDragging: boolean
  autoHide: boolean
  autoHideDelay: number
  stayOnTop: boolean
  snapToEdges: boolean
}

// Course context for PiP
interface CourseContext {
  courseTitle: string
  lessonTitle: string
  chapterTitle?: string
  currentTime: number
  duration: number
  playbackRate: number
  progress: number
  nextLesson?: {
    id: string
    title: string
    thumbnail?: string
  }
  currentChapter?: {
    id: string
    title: string
    startTime: number
    endTime: number
  }
  bookmarks: VideoBookmark[]
  notes: VideoNote[]
}

interface Props {
  src: string
  playbackId?: string
  onProgress?: (watchedPercentage: number, timeSpent: number, analytics?: VideoAnalytics) => void
  onEnded?: () => void
  onError?: (error: any) => void
  poster?: string
  lessonTitle?: string
  courseTitle?: string
  lessonId?: string
  courseId?: string
  userId?: string
  enableAnalytics?: boolean
  chapters?: VideoChapter[]
  bookmarks?: VideoBookmark[]
  notes?: VideoNote[]
  subtitles?: SubtitleTrack[]
  resumeTime?: number
  nextLesson?: {
    id: string
    title: string
    thumbnail?: string
  }
  enableAdvancedControls?: boolean
  enablePiP?: boolean
  playbackSettings?: Partial<PlaybackSettings>
  pipConfig?: Partial<PiPConfig>
  onSeekTo?: (time: number) => void
  onAddBookmark?: (bookmark: Omit<VideoBookmark, 'id' | 'createdAt'>) => void
  onRemoveBookmark?: (bookmarkId: string) => void
  onUpdateBookmark?: (bookmarkId: string, bookmark: Partial<VideoBookmark>) => void
  onAddNote?: (note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'>) => void
  onRemoveNote?: (noteId: string) => void
  onUpdateNote?: (noteId: string, note: Partial<VideoNote>) => void
  onSubtitleChange?: (trackId: string | null) => void
  onQualityChange?: (quality: string) => void
  onNextLesson?: () => void
  className?: string
}

export const VideoPlayerWithAdvancedControls: React.FC<Props> = ({
  src,
  playbackId,
  onProgress,
  onEnded,
  onError,
  poster,
  lessonTitle = "Video Lesson",
  courseTitle = "Course",
  lessonId,
  courseId,
  userId,
  enableAnalytics = true,
  chapters = [],
  bookmarks = [],
  notes = [],
  subtitles = [],
  resumeTime = 0,
  nextLesson,
  enableAdvancedControls = true,
  enablePiP = true,
  playbackSettings = {},
  pipConfig = {},
  onSeekTo,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmark,
  onAddNote,
  onRemoveNote,
  onUpdateNote,
  onSubtitleChange,
  onQualityChange,
  onNextLesson,
  className
}) => {
  const playerRef = useRef<any>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Basic video state
  const [isClient, setIsClient] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Advanced controls state
  const [useAdvancedControls, setUseAdvancedControls] = useState(enableAdvancedControls)
  const [loopConfig, setLoopConfig] = useState<LoopConfig>({
    enabled: false,
    startTime: 0,
    endTime: 0,
    currentLoop: 0
  })
  
  // Settings state
  const [currentPlaybackSettings, setCurrentPlaybackSettings] = useState<PlaybackSettings>({
    playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
    defaultPlaybackRate: 1,
    skipIntervals: [5, 10, 15, 30],
    volumeStep: 0.1,
    frameStep: 33.33, // ~30fps
    autoplay: false,
    autoResume: true,
    rememberVolume: true,
    rememberPlaybackRate: true,
    enableKeyboardShortcuts: true,
    showTimestamps: true,
    showFrameNumbers: false,
    precisionMode: false,
    ...playbackSettings
  })
  
  const [currentPiPConfig, setCurrentPiPConfig] = useState<PiPConfig>({
    position: 'bottom-right',
    size: 'medium',
    opacity: 0.95,
    showControls: true,
    showCourseInfo: true,
    enableDragging: true,
    autoHide: true,
    autoHideDelay: 3000,
    stayOnTop: true,
    snapToEdges: true,
    ...pipConfig
  })

  // Analytics state
  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    lessonId,
    courseId,
    userId,
    sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    totalWatchTime: 0,
    completionPercentage: 0,
    qualityChanges: 0,
    pauseCount: 0,
    seekCount: 0,
    averagePlaybackRate: 1,
    engagementScore: 0,
    engagementEvents: [],
    progressMarkers: [],
    heatmapData: []
  })

  // Set up client-side detection
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sync video element reference
  useEffect(() => {
    if (playerRef.current?.media) {
      videoElementRef.current = playerRef.current.media
    }
  }, [playerRef.current])

  // Generate timeline markers from bookmarks, notes, and chapters
  const timelineMarkers: TimelineMarker[] = [
    ...chapters.map(chapter => ({
      id: chapter.id,
      timestamp: chapter.startTime,
      type: 'chapter' as const,
      title: chapter.title,
      description: chapter.description,
      color: '#F59E0B',
      icon: <Film className="w-3 h-3" />
    })),
    ...bookmarks.map(bookmark => ({
      id: bookmark.id,
      timestamp: bookmark.timestamp,
      type: 'bookmark' as const,
      title: bookmark.title,
      description: bookmark.note,
      color: bookmark.color,
      icon: <BookmarkPlus className="w-3 h-3" />
    })),
    ...notes.map(note => ({
      id: note.id,
      timestamp: note.timestamp,
      type: 'note' as const,
      title: note.title,
      description: note.content,
      color: note.color,
      icon: <StickyNote className="w-3 h-3" />
    }))
  ]

  // Course context for PiP
  const courseContext: CourseContext = {
    courseTitle: courseTitle || "Course",
    lessonTitle: lessonTitle || "Video Lesson",
    chapterTitle: chapters.find(ch => 
      currentTime >= ch.startTime && 
      (ch.endTime ? currentTime <= ch.endTime : true)
    )?.title,
    currentTime,
    duration,
    playbackRate,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    nextLesson,
    currentChapter: chapters.find(ch => 
      currentTime >= ch.startTime && 
      (ch.endTime ? currentTime <= ch.endTime : true)
    ),
    bookmarks,
    notes
  }

  // Event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    if (enableAnalytics) {
      setAnalytics(prev => ({
        ...prev,
        engagementEvents: [...prev.engagementEvents, {
          type: 'play',
          timestamp: Date.now(),
          currentTime,
          data: { playbackRate }
        }]
      }))
    }
  }, [currentTime, playbackRate, enableAnalytics])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    if (enableAnalytics) {
      setAnalytics(prev => ({
        ...prev,
        pauseCount: prev.pauseCount + 1,
        engagementEvents: [...prev.engagementEvents, {
          type: 'pause',
          timestamp: Date.now(),
          currentTime,
          data: { totalPauses: prev.pauseCount + 1 }
        }]
      }))
    }
  }, [currentTime, enableAnalytics])

  const handleTimeUpdate = useCallback(() => {
    if (!playerRef.current?.media) return
    
    const newCurrentTime = playerRef.current.media.currentTime
    setCurrentTime(newCurrentTime)
    
    if (enableAnalytics && onProgress) {
      const completionPercentage = duration > 0 ? (newCurrentTime / duration) * 100 : 0
      const timeSpent = Date.now() - analytics.startTime
      
      const updatedAnalytics = {
        ...analytics,
        totalWatchTime: timeSpent,
        completionPercentage
      }
      
      setAnalytics(updatedAnalytics)
      onProgress(completionPercentage, timeSpent, updatedAnalytics)
    }
  }, [duration, analytics, enableAnalytics, onProgress])

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current?.media) {
      playerRef.current.media.currentTime = time
      setCurrentTime(time)
      
      if (enableAnalytics) {
        setAnalytics(prev => ({
          ...prev,
          seekCount: prev.seekCount + 1,
          engagementEvents: [...prev.engagementEvents, {
            type: 'seek',
            timestamp: Date.now(),
            currentTime: time,
            data: { seekTo: time, totalSeeks: prev.seekCount + 1 }
          }]
        }))
      }
      
      if (onSeekTo) {
        onSeekTo(time)
      }
    }
  }, [enableAnalytics, onSeekTo])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (playerRef.current?.media) {
      playerRef.current.media.volume = newVolume
      setVolume(newVolume)
    }
  }, [])

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (playerRef.current?.media) {
      playerRef.current.media.playbackRate = rate
      setPlaybackRate(rate)
      
      if (enableAnalytics) {
        setAnalytics(prev => ({
          ...prev,
          engagementEvents: [...prev.engagementEvents, {
            type: 'rate_change',
            timestamp: Date.now(),
            currentTime,
            data: { newRate: rate, previousRate: playbackRate }
          }]
        }))
      }
    }
  }, [currentTime, playbackRate, enableAnalytics])

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleTogglePiP = useCallback(() => {
    if (!isPiP && playerRef.current?.media) {
      playerRef.current.media.requestPictureInPicture()
      setIsPiP(true)
    } else if (document.pictureInPictureElement) {
      document.exitPictureInPicture()
      setIsPiP(false)
    }
  }, [isPiP])

  const handleExitPiP = useCallback(() => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture()
    }
    setIsPiP(false)
  }, [])

  const handleScreenshot = useCallback(() => {
    if (!playerRef.current?.media) return

    const canvas = document.createElement('canvas')
    const video = playerRef.current.media
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Create download link
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `screenshot-${lessonTitle}-${Math.floor(currentTime)}s.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }
  }, [currentTime, lessonTitle])

  const handleBookmarkAdd = useCallback((timestamp: number) => {
    if (onAddBookmark) {
      const bookmark: Omit<VideoBookmark, 'id' | 'createdAt'> = {
        title: `Könyvjelző ${Math.floor(timestamp / 60)}:${Math.floor(timestamp % 60).toString().padStart(2, '0')}`,
        timestamp,
        color: '#10B981'
      }
      onAddBookmark(bookmark)
    }
  }, [onAddBookmark])

  const handleNoteAdd = useCallback((timestamp: number, content: string) => {
    if (onAddNote) {
      const note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `Jegyzet ${Math.floor(timestamp / 60)}:${Math.floor(timestamp % 60).toString().padStart(2, '0')}`,
        timestamp,
        content,
        color: '#3B82F6'
      }
      onAddNote(note)
    }
  }, [onAddNote])

  // Listen for PiP events
  useEffect(() => {
    if (!videoElementRef.current) return

    const video = videoElementRef.current
    
    const handleEnterPiP = () => setIsPiP(true)
    const handleLeavePiP = () => setIsPiP(false)
    
    video.addEventListener('enterpictureinpicture', handleEnterPiP)
    video.addEventListener('leavepictureinpicture', handleLeavePiP)
    
    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP)
      video.removeEventListener('leavepictureinpicture', handleLeavePiP)
    }
  }, [videoElementRef.current])

  if (!isClient) {
    return (
      <div className="w-full h-64 bg-black flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main Video Player Container */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden shadow-lg"
      >
        {/* Mux Player */}
        <MuxPlayer
          ref={playerRef}
          playbackId={playbackId}
          src={!playbackId ? src : undefined}
          poster={poster}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (playerRef.current?.media) {
              setDuration(playerRef.current.media.duration)
              setIsLoading(false)
              
              // Resume from saved time
              if (resumeTime > 0) {
                handleSeek(resumeTime)
              }
            }
          }}
          onEnded={onEnded}
          onError={onError}
          controls={!useAdvancedControls}
          className="w-full h-auto"
          style={{ maxHeight: '70vh' }}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white flex items-center gap-2">
              <Loader className="w-6 h-6 animate-spin" />
              Betöltés...
            </div>
          </div>
        )}

        {/* Advanced Controls Toggle */}
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseAdvancedControls(!useAdvancedControls)}
            className="text-white hover:bg-white/20"
            title={useAdvancedControls ? "Egyszerű vezérlők" : "Fejlett vezérlők"}
          >
            {useAdvancedControls ? <Monitor className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Advanced Playback Controls */}
      {useAdvancedControls && (
        <div className="mt-4">
          <AdvancedPlaybackControls
            videoElement={videoElementRef.current}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            playbackRate={playbackRate}
            isFullscreen={isFullscreen}
            markers={timelineMarkers}
            settings={currentPlaybackSettings}
            loopConfig={loopConfig}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onPlaybackRateChange={handlePlaybackRateChange}
            onToggleFullscreen={handleToggleFullscreen}
            onTogglePiP={handleTogglePiP}
            onLoopConfigChange={setLoopConfig}
            onBookmarkAdd={handleBookmarkAdd}
            onNoteAdd={handleNoteAdd}
            onScreenshot={handleScreenshot}
            onSettingsChange={(newSettings) => 
              setCurrentPlaybackSettings({ ...currentPlaybackSettings, ...newSettings })
            }
          />
        </div>
      )}

      {/* Enhanced PiP Controller */}
      {enablePiP && (
        <EnhancedPiPController
          isInPiP={isPiP}
          videoElement={videoElementRef.current}
          courseContext={courseContext}
          config={currentPiPConfig}
          onTogglePiP={handleTogglePiP}
          onExitPiP={handleExitPiP}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onPlaybackRateChange={handlePlaybackRateChange}
          onConfigChange={(newConfig) => 
            setCurrentPiPConfig({ ...currentPiPConfig, ...newConfig })
          }
          onBookmarkAdd={handleBookmarkAdd}
          onNoteAdd={handleNoteAdd}
          onNextLesson={onNextLesson}
        />
      )}

      {/* Chapter Navigation */}
      {chapters.length > 0 && (
        <Card className="mt-4 p-4">
          <h3 className="text-lg font-medium mb-3">Fejezetek</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {chapters.map((chapter, index) => (
              <Button
                key={chapter.id}
                variant={
                  currentTime >= chapter.startTime && 
                  (chapter.endTime ? currentTime <= chapter.endTime : true) 
                    ? "default" 
                    : "outline"
                }
                size="sm"
                onClick={() => handleSeek(chapter.startTime)}
                className="text-left justify-start"
                title={chapter.description}
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs opacity-75">#{index + 1}</span>
                  <span className="truncate">{chapter.title}</span>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Video Information */}
      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{lessonTitle}</h2>
            <p className="text-gray-600">{courseTitle}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>
                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
                {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
              </span>
              <Badge variant="secondary">{playbackRate}x sebesség</Badge>
              {enableAnalytics && (
                <Badge variant="outline">
                  {Math.round((currentTime / duration) * 100) || 0}% kész
                </Badge>
              )}
            </div>
          </div>
          
          {nextLesson && onNextLesson && (
            <Button onClick={onNextLesson} className="flex items-center gap-2">
              Következő lecke
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}