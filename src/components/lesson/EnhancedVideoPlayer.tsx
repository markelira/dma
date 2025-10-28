"use client"

import React, { useCallback, useRef, useState, useEffect } from 'react'
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
  Loader
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { EnhancedVideoControls } from '@/components/course-player/EnhancedVideoControls'

// Use simple HTML5 video player as fallback
const VideoPlayer = ({ src, ...props }: any) => {
  return (
    <video 
      src={src} 
      {...props} 
      controls 
      className="w-full h-auto"
      onError={(e) => {
        console.error('Video error:', e);
        props.onError?.(e);
      }}
    />
  );
};

// Dynamically import MuxPlayer to avoid SSR issues - but use HTML5 video as default
const MuxPlayer = dynamic(
  () => Promise.resolve({ default: VideoPlayer }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-white flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Lejátszó betöltése...
        </div>
      </div>
    )
  }
)

// Quality option interface
interface QualityOption {
  label: string
  value: string
  bitrate?: number
  resolution?: string
  isAuto?: boolean
}

// Subtitle track interface
interface SubtitleTrack {
  id: string
  label: string
  language: string
  src: string
  default?: boolean
}

// Video note interface
interface VideoNote {
  id: string
  timestamp: number
  title: string
  content: string
  color: string
  createdAt: Date
  updatedAt: Date
}

// Enhanced bookmark interface
interface VideoBookmark {
  id: string
  title: string
  timestamp: number
  note?: string
  color: string
  createdAt: Date
}

// Video chapter interface
interface VideoChapter {
  id: string
  title: string
  startTime: number
  endTime?: number
  description?: string
  thumbnail?: string
  isCompleted?: boolean
}

// Enhanced analytics interface
interface VideoAnalytics {
  lessonId?: string
  courseId?: string
  userId?: string
  sessionId: string
  startTime: number
  totalWatchTime: number
  completionPercentage: number
  qualityChanges: number
  pauseCount: number
  seekCount: number
  averagePlaybackRate: number
  engagementScore: number
  engagementEvents: Array<{
    type: 'play' | 'pause' | 'seek' | 'rate_change' | 'fullscreen' | 'quality_change' | 'subtitle_change' | 'bookmark_add' | 'note_add'
    timestamp: number
    currentTime: number
    data?: any
  }>
  progressMarkers: Array<{
    percentage: number
    timestamp: number
    watchTime: number
    playbackRate: number
  }>
  heatmapData: Array<{
    startTime: number
    endTime: number
    viewCount: number
    avgWatchTime: number
  }>
}

interface Props {
  src: string
  playbackId?: string
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
  bookmarks?: VideoBookmark[]
  notes?: VideoNote[]
  subtitles?: SubtitleTrack[]
  resumeTime?: number
  onSeekTo?: (time: number) => void
  onAddBookmark?: (bookmark: Omit<VideoBookmark, 'id' | 'createdAt'>) => void
  onRemoveBookmark?: (bookmarkId: string) => void
  onUpdateBookmark?: (bookmarkId: string, bookmark: Partial<VideoBookmark>) => void
  onAddNote?: (note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'>) => void
  onRemoveNote?: (noteId: string) => void
  onUpdateNote?: (noteId: string, note: Partial<VideoNote>) => void
  onSubtitleChange?: (trackId: string | null) => void
  onQualityChange?: (quality: string) => void
  className?: string
}

export const EnhancedVideoPlayer: React.FC<Props> = ({ 
  src, 
  playbackId,
  onProgress, 
  onEnded, 
  onError,
  poster,
  lessonTitle = "Video Lesson",
  lessonId,
  courseId,
  userId,
  enableAnalytics = true,
  chapters = [],
  bookmarks = [],
  notes = [],
  subtitles = [],
  resumeTime = 0,
  onSeekTo,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmark,
  onAddNote,
  onRemoveNote,
  onUpdateNote,
  onSubtitleChange,
  onQualityChange,
  className
}) => {
  const playerRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [useEnhancedControls, setUseEnhancedControls] = useState(true)
  
  // Quality and subtitle state
  const [selectedQuality, setSelectedQuality] = useState<string>('auto')
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null)
  const [showSubtitles, setShowSubtitles] = useState(false)
  
  // Note and bookmark state
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [bookmarkTitle, setBookmarkTitle] = useState('')
  const [bookmarkNote, setBookmarkNote] = useState('')
  const [selectedNoteColor, setSelectedNoteColor] = useState('#3B82F6')
  const [selectedBookmarkColor, setSelectedBookmarkColor] = useState('#10B981')
  
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

  // Available quality options (these would be provided by Mux)
  const qualityOptions: QualityOption[] = [
    { label: 'Auto', value: 'auto', isAuto: true },
    { label: '1080p', value: '1080p', resolution: '1920x1080', bitrate: 5000 },
    { label: '720p', value: '720p', resolution: '1280x720', bitrate: 3000 },
    { label: '480p', value: '480p', resolution: '854x480', bitrate: 1500 },
    { label: '360p', value: '360p', resolution: '640x360', bitrate: 800 }
  ]

  // Note colors
  const noteColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' }
  ]

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize subtitle from props
  useEffect(() => {
    const defaultSubtitle = subtitles.find(track => track.default)
    if (defaultSubtitle) {
      setSelectedSubtitle(defaultSubtitle.id)
      setShowSubtitles(true)
    }
  }, [subtitles])

  // Resume playback
  useEffect(() => {
    if (resumeTime > 0 && playerRef.current && duration > 0) {
      const timer = setTimeout(() => {
        handleSeekTo(resumeTime)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resumeTime, duration])

  // Analytics helper functions
  const trackEvent = useCallback((type: VideoAnalytics['engagementEvents'][0]['type'], data?: any) => {
    if (!enableAnalytics) return
    
    const event = {
      type,
      timestamp: Date.now(),
      currentTime: currentTime,
      data
    }
    
    setAnalytics(prev => ({
      ...prev,
      engagementEvents: [...prev.engagementEvents, event]
    }))
  }, [enableAnalytics, currentTime])

  // Player event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    trackEvent('play')
  }, [trackEvent])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setAnalytics(prev => ({ ...prev, pauseCount: prev.pauseCount + 1 }))
    trackEvent('pause')
  }, [trackEvent])

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    
    const current = player.currentTime || 0
    const total = player.duration || 0
    
    setCurrentTime(current)
    setDuration(total)
    
    if (total > 0) {
      const percentage = (current / total) * 100
      setAnalytics(prev => ({
        ...prev,
        completionPercentage: Math.max(prev.completionPercentage, percentage),
        totalWatchTime: Math.max(prev.totalWatchTime, current)
      }))
      
      // Report progress every 10 seconds
      if (current % 10 < 1) {
        onProgress?.(percentage, current, analytics)
      }
    }
  }, [onProgress, analytics])

  const handleSeekTo = useCallback((time: number) => {
    const player = playerRef.current
    if (player) {
      player.currentTime = time
      setAnalytics(prev => ({ ...prev, seekCount: prev.seekCount + 1 }))
      trackEvent('seek', { seekTo: time })
    }
    onSeekTo?.(time)
  }, [trackEvent, onSeekTo])

  const handleSkip = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    handleSeekTo(newTime)
  }, [currentTime, duration, handleSeekTo])

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current
    if (player) {
      if (isPlaying) {
        player.pause()
      } else {
        player.play()
      }
    }
  }, [isPlaying])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    if (playerRef.current) {
      playerRef.current.volume = newVolume
    }
    if (newVolume > 0) {
      setIsMuted(false)
    }
  }, [])

  const handleMute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.volume = volume
        setIsMuted(false)
      } else {
        playerRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }, [isMuted, volume])

  const handleRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate)
    if (playerRef.current) {
      playerRef.current.playbackRate = rate
    }
    setAnalytics(prev => ({
      ...prev,
      averagePlaybackRate: (prev.averagePlaybackRate + rate) / 2
    }))
    trackEvent('rate_change', { playbackRate: rate })
  }, [trackEvent])

  // Quality change handler
  const handleQualityChange = useCallback((quality: string) => {
    setSelectedQuality(quality)
    setAnalytics(prev => ({ ...prev, qualityChanges: prev.qualityChanges + 1 }))
    trackEvent('quality_change', { quality })
    onQualityChange?.(quality)
  }, [trackEvent, onQualityChange])

  // Subtitle handlers
  const handleSubtitleChange = useCallback((trackId: string | null) => {
    setSelectedSubtitle(trackId)
    setShowSubtitles(!!trackId)
    trackEvent('subtitle_change', { trackId })
    onSubtitleChange?.(trackId)
  }, [trackEvent, onSubtitleChange])

  // Picture-in-Picture handlers
  const handlePictureInPicture = useCallback(async () => {
    if (!playerRef.current) return
    
    try {
      if (isPiP) {
        await document.exitPictureInPicture()
      } else {
        await playerRef.current.requestPictureInPicture()
      }
      setIsPiP(!isPiP)
    } catch (error) {
      console.error('PiP error:', error)
    }
  }, [isPiP])

  // Fullscreen handlers
  const handleFullscreen = useCallback(async () => {
    if (!playerRef.current) return
    
    try {
      if (isFullscreen) {
        await document.exitFullscreen()
      } else {
        await playerRef.current.requestFullscreen()
      }
      setIsFullscreen(!isFullscreen)
      trackEvent('fullscreen', { isFullscreen: !isFullscreen })
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }, [isFullscreen, trackEvent])

  // Note and bookmark handlers
  const handleAddNote = useCallback(() => {
    if (!noteTitle.trim() || !noteContent.trim()) return
    
    const note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'> = {
      timestamp: currentTime,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: selectedNoteColor
    }
    
    onAddNote?.(note)
    trackEvent('note_add', { timestamp: currentTime })
    setNoteTitle('')
    setNoteContent('')
    setShowNoteDialog(false)
  }, [noteTitle, noteContent, currentTime, selectedNoteColor, onAddNote, trackEvent])

  const handleAddBookmark = useCallback(() => {
    if (!bookmarkTitle.trim()) return
    
    const bookmark: Omit<VideoBookmark, 'id' | 'createdAt'> = {
      timestamp: currentTime,
      title: bookmarkTitle.trim(),
      note: bookmarkNote.trim() || undefined,
      color: selectedBookmarkColor
    }
    
    onAddBookmark?.(bookmark)
    trackEvent('bookmark_add', { timestamp: currentTime })
    setBookmarkTitle('')
    setBookmarkNote('')
    setShowBookmarkDialog(false)
  }, [bookmarkTitle, bookmarkNote, currentTime, selectedBookmarkColor, onAddBookmark, trackEvent])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Extract playback ID from URL
  const getPlaybackId = useCallback((url: string): string | null => {
    if (playbackId) return playbackId
    if (!url) return null
    
    const match = url.match(/https:\/\/stream\.mux\.com\/([^.]+)\.m3u8/)
    if (match) return match[1]
    
    if (url.length > 10 && !url.includes('/')) return url
    return null
  }, [playbackId])

  const actualPlaybackId = getPlaybackId(src)

  // Show loading until client hydration is complete
  if (!isClient) {
    return (
      <div className={cn("relative w-full bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center", className)}>
        <div className="text-white flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Videó lejátszó betöltése...
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full bg-black rounded-lg overflow-hidden group", className)}>
      {/* Main video player */}
      <div className="relative aspect-video">
        {actualPlaybackId ? (
          <MuxPlayer
            ref={playerRef}
            playbackId={actualPlaybackId}
            tokens={{ playback: src.includes('token=') ? src.split('token=')[1] : undefined }}
            streamType="on-demand"
            controls={false}
            autoPlay={false}
            muted={false}
            loop={false}
            poster={poster}
            title={lessonTitle}
            onTimeUpdate={handleTimeUpdate}
            onEnded={onEnded}
            onPlay={handlePlay}
            onPause={handlePause}
            onLoadedMetadata={() => setIsLoading(false)}
            onError={onError}
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
            crossOrigin="anonymous"
            preload="metadata"
            primaryColor="#3B82F6"
            secondaryColor="#1E40AF"
          />
        ) : (
          <video
            ref={playerRef}
            src={src}
            controls={false}
            onTimeUpdate={handleTimeUpdate}
            onEnded={onEnded}
            onPlay={handlePlay}
            onPause={handlePause}
            onLoadedMetadata={() => setIsLoading(false)}
            onError={onError}
            className="w-full h-full"
            poster={poster}
            playsInline
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center space-y-2 text-white">
              <Loader className="w-8 h-8 animate-spin" />
              <p className="text-sm">Videó betöltése...</p>
            </div>
          </div>
        )}

        {/* Custom controls overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Top controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-medium truncate">{lessonTitle}</h3>
                <Badge variant="secondary" className="text-xs">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Subtitle menu */}
                {subtitles.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <Subtitles className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => handleSubtitleChange(null)}
                        className={!selectedSubtitle ? 'bg-blue-50' : ''}
                      >
                        Felirat kikapcsolva
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {subtitles.map(track => (
                        <DropdownMenuItem 
                          key={track.id}
                          onClick={() => handleSubtitleChange(track.id)}
                          className={selectedSubtitle === track.id ? 'bg-blue-50' : ''}
                        >
                          {track.label} ({track.language})
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Quality menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="p-2 font-medium border-b">Videó minőség</div>
                    {qualityOptions.map(option => (
                      <DropdownMenuItem 
                        key={option.value}
                        onClick={() => handleQualityChange(option.value)}
                        className={selectedQuality === option.value ? 'bg-blue-50' : ''}
                      >
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.resolution && (
                            <span className="text-xs text-gray-500">{option.resolution}</span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <div className="p-2 font-medium border-b">Lejátszási sebesség</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <DropdownMenuItem 
                        key={rate}
                        onClick={() => handleRateChange(rate)}
                        className={playbackRate === rate ? 'bg-blue-50' : ''}
                      >
                        {rate}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Picture-in-Picture */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePictureInPicture}
                  className="text-white hover:bg-white/20"
                >
                  <PictureInPicture className="w-4 h-4" />
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Center play/pause button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()}
              className="w-16 h-16 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>
          </div>

          {/* Enhanced Bottom Controls */}
          {useEnhancedControls ? (
            <div className="absolute bottom-0 left-0 right-0">
              <EnhancedVideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                playbackRate={playbackRate}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
                onPlayPause={handlePlayPause}
                onSeek={handleSeekTo}
                onVolumeChange={handleVolumeChange}
                onMute={handleMute}
                onPlaybackRateChange={handleRateChange}
                onFullscreen={handleFullscreen}
                onAddBookmark={(time) => {
                  const bookmark: Omit<VideoBookmark, 'id' | 'createdAt'> = {
                    timestamp: time,
                    title: `Könyvjelző ${formatTime(time)}`,
                    color: selectedBookmarkColor
                  }
                  onAddBookmark?.(bookmark)
                  trackEvent('bookmark_add', { timestamp: time })
                }}
                onSkip={handleSkip}
              />
              
              {/* Progress bar with markers overlay */}
              <div className="absolute bottom-16 left-4 right-4 pointer-events-none">
                {/* Chapter markers */}
                {chapters.map(chapter => (
                  <div
                    key={chapter.id}
                    className="absolute top-0 w-1 h-6 bg-yellow-400 rounded-full cursor-pointer hover:scale-125 transition-transform pointer-events-auto"
                    style={{ left: `${duration > 0 ? (chapter.startTime / duration) * 100 : 0}%` }}
                    onClick={() => handleSeekTo(chapter.startTime)}
                    title={chapter.title}
                  />
                ))}
                
                {/* Bookmark markers */}
                {bookmarks.map(bookmark => (
                  <div
                    key={bookmark.id}
                    className="absolute top-0 w-1 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform pointer-events-auto"
                    style={{ 
                      left: `${duration > 0 ? (bookmark.timestamp / duration) * 100 : 0}%`,
                      backgroundColor: bookmark.color
                    }}
                    onClick={() => handleSeekTo(bookmark.timestamp)}
                    title={bookmark.title}
                  />
                ))}
                
                {/* Note markers */}
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="absolute top-0 w-1 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform pointer-events-auto"
                    style={{ 
                      left: `${duration > 0 ? (note.timestamp / duration) * 100 : 0}%`,
                      backgroundColor: note.color
                    }}
                    onClick={() => handleSeekTo(note.timestamp)}
                    title={note.title}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Fallback to original controls */
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="space-y-3">
                {/* Original controls preserved for fallback */}
                <div className="relative">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={([value]) => handleSeekTo(value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkip(-10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkip(10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-white" />
                      <Slider
                        value={[volume]}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => handleVolumeChange(value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNoteDialog(true)}
                      className="text-white hover:bg-white/20"
                      title="Jegyzet hozzáadása"
                    >
                      <StickyNote className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBookmarkDialog(true)}
                      className="text-white hover:bg-white/20"
                      title="Könyvjelző hozzáadása"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-medium mb-4">Jegyzet hozzáadása</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cím</label>
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Jegyzet címe..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tartalom</label>
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Jegyzet tartalma..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Szín</label>
                <div className="flex gap-2 mt-2">
                  {noteColors.map(color => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        selectedNoteColor === color.value ? "border-gray-900" : "border-gray-300"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedNoteColor(color.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                  Mégse
                </Button>
                <Button onClick={handleAddNote}>
                  Hozzáadás
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bookmark Dialog */}
      {showBookmarkDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-medium mb-4">Könyvjelző hozzáadása</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cím</label>
                <Input
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  placeholder="Könyvjelző címe..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Megjegyzés (opcionális)</label>
                <Textarea
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  placeholder="Megjegyzés..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Szín</label>
                <div className="flex gap-2 mt-2">
                  {noteColors.map(color => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        selectedBookmarkColor === color.value ? "border-gray-900" : "border-gray-300"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedBookmarkColor(color.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBookmarkDialog(false)}>
                  Mégse
                </Button>
                <Button onClick={handleAddBookmark}>
                  Hozzáadás
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}