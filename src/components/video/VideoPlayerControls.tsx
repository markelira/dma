"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  BookmarkPlus,
  MessageSquare,
  RotateCcw,
  RotateCw,
  Gauge
} from 'lucide-react'

interface VideoNote {
  id: string
  timestamp: number
  title: string
  content: string
  color: string
  createdAt: Date
}

interface VideoBookmark {
  id: string
  timestamp: number
  title: string
  note?: string
  createdAt: Date
}

interface VideoPlayerControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isFullscreen: boolean
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onPlaybackRateChange: (rate: number) => void
  onFullscreenToggle: () => void
  onSkipForward: (seconds: number) => void
  onSkipBackward: (seconds: number) => void
  onAddBookmark?: (bookmarkData: Omit<VideoBookmark, 'id' | 'createdAt'>) => void
  onAddNote?: (noteData: Omit<VideoNote, 'id' | 'createdAt'>) => void
  notes?: VideoNote[]
  bookmarks?: VideoBookmark[]
  lessonTitle?: string
  courseTitle?: string
  className?: string
}

export const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  isFullscreen,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onFullscreenToggle,
  onSkipForward,
  onSkipBackward,
  onAddBookmark,
  onAddNote,
  notes = [],
  bookmarks = [],
  lessonTitle = "Video Lesson",
  courseTitle = "Course",
  className = ""
}) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    color: '#fbbf24' // yellow-400
  })
  const [bookmarkForm, setBookmarkForm] = useState({
    title: '',
    note: ''
  })

  const noteColors = [
    { name: 'Yellow', value: '#fbbf24', class: 'bg-yellow-400' },
    { name: 'Blue', value: '#16222F', class: 'bg-blue-500' },
    { name: 'Green', value: '#10b981', class: 'bg-green-500' },
    { name: 'Purple', value: '#8b5cf6', class: 'bg-purple-500' },
    { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
    { name: 'Red', value: '#ef4444', class: 'bg-red-500' }
  ]

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }

  const handleVolumeClick = () => {
    if (isMuted) {
      setIsMuted(false)
      onVolumeChange(0.8)
    } else {
      setIsMuted(true)
      onVolumeChange(0)
    }
  }

  const handleSeekSliderChange = (value: number[]) => {
    onSeek(value[0])
  }

  const handleVolumeSliderChange = (value: number[]) => {
    const newVolume = value[0] / 100
    onVolumeChange(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleAddNote = () => {
    if (!noteForm.title.trim() || !onAddNote) return

    onAddNote({
      timestamp: currentTime,
      title: noteForm.title,
      content: noteForm.content,
      color: noteForm.color
    })

    setNoteForm({ title: '', content: '', color: '#fbbf24' })
    setShowNoteDialog(false)
  }

  const handleAddBookmark = () => {
    if (!bookmarkForm.title.trim() || !onAddBookmark) return

    onAddBookmark({
      timestamp: currentTime,
      title: bookmarkForm.title,
      note: bookmarkForm.note
    })

    setBookmarkForm({ title: '', note: '' })
    setShowBookmarkDialog(false)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`relative ${className}`}>
      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeekSliderChange}
          className="w-full cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkipBackward(10)}
            title="10 seconds back"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={handlePlayPause}
            className="rounded-full"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkipForward(10)}
            title="10 seconds forward"
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Volume Controls */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeClick}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <div className="w-20">
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeSliderChange}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Playback Rate */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              title="Playback speed"
            >
              <Gauge className="w-4 h-4" />
            </Button>
            <select
              value={playbackRate}
              onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
              className="text-sm bg-transparent border-none outline-none cursor-pointer"
            >
              {playbackRates.map(rate => (
                <option key={rate} value={rate}>{rate}x</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Note Taking */}
          {onAddNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNoteDialog(true)}
              title="Add note"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}

          {/* Bookmark */}
          {onAddBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarkDialog(true)}
              title="Add bookmark"
            >
              <BookmarkPlus className="w-4 h-4" />
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreenToggle}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 mt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Note</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNoteDialog(false)}>
                ×
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Timestamp: {formatTime(currentTime)}
            </div>

            <Input
              placeholder="Note title"
              value={noteForm.title}
              onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
            />

            <Textarea
              placeholder="Note content (optional)"
              value={noteForm.content}
              onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />

            <div className="flex items-center space-x-2">
              <span className="text-sm">Color:</span>
              {noteColors.map(color => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded-full ${color.class} border-2 ${
                    noteForm.color === color.value ? 'border-gray-600' : 'border-gray-300'
                  }`}
                  onClick={() => setNoteForm(prev => ({ ...prev, color: color.value }))}
                />
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmark Dialog */}
      {showBookmarkDialog && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 mt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Bookmark</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowBookmarkDialog(false)}>
                ×
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Timestamp: {formatTime(currentTime)}
            </div>

            <Input
              placeholder="Bookmark title"
              value={bookmarkForm.title}
              onChange={(e) => setBookmarkForm(prev => ({ ...prev, title: e.target.value }))}
            />

            <Textarea
              placeholder="Note (optional)"
              value={bookmarkForm.note}
              onChange={(e) => setBookmarkForm(prev => ({ ...prev, note: e.target.value }))}
              rows={2}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBookmarkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBookmark}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
