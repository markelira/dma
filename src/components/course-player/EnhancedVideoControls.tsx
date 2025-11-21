'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  SkipBack, 
  SkipForward,
  RotateCcw,
  Bookmark,
  Clock,
  Gauge,
  Target,
  Star
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

interface EnhancedVideoControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isMuted: boolean
  isFullscreen: boolean
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onMute: () => void
  onPlaybackRateChange: (rate: number) => void
  onFullscreen: () => void
  onAddBookmark?: (time: number) => void
  onSkip?: (seconds: number) => void
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const SKIP_DURATION = 10 // seconds

export const EnhancedVideoControls: React.FC<EnhancedVideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  isMuted,
  isFullscreen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onPlaybackRateChange,
  onFullscreen,
  onAddBookmark,
  onSkip
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0
  }

  const getRemainingTime = () => {
    return duration - currentTime
  }

  const getPlaybackRateIcon = () => {
    if (playbackRate === 1) return <Gauge className="w-4 h-4" />
    if (playbackRate > 1) return <Target className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const getPlaybackRateColor = () => {
    if (playbackRate === 1) return 'text-gray-600'
    if (playbackRate > 1) return 'text-green-600'
    if (playbackRate < 1) return 'text-blue-600'
    return 'text-gray-600'
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    onSeek(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    onVolumeChange(value[0] / 100)
  }

  return (
    <div className="bg-gradient-to-t from-black/80 to-transparent p-4 space-y-3">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[getProgressPercentage()]}
          onValueChange={handleProgressChange}
          max={100}
          step={0.1}
          className="w-full"
        />
        
        {/* Time Display */}
        <div className="flex items-center justify-between text-sm text-white">
          <div className="flex items-center gap-4">
            <span className="font-mono">{formatTime(currentTime)}</span>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-gray-300">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-white/20 text-white border-white/30 font-mono">
              -{formatTime(getRemainingTime())}
            </Badge>
            
            {duration > 0 && (
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-300">
                {Math.round(getProgressPercentage())}%
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          {/* Skip Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip?.(-SKIP_DURATION)}
            className="text-white hover:bg-white/20 p-2"
            title={`${SKIP_DURATION} másodperccel vissza`}
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="lg"
            onClick={onPlayPause}
            className="text-white hover:bg-white/20 p-3"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </Button>

          {/* Skip Forward */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip?.(SKIP_DURATION)}
            className="text-white hover:bg-white/20 p-2"
            title={`${SKIP_DURATION} másodperccel előre`}
          >
            <SkipForward className="w-5 h-5" />
          </Button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              className="text-white hover:bg-white/20 p-2"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {showVolumeSlider && (
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Quick Bookmark */}
          {onAddBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddBookmark(currentTime)}
              className="text-white hover:bg-white/20 p-2"
              title="Könyvjelző hozzáadása"
            >
              <Bookmark className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Playback Speed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`text-white hover:bg-white/20 p-2 ${getPlaybackRateColor()}`}
              >
                <div className="flex items-center gap-1">
                  {getPlaybackRateIcon()}
                  <span className="text-xs font-bold">{playbackRate}x</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700">
              <DropdownMenuLabel className="text-gray-300">Lejátszási sebesség</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              {PLAYBACK_RATES.map(rate => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => onPlaybackRateChange(rate)}
                  className={`text-white hover:bg-gray-800 cursor-pointer ${
                    rate === playbackRate ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{rate}x</span>
                    {rate === 1 && <Badge className="ml-2 bg-blue-600 text-white text-xs">Normál</Badge>}
                    {rate > 1 && <Badge className="ml-2 bg-green-600 text-white text-xs">Gyors</Badge>}
                    {rate < 1 && <Badge className="ml-2 bg-blue-600 text-white text-xs">Lassú</Badge>}
                    {rate === playbackRate && <Star className="w-3 h-3 ml-2" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700">
              <DropdownMenuLabel className="text-gray-300">Videó beállítások</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-white hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Minőség: Auto (720p)
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Visszatekerés: {SKIP_DURATION}s
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreen}
            className="text-white hover:bg-white/20 p-2"
            title={isFullscreen ? 'Kilépés a teljes képernyőből' : 'Teljes képernyő'}
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Additional Info Bar */}
      <div className="flex items-center justify-between text-xs text-gray-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Lejátszva: {formatTime(currentTime)}</span>
          </div>
          
          {playbackRate !== 1 && (
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>{playbackRate}x sebességgel</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {duration > 0 && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>{Math.round((currentTime / duration) * 100)}% befejezve</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}