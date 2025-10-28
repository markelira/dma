"use client"

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface VideoChapter {
  id: string
  title: string
  startTime: number // in seconds
  endTime?: number // in seconds
  description?: string
}

interface Props {
  src: string
  poster?: string
  onProgress?: (watchedPercentage: number, timeSpent: number) => void
  onEnded?: () => void
  onError?: (error: any) => void
  lessonTitle?: string
  lessonId?: string
  courseId?: string
  chapters?: VideoChapter[]
  className?: string
  autoPlay?: boolean
  startTime?: number // Resume from specific time
}

export const FirebaseVideoPlayer: React.FC<Props> = ({ 
  src, 
  poster,
  onProgress, 
  onEnded,
  onError,
  lessonTitle = "Video Lesson",
  lessonId,
  courseId,
  chapters = [],
  className,
  autoPlay = false,
  startTime = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressInterval = useRef<NodeJS.Timeout>()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [watchedPercentage, setWatchedPercentage] = useState(0)
  const [totalWatchTime, setTotalWatchTime] = useState(0)
  const [lastReportedTime, setLastReportedTime] = useState(0)
  const [currentChapter, setCurrentChapter] = useState<VideoChapter | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  const controlsTimeout = useRef<NodeJS.Timeout>()

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return
    const newTime = value[0]
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration))
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return
    const newVolume = value[0]
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return
    
    if (isMuted) {
      videoRef.current.volume = volume || 0.5
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  // Change playback rate
  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
    setShowSettings(false)
  }

  // Update current chapter
  useEffect(() => {
    if (chapters.length === 0) return
    
    const chapter = chapters.find(ch => 
      currentTime >= ch.startTime && 
      (ch.endTime ? currentTime < ch.endTime : true)
    )
    
    setCurrentChapter(chapter || null)
  }, [currentTime, chapters])

  // Handle video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Update buffered amount
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBuffered((bufferedEnd / video.duration) * 100)
      }
      
      // Track watch progress
      const percentage = (video.currentTime / video.duration) * 100
      setWatchedPercentage(percentage)
      
      // Report progress every 10 seconds
      if (Math.floor(video.currentTime) % 10 === 0 && 
          Math.floor(video.currentTime) !== lastReportedTime) {
        setLastReportedTime(Math.floor(video.currentTime))
        setTotalWatchTime(prev => prev + 10)
        onProgress?.(percentage, totalWatchTime + 10)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      
      // Resume from specific time if provided
      if (startTime && startTime > 0) {
        video.currentTime = startTime
        setCurrentTime(startTime)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    const handleError = (e: Event) => {
      console.error('Video error:', e)
      onError?.(e)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [startTime, lastReportedTime, totalWatchTime, onProgress, onEnded, onError])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
      
      if (isPlaying) {
        controlsTimeout.current = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false)
      })
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
      }
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [isPlaying])

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full bg-black rounded-lg overflow-hidden group",
        "aspect-video",
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={autoPlay}
        onClick={togglePlay}
      />

      {/* Chapter Display */}
      {currentChapter && showControls && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="text-sm font-medium">{currentChapter.title}</div>
          {currentChapter.description && (
            <div className="text-xs text-gray-300 mt-1">
              {currentChapter.description}
            </div>
          )}
        </div>
      )}

      {/* Controls Overlay */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          {/* Buffered indicator */}
          <div 
            className="h-1 bg-gray-600/50 rounded-full -mt-2"
            style={{ width: `${buffered}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            {/* Skip backward */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Skip forward */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Time display */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings */}
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 backdrop-blur-sm">
                  <div className="text-white text-xs mb-1">Sebesség</div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={cn(
                        "block w-full text-left px-2 py-1 text-sm text-white hover:bg-white/20 rounded",
                        playbackRate === rate && "bg-white/30"
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter markers */}
      {chapters.length > 0 && duration > 0 && (
        <div className="absolute bottom-16 left-4 right-4 h-1 pointer-events-none">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="absolute top-0 w-1 h-2 bg-yellow-400 rounded-full"
              style={{
                left: `${(chapter.startTime / duration) * 100}%`
              }}
              title={chapter.title}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FirebaseVideoPlayer