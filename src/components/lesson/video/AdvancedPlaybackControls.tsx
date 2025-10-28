"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateRight,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Repeat1,
  Zap,
  Keyboard,
  Settings,
  Monitor,
  MousePointer,
  Clock,
  Target,
  Bookmark,
  MessageSquare,
  Download,
  Share2,
  Camera,
  Film,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Keyboard shortcuts configuration
interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  modifiers?: ('ctrl' | 'shift' | 'alt')[]
}

// Loop configuration
interface LoopConfig {
  enabled: boolean
  startTime: number
  endTime: number
  count?: number // If specified, loop only this many times
  currentLoop: number
}

// Timeline marker types
interface TimelineMarker {
  id: string
  timestamp: number
  type: 'bookmark' | 'note' | 'chapter' | 'quiz' | 'assignment' | 'custom'
  title: string
  description?: string
  color?: string
  icon?: React.ReactNode
}

// Playback settings
interface PlaybackSettings {
  playbackRates: number[]
  defaultPlaybackRate: number
  skipIntervals: number[] // seconds
  volumeStep: number
  frameStep: number // milliseconds for frame-by-frame
  autoplay: boolean
  autoResume: boolean
  rememberVolume: boolean
  rememberPlaybackRate: boolean
  enableKeyboardShortcuts: boolean
  showTimestamps: boolean
  showFrameNumbers: boolean
  precisionMode: boolean // More precise controls
}

// Cinema mode configuration
interface CinemaModeConfig {
  enabled: boolean
  hideUI: boolean
  dimBackground: boolean
  hideTimer: boolean
  hideControls: boolean
  autoHideDelay: number
  backgroundColor: string
  opacity: number
}

interface Props {
  videoElement: HTMLVideoElement | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isFullscreen: boolean
  markers: TimelineMarker[]
  settings: Partial<PlaybackSettings>
  loopConfig?: LoopConfig
  cinemaModeConfig?: CinemaModeConfig
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onPlaybackRateChange: (rate: number) => void
  onToggleFullscreen: () => void
  onTogglePiP: () => void
  onLoopConfigChange: (config: LoopConfig) => void
  onBookmarkAdd: (timestamp: number) => void
  onNoteAdd: (timestamp: number, content: string) => void
  onScreenshot: () => void
  onSettingsChange: (settings: Partial<PlaybackSettings>) => void
  className?: string
}

export const AdvancedPlaybackControls: React.FC<Props> = ({
  videoElement,
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  isFullscreen,
  markers,
  settings,
  loopConfig,
  cinemaModeConfig,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onToggleFullscreen,
  onTogglePiP,
  onLoopConfigChange,
  onBookmarkAdd,
  onNoteAdd,
  onScreenshot,
  onSettingsChange,
  className
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [isLoopSelecting, setIsLoopSelecting] = useState(false)
  const [loopStartMarker, setLoopStartMarker] = useState<number | null>(null)
  const [currentMarker, setCurrentMarker] = useState<TimelineMarker | null>(null)
  const [preciseModeEnabled, setPreciseModeEnabled] = useState(false)
  const [showTimecode, setShowTimecode] = useState(false)
  const [customPlaybackRate, setCustomPlaybackRate] = useState('')
  const [isSettingLoop, setIsSettingLoop] = useState(false)
  const [frameNumber, setFrameNumber] = useState(0)

  const controlsRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)
  const lastInteractionRef = useRef<Date>(new Date())

  // Default settings
  const defaultSettings: PlaybackSettings = {
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
    ...settings
  }

  // Calculate frame number based on current time
  useEffect(() => {
    if (defaultSettings.showFrameNumbers) {
      const fps = 30 // Assume 30fps, could be dynamic
      setFrameNumber(Math.floor(currentTime * fps))
    }
  }, [currentTime, defaultSettings.showFrameNumbers])

  // Check for loop completion
  useEffect(() => {
    if (loopConfig?.enabled && currentTime >= loopConfig.endTime) {
      if (!loopConfig.count || loopConfig.currentLoop < loopConfig.count) {
        onSeek(loopConfig.startTime)
        if (loopConfig.count) {
          onLoopConfigChange({
            ...loopConfig,
            currentLoop: loopConfig.currentLoop + 1
          })
        }
      } else {
        // Loop completed
        onLoopConfigChange({
          ...loopConfig,
          enabled: false,
          currentLoop: 0
        })
      }
    }
  }, [currentTime, loopConfig, onSeek, onLoopConfigChange])

  // Keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      key: ' ',
      description: 'Lejátszás/szünet',
      action: () => isPlaying ? onPause() : onPlay()
    },
    {
      key: 'ArrowLeft',
      description: '5 mp visszaugrás',
      action: () => onSeek(Math.max(0, currentTime - 5))
    },
    {
      key: 'ArrowRight',
      description: '5 mp előreugrás',
      action: () => onSeek(Math.min(duration, currentTime + 5))
    },
    {
      key: 'ArrowLeft',
      description: '10 mp visszaugrás',
      action: () => onSeek(Math.max(0, currentTime - 10)),
      modifiers: ['shift']
    },
    {
      key: 'ArrowRight',
      description: '10 mp előreugrás',
      action: () => onSeek(Math.min(duration, currentTime + 10)),
      modifiers: ['shift']
    },
    {
      key: 'ArrowUp',
      description: 'Hangerő fel',
      action: () => onVolumeChange(Math.min(1, volume + defaultSettings.volumeStep))
    },
    {
      key: 'ArrowDown',
      description: 'Hangerő le',
      action: () => onVolumeChange(Math.max(0, volume - defaultSettings.volumeStep))
    },
    {
      key: 'f',
      description: 'Teljes képernyő',
      action: onToggleFullscreen
    },
    {
      key: 'p',
      description: 'Kép a képben',
      action: onTogglePiP
    },
    {
      key: 'm',
      description: 'Némítás',
      action: () => onVolumeChange(volume > 0 ? 0 : 1)
    },
    {
      key: 'b',
      description: 'Könyvjelző hozzáadása',
      action: () => onBookmarkAdd(currentTime)
    },
    {
      key: 's',
      description: 'Képernyőkép',
      action: onScreenshot
    },
    {
      key: 'l',
      description: 'Hurok beállítás',
      action: () => setIsLoopSelecting(true)
    },
    {
      key: ',',
      description: 'Egy képkocka vissza',
      action: () => onSeek(Math.max(0, currentTime - defaultSettings.frameStep / 1000))
    },
    {
      key: '.',
      description: 'Egy képkocka előre',
      action: () => onSeek(Math.min(duration, currentTime + defaultSettings.frameStep / 1000))
    }
  ]

  // Handle keyboard events
  useEffect(() => {
    if (!defaultSettings.enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const matchedShortcut = keyboardShortcuts.find(shortcut => {
        const keyMatch = shortcut.key === e.key
        const modifiersMatch = shortcut.modifiers?.every(modifier => {
          switch (modifier) {
            case 'ctrl': return e.ctrlKey
            case 'shift': return e.shiftKey
            case 'alt': return e.altKey
            default: return false
          }
        }) ?? (!e.ctrlKey && !e.shiftKey && !e.altKey)

        return keyMatch && modifiersMatch
      })

      if (matchedShortcut) {
        e.preventDefault()
        matchedShortcut.action()
        lastInteractionRef.current = new Date()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyboardShortcuts, defaultSettings.enableKeyboardShortcuts])

  // Handle precise seeking
  const handlePreciseSeek = useCallback((direction: 'forward' | 'backward', amount: number) => {
    const newTime = direction === 'forward' 
      ? Math.min(duration, currentTime + amount)
      : Math.max(0, currentTime - amount)
    onSeek(newTime)
  }, [currentTime, duration, onSeek])

  // Handle frame-by-frame navigation
  const handleFrameStep = useCallback((direction: 'forward' | 'backward') => {
    const frameTime = defaultSettings.frameStep / 1000
    handlePreciseSeek(direction, frameTime)
  }, [defaultSettings.frameStep, handlePreciseSeek])

  // Handle loop configuration
  const handleSetLoopStart = () => {
    if (loopConfig) {
      onLoopConfigChange({
        ...loopConfig,
        startTime: currentTime
      })
    }
    setLoopStartMarker(currentTime)
  }

  const handleSetLoopEnd = () => {
    if (loopConfig && loopStartMarker !== null) {
      onLoopConfigChange({
        ...loopConfig,
        endTime: currentTime,
        enabled: true,
        currentLoop: 0
      })
      setIsLoopSelecting(false)
      setLoopStartMarker(null)
    }
  }

  const handleClearLoop = () => {
    if (loopConfig) {
      onLoopConfigChange({
        ...loopConfig,
        enabled: false,
        currentLoop: 0
      })
    }
  }

  // Format time with various precision levels
  const formatTime = (seconds: number, precision: 'seconds' | 'milliseconds' | 'frames' = 'seconds') => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    const frames = Math.floor(seconds * 30) % 30 // Assuming 30fps

    let timeString = hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`

    if (precision === 'milliseconds') {
      timeString += `.${ms.toString().padStart(3, '0')}`
    } else if (precision === 'frames') {
      timeString += `:${frames.toString().padStart(2, '0')}`
    }

    return timeString
  }

  // Get volume icon
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-4 h-4" />
    if (volume < 0.5) return <Volume1 className="w-4 h-4" />
    return <Volume2 className="w-4 h-4" />
  }

  // Handle custom playback rate
  const handleCustomPlaybackRate = () => {
    const rate = parseFloat(customPlaybackRate)
    if (!isNaN(rate) && rate > 0 && rate <= 5) {
      onPlaybackRateChange(rate)
      setCustomPlaybackRate('')
    }
  }

  return (
    <div className={cn("space-y-4", className)} ref={controlsRef}>
      {/* Timeline with Markers */}
      <div className="relative">
        {/* Main Progress Bar */}
        <div className="relative">
          <Slider
            value={[currentTime]}
            max={duration}
            step={preciseModeEnabled ? 0.1 : 1}
            onValueChange={([value]) => onSeek(value)}
            className="w-full"
          />
          
          {/* Loop Indicators */}
          {loopConfig?.enabled && (
            <>
              <div
                className="absolute top-0 h-full bg-blue-500/30 pointer-events-none"
                style={{
                  left: `${(loopConfig.startTime / duration) * 100}%`,
                  width: `${((loopConfig.endTime - loopConfig.startTime) / duration) * 100}%`
                }}
              />
              <div
                className="absolute top-0 w-1 h-full bg-blue-500 pointer-events-none"
                style={{ left: `${(loopConfig.startTime / duration) * 100}%` }}
              />
              <div
                className="absolute top-0 w-1 h-full bg-blue-500 pointer-events-none"
                style={{ left: `${(loopConfig.endTime / duration) * 100}%` }}
              />
            </>
          )}

          {/* Timeline Markers */}
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="absolute top-0 w-2 h-full cursor-pointer hover:w-3 transition-all"
              style={{
                left: `${(marker.timestamp / duration) * 100}%`,
                backgroundColor: marker.color || '#3b82f6'
              }}
              onClick={() => onSeek(marker.timestamp)}
              title={`${marker.title} - ${formatTime(marker.timestamp)}`}
            />
          ))}
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
          <div className="flex items-center gap-4">
            <span>
              {formatTime(currentTime, preciseModeEnabled ? 'milliseconds' : 'seconds')}
            </span>
            {defaultSettings.showFrameNumbers && (
              <span className="text-xs">
                Frame: {frameNumber}
              </span>
            )}
            {loopConfig?.enabled && (
              <span className="text-xs text-blue-600">
                Loop: {loopConfig.currentLoop + 1}
                {loopConfig.count && `/${loopConfig.count}`}
              </span>
            )}
          </div>
          <span>
            {formatTime(duration, preciseModeEnabled ? 'milliseconds' : 'seconds')}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Frame-by-frame controls */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFrameStep('backward')}
            className="p-2"
            title="Egy képkocka vissza (,)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Skip Backward */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreciseSeek('backward', 10)}
            className="p-2"
            title="10 másodperc vissza"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            className="p-2"
            title={isPlaying ? 'Szünet (Space)' : 'Lejátszás (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          {/* Skip Forward */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreciseSeek('forward', 10)}
            className="p-2"
            title="10 másodperc előre"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Frame-by-frame controls */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFrameStep('forward')}
            className="p-2"
            title="Egy képkocka előre (.)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2 relative">
          <div
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="p-2"
              title={`Hangerő: ${Math.round(volume * 100)}%`}
            >
              {getVolumeIcon()}
            </Button>

            {showVolumeSlider && (
              <div
                ref={volumeSliderRef}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-white border rounded-lg shadow-lg"
              >
                <div className="w-20 h-24">
                  <Slider
                    orientation="vertical"
                    value={[volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={([value]) => onVolumeChange(value / 100)}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <select
            value={playbackRate}
            onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
          >
            {defaultSettings.playbackRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={customPlaybackRate}
              onChange={(e) => setCustomPlaybackRate(e.target.value)}
              placeholder="1.0"
              className="w-16 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCustomPlaybackRate}
              disabled={!customPlaybackRate}
              className="h-8 px-2 text-xs"
            >
              ✓
            </Button>
          </div>
        </div>

        {/* Loop Controls */}
        <div className="flex items-center gap-1">
          {isLoopSelecting ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSetLoopStart}
                className="p-2 text-xs"
                title="Hurok kezdete"
              >
                A
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSetLoopEnd}
                className="p-2 text-xs"
                title="Hurok vége"
                disabled={loopStartMarker === null}
              >
                B
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsLoopSelecting(false)
                  setLoopStartMarker(null)
                }}
                className="p-2"
                title="Mégse"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant={loopConfig?.enabled ? "default" : "outline"}
                onClick={() => setIsLoopSelecting(true)}
                className="p-2"
                title="Hurok beállítás (L)"
              >
                <Repeat className="w-4 h-4" />
              </Button>
              {loopConfig?.enabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearLoop}
                  className="p-2"
                  title="Hurok törlése"
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Additional Controls */}
        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBookmarkAdd(currentTime)}
            className="p-2"
            title="Könyvjelző (B)"
          >
            <Bookmark className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onScreenshot}
            className="p-2"
            title="Képernyőkép (S)"
          >
            <Camera className="w-4 h-4" />
          </Button>

          {/* Picture-in-Picture */}
          <Button
            size="sm"
            variant="outline"
            onClick={onTogglePiP}
            className="p-2"
            title="Kép a képben (P)"
          >
            <Monitor className="w-4 h-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleFullscreen}
            className="p-2"
            title="Teljes képernyő (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Settings */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2"
            title="Beállítások"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* Keyboard Shortcuts */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="p-2"
            title="Billentyűparancsok"
          >
            <Keyboard className="w-4 h-4" />
          </Button>

          {/* Precision Mode Toggle */}
          <Button
            size="sm"
            variant={preciseModeEnabled ? "default" : "outline"}
            onClick={() => setPreciseModeEnabled(!preciseModeEnabled)}
            className="p-2"
            title="Precíziós mód"
          >
            <Target className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Lejátszási beállítások</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultSettings.enableKeyboardShortcuts}
                  onChange={(e) => onSettingsChange({ enableKeyboardShortcuts: e.target.checked })}
                />
                Billentyűparancsok engedélyezése
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultSettings.showTimestamps}
                  onChange={(e) => onSettingsChange({ showTimestamps: e.target.checked })}
                />
                Időbélyegek megjelenítése
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultSettings.showFrameNumbers}
                  onChange={(e) => onSettingsChange({ showFrameNumbers: e.target.checked })}
                />
                Képkocka számok megjelenítése
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultSettings.autoResume}
                  onChange={(e) => onSettingsChange({ autoResume: e.target.checked })}
                />
                Automatikus folytatás
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Keyboard Shortcuts Help */}
      {showKeyboardShortcuts && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Billentyűparancsok</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {keyboardShortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <span className="text-gray-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                  {shortcut.modifiers?.map(mod => `${mod}+`).join('')}{shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}