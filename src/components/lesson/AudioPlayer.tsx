"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  ListMusic,
  Clock,
  Headphones,
  Activity,
  BookOpen,
  FileAudio
} from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
  artist?: string
  coverImage?: string
  transcript?: string
  chapters?: AudioChapter[]
  onProgressUpdate?: (progressPercentage: number, timeSpent: number) => void
  onCompleted?: () => void
  enableDownload?: boolean
  className?: string
}

interface AudioChapter {
  id: string
  title: string
  startTime: number
  endTime?: number
  description?: string
}

interface AudioAnalytics {
  playCount: number
  pauseCount: number
  seekCount: number
  completionRate: number
  averageListenTime: number
  speedChanges: number[]
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title = 'Audio lecke',
  artist = 'DMA Platform',
  coverImage,
  transcript,
  chapters = [],
  onProgressUpdate,
  onCompleted,
  enableDownload = true,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [currentChapter, setCurrentChapter] = useState<AudioChapter | null>(null)
  const [analytics, setAnalytics] = useState<AudioAnalytics>({
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    completionRate: 0,
    averageListenTime: 0,
    speedChanges: []
  })
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)
  
  const progressRef = useRef<number>(0)
  const startTimeRef = useRef<Date>(new Date())

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      
      // Update progress
      const progress = (audio.currentTime / audio.duration) * 100
      progressRef.current = progress
      
      // Update current chapter
      const chapter = chapters.find(ch => 
        audio.currentTime >= ch.startTime && 
        (!ch.endTime || audio.currentTime < ch.endTime)
      )
      setCurrentChapter(chapter || null)
      
      // Report progress
      const timeSpent = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      onProgressUpdate?.(progress, timeSpent)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      if (!hasCompletedOnce) {
        setHasCompletedOnce(true)
        onCompleted?.()
        
        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          completionRate: 100
        }))
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [chapters, onProgressUpdate, onCompleted, hasCompletedOnce])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setAnalytics(prev => ({ ...prev, pauseCount: prev.pauseCount + 1 }))
    } else {
      audio.play()
      setAnalytics(prev => ({ ...prev, playCount: prev.playCount + 1 }))
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (value[0] / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
    setAnalytics(prev => ({ ...prev, seekCount: prev.seekCount + 1 }))
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
    setPlaybackSpeed(nextSpeed)
    
    setAnalytics(prev => ({
      ...prev,
      speedChanges: [...prev.speedChanges, nextSpeed]
    }))
  }

  const toggleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !isLooping
    }
    setIsLooping(!isLooping)
  }

  const jumpToChapter = (chapter: AudioChapter) => {
    if (audioRef.current) {
      audioRef.current.currentTime = chapter.startTime
      setCurrentTime(chapter.startTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${title}.mp3`
    link.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="overflow-hidden">
        {/* Main Player */}
        <div className="bg-gradient-to-br from-brand-secondary/5 to-purple-50 p-6">
          <div className="flex items-start gap-6">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-brand-secondary to-purple-400 rounded-lg flex items-center justify-center">
                {coverImage ? (
                  <img src={coverImage} alt={title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Headphones className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            {/* Player Info and Controls */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600">{artist}</p>
                {currentChapter && (
                  <Badge variant="secondary" className="mt-2">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {currentChapter.title}
                  </Badge>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skipTime(-10)}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  size="lg"
                  variant="default"
                  onClick={togglePlayPause}
                  className="rounded-full w-12 h-12"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skipTime(10)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  {/* Speed Control */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={changeSpeed}
                  >
                    {playbackSpeed}x
                  </Button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="w-24">
                      <Slider
                        value={[isMuted ? 0 : volume * 100]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  {/* Loop */}
                  <Button
                    size="sm"
                    variant={isLooping ? "default" : "ghost"}
                    onClick={toggleLoop}
                  >
                    <Repeat className="w-4 h-4" />
                  </Button>

                  {/* Download */}
                  {enableDownload && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      </Card>

      {/* Chapters */}
      {chapters.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ListMusic className="w-5 h-5 text-gray-600" />
            <h4 className="font-bold">Fejezetek</h4>
          </div>
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => jumpToChapter(chapter)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentChapter?.id === chapter.id
                    ? 'bg-brand-secondary/5 border-brand-secondary/20 border'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{chapter.title}</p>
                    {chapter.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{chapter.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(chapter.startTime)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Transcript */}
      {transcript && (
        <Card className="p-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-gray-600" />
              <h4 className="font-bold">Átírat</h4>
            </div>
            <Badge variant="secondary">
              {showTranscript ? 'Elrejtés' : 'Megjelenítés'}
            </Badge>
          </button>
          
          {showTranscript && (
            <div className="prose prose-sm max-w-none mt-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {transcript}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Analytics (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h4 className="font-bold text-sm">Audio Analytics</h4>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Lejátszások:</span> {analytics.playCount}
            </div>
            <div>
              <span className="text-gray-600">Szünetek:</span> {analytics.pauseCount}
            </div>
            <div>
              <span className="text-gray-600">Ugrások:</span> {analytics.seekCount}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}