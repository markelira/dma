"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Settings,
  BookOpen,
  MessageSquare,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  customTheme?: {
    backgroundColor: string
    borderColor: string
    textColor: string
    accentColor: string
  }
}

// Course context for PiP overlay
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
  bookmarks: Array<{
    id: string
    timestamp: number
    title: string
    note?: string
  }>
  notes: Array<{
    id: string
    timestamp: number
    content: string
    title: string
  }>
}

interface Props {
  isInPiP: boolean
  videoElement: HTMLVideoElement | null
  courseContext: CourseContext
  config: Partial<PiPConfig>
  onTogglePiP: () => void
  onExitPiP: () => void
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onPlaybackRateChange: (rate: number) => void
  onConfigChange: (config: Partial<PiPConfig>) => void
  onBookmarkAdd: (timestamp: number) => void
  onNoteAdd: (timestamp: number, content: string) => void
  onNextLesson?: () => void
  className?: string
}

export const EnhancedPiPController: React.FC<Props> = ({
  isInPiP,
  videoElement,
  courseContext,
  config,
  onTogglePiP,
  onExitPiP,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onConfigChange,
  onBookmarkAdd,
  onNoteAdd,
  onNextLesson,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)
  const [showCourseInfo, setShowCourseInfo] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(true)
  const [quickNoteText, setQuickNoteText] = useState('')
  const [showQuickNote, setShowQuickNote] = useState(false)

  const pipRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout>()
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Default configuration
  const defaultConfig: PiPConfig = {
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
    ...config
  }

  // Sync with video element
  useEffect(() => {
    if (!videoElement) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime)
    const handleVolumeChange = () => setVolume(videoElement.volume)

    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('volumechange', handleVolumeChange)

    return () => {
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [videoElement])

  // Auto-hide functionality
  useEffect(() => {
    if (!defaultConfig.autoHide || !isInPiP) return

    const resetHideTimer = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      
      setIsVisible(true)
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, defaultConfig.autoHideDelay)
    }

    const handleMouseMove = () => resetHideTimer()
    const handleMouseEnter = () => {
      setIsVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
    const handleMouseLeave = () => resetHideTimer()

    if (pipRef.current) {
      pipRef.current.addEventListener('mousemove', handleMouseMove)
      pipRef.current.addEventListener('mouseenter', handleMouseEnter)
      pipRef.current.addEventListener('mouseleave', handleMouseLeave)
    }

    resetHideTimer()

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      if (pipRef.current) {
        pipRef.current.removeEventListener('mousemove', handleMouseMove)
        pipRef.current.removeEventListener('mouseenter', handleMouseEnter)
        pipRef.current.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [isInPiP, defaultConfig.autoHide, defaultConfig.autoHideDelay])

  // Load saved PiP position
  useEffect(() => {
    const savedPosition = localStorage.getItem('pip-position')
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition)
        setPipPosition(position)
      } catch (error) {
        console.error('Error loading PiP position:', error)
      }
    }
  }, [])

  // Save PiP position
  const savePipPosition = useCallback((position: { x: number; y: number }) => {
    localStorage.setItem('pip-position', JSON.stringify(position))
  }, [])

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!defaultConfig.enableDragging) return

    setIsDragging(true)
    const rect = pipRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      dragStartRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [defaultConfig.enableDragging])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !defaultConfig.enableDragging) return

    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    }

    // Snap to edges
    if (defaultConfig.snapToEdges) {
      const snapThreshold = 20
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const pipWidth = pipRef.current?.offsetWidth || 320
      const pipHeight = pipRef.current?.offsetHeight || 240

      if (newPosition.x < snapThreshold) {
        newPosition.x = 0
      } else if (newPosition.x + pipWidth > windowWidth - snapThreshold) {
        newPosition.x = windowWidth - pipWidth
      }

      if (newPosition.y < snapThreshold) {
        newPosition.y = 0
      } else if (newPosition.y + pipHeight > windowHeight - snapThreshold) {
        newPosition.y = windowHeight - pipHeight
      }
    }

    setPipPosition(newPosition)
  }, [isDragging, dragOffset, defaultConfig.enableDragging, defaultConfig.snapToEdges])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      savePipPosition(pipPosition)
    }
  }, [isDragging, pipPosition, savePipPosition])

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }

  const handleSeekBackward = () => {
    onSeek(Math.max(0, currentTime - 10))
  }

  const handleSeekForward = () => {
    onSeek(Math.min(courseContext.duration, currentTime + 10))
  }

  const handleVolumeToggle = () => {
    if (volume > 0) {
      onVolumeChange(0)
    } else {
      onVolumeChange(1)
    }
  }

  const handleAddQuickBookmark = () => {
    onBookmarkAdd(currentTime)
  }

  const handleAddQuickNote = () => {
    if (quickNoteText.trim()) {
      onNoteAdd(currentTime, quickNoteText.trim())
      setQuickNoteText('')
      setShowQuickNote(false)
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate size based on config
  const getSizeStyle = () => {
    switch (defaultConfig.size) {
      case 'small':
        return { width: '240px', height: '180px' }
      case 'medium':
        return { width: '320px', height: '240px' }
      case 'large':
        return { width: '480px', height: '360px' }
      case 'custom':
        return {
          width: `${defaultConfig.customSize?.width || 320}px`,
          height: `${defaultConfig.customSize?.height || 240}px`
        }
      default:
        return { width: '320px', height: '240px' }
    }
  }

  if (!isInPiP) return null

  return (
    <div
      ref={pipRef}
      className={cn(
        "fixed z-50 bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-300",
        isDragging && "shadow-3xl scale-105",
        !isVisible && defaultConfig.autoHide && "opacity-50",
        className
      )}
      style={{
        left: pipPosition.x,
        top: pipPosition.y,
        opacity: defaultConfig.opacity,
        ...getSizeStyle(),
        backgroundColor: defaultConfig.customTheme?.backgroundColor || 'black',
        borderColor: defaultConfig.customTheme?.borderColor || 'transparent',
        color: defaultConfig.customTheme?.textColor || 'white'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Course Information Overlay */}
      {showCourseInfo && defaultConfig.showCourseInfo && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 z-10">
          <div className="text-xs text-white/90 truncate">{courseContext.courseTitle}</div>
          <div className="text-sm font-medium text-white truncate">{courseContext.lessonTitle}</div>
          {courseContext.chapterTitle && (
            <div className="text-xs text-white/70 truncate">{courseContext.chapterTitle}</div>
          )}
        </div>
      )}

      {/* Video Container - This would contain the actual video */}
      <div className="relative w-full h-full bg-black">
        {/* Video would be rendered here */}
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          {/* Placeholder - actual video element would be positioned here */}
          <Monitor className="w-12 h-12" />
        </div>
      </div>

      {/* Controls Overlay */}
      {defaultConfig.showControls && (
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 transition-opacity duration-300",
            !isVisible && defaultConfig.autoHide && "opacity-0 pointer-events-none"
          )}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <Slider
              value={[currentTime]}
              max={courseContext.duration}
              step={1}
              onValueChange={([value]) => onSeek(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(courseContext.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSeekBackward}
                className="text-white hover:bg-white/20 p-1"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20 p-1"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleSeekForward}
                className="text-white hover:bg-white/20 p-1"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              {/* Volume Control */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleVolumeToggle}
                className="text-white hover:bg-white/20 p-1"
              >
                {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              {/* Quick Actions */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddQuickBookmark}
                className="text-white hover:bg-white/20 p-1"
                title="Gyors könyvjelző"
              >
                <BookOpen className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowQuickNote(!showQuickNote)}
                className="text-white hover:bg-white/20 p-1"
                title="Gyors jegyzet"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>

              {/* Expand to Full */}
              <Button
                size="sm"
                variant="ghost"
                onClick={onExitPiP}
                className="text-white hover:bg-white/20 p-1"
                title="Teljes képernyő"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>

              {/* Close PiP */}
              <Button
                size="sm"
                variant="ghost"
                onClick={onExitPiP}
                className="text-white hover:bg-white/20 p-1"
                title="Bezárás"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Controls */}
          {showAdvancedControls && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Sebesség:</span>
                  <select
                    value={courseContext.playbackRate}
                    onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
                    className="bg-white/20 text-white rounded px-2 py-1 text-xs"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>

                {courseContext.nextLesson && onNextLesson && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onNextLesson}
                    className="text-white hover:bg-white/20 text-xs px-2 py-1"
                  >
                    Következő lecke
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Note Input */}
      {showQuickNote && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Gyors jegyzet hozzáadása</h3>
            <textarea
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Írja ide a jegyzetét..."
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQuickNote(false)}
              >
                Mégse
              </Button>
              <Button
                size="sm"
                onClick={handleAddQuickNote}
                disabled={!quickNoteText.trim()}
              >
                Mentés
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/95 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">PiP Beállítások</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(false)}
                className="text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Size Settings */}
            <div>
              <label className="text-white text-sm block mb-2">Méret</label>
              <select
                value={defaultConfig.size}
                onChange={(e) => onConfigChange({ size: e.target.value as PiPConfig['size'] })}
                className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
              >
                <option value="small">Kicsi</option>
                <option value="medium">Közepes</option>
                <option value="large">Nagy</option>
              </select>
            </div>

            {/* Opacity Settings */}
            <div>
              <label className="text-white text-sm block mb-2">Átlátszóság</label>
              <Slider
                value={[defaultConfig.opacity * 100]}
                max={100}
                min={50}
                step={5}
                onValueChange={([value]) => onConfigChange({ opacity: value / 100 })}
              />
            </div>

            {/* Position Settings */}
            <div>
              <label className="text-white text-sm block mb-2">Pozíció</label>
              <div className="grid grid-cols-2 gap-2">
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                  <Button
                    key={pos}
                    size="sm"
                    variant={defaultConfig.position === pos ? 'default' : 'outline'}
                    onClick={() => onConfigChange({ position: pos as PiPConfig['position'] })}
                    className="text-xs"
                  >
                    {pos.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={defaultConfig.showCourseInfo}
                  onChange={(e) => onConfigChange({ showCourseInfo: e.target.checked })}
                />
                Kurzus információ megjelenítése
              </label>
              
              <label className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={defaultConfig.autoHide}
                  onChange={(e) => onConfigChange({ autoHide: e.target.checked })}
                />
                Automatikus elrejtés
              </label>
              
              <label className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={defaultConfig.snapToEdges}
                  onChange={(e) => onConfigChange({ snapToEdges: e.target.checked })}
                />
                Illesztés a szélekhez
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Settings Toggle Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-2 right-2 text-white hover:bg-white/20 p-1 opacity-70 hover:opacity-100"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Advanced Controls Toggle */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowAdvancedControls(!showAdvancedControls)}
        className="absolute bottom-12 right-2 text-white hover:bg-white/20 p-1 opacity-70 hover:opacity-100"
      >
        {showAdvancedControls ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </Button>
    </div>
  )
}