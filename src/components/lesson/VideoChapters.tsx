"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react'

// Chapter interface
interface VideoChapter {
  id: string
  title: string
  startTime: number // in seconds
  endTime?: number // in seconds
  description?: string
  thumbnail?: string
  isCompleted?: boolean
}

// Bookmark interface
interface VideoBookmark {
  id: string
  title: string
  timestamp: number // in seconds
  note?: string
  createdAt: Date
}

interface VideoChaptersProps {
  chapters: VideoChapter[]
  bookmarks: VideoBookmark[]
  currentTime: number
  duration: number
  onSeekTo: (time: number) => void
  onAddBookmark?: (bookmark: Omit<VideoBookmark, 'id' | 'createdAt'>) => void
  onRemoveBookmark?: (bookmarkId: string) => void
  onUpdateBookmark?: (bookmarkId: string, bookmark: Partial<VideoBookmark>) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const VideoChapters: React.FC<VideoChaptersProps> = ({
  chapters,
  bookmarks,
  currentTime,
  duration,
  onSeekTo,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmark,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'bookmarks'>('chapters')
  const [showAddBookmark, setShowAddBookmark] = useState(false)
  const [bookmarkTitle, setBookmarkTitle] = useState('')
  const [bookmarkNote, setBookmarkNote] = useState('')
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show simple loading during SSR
  if (!isClient) {
    return (
      <div className="bg-white border-t p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  // Find current chapter
  const currentChapter = chapters.find(chapter => 
    currentTime >= chapter.startTime && 
    (chapter.endTime ? currentTime <= chapter.endTime : true)
  )

  // Format time helper
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Calculate chapter progress
  const getChapterProgress = (chapter: VideoChapter): number => {
    if (!chapter.endTime) return 0
    const chapterDuration = chapter.endTime - chapter.startTime
    const watched = Math.min(currentTime - chapter.startTime, chapterDuration)
    return Math.max(0, (watched / chapterDuration) * 100)
  }

  // Handle add bookmark
  const handleAddBookmark = () => {
    if (!bookmarkTitle.trim()) return
    
    onAddBookmark?.({
      title: bookmarkTitle,
      timestamp: currentTime,
      note: bookmarkNote || undefined
    })
    
    setBookmarkTitle('')
    setBookmarkNote('')
    setShowAddBookmark(false)
  }

  // Handle bookmark edit
  const handleEditBookmark = (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId)
    if (bookmark) {
      setBookmarkTitle(bookmark.title)
      setBookmarkNote(bookmark.note || '')
      setEditingBookmark(bookmarkId)
      setShowAddBookmark(true)
    }
  }

  // Handle update bookmark
  const handleUpdateBookmark = () => {
    if (!editingBookmark || !bookmarkTitle.trim()) return
    
    onUpdateBookmark?.(editingBookmark, {
      title: bookmarkTitle,
      note: bookmarkNote || undefined
    })
    
    setBookmarkTitle('')
    setBookmarkNote('')
    setEditingBookmark(null)
    setShowAddBookmark(false)
  }

  if (isCollapsed) {
    return (
      <div className="bg-white border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {currentChapter ? currentChapter.title : 'Fejezetek és könyvjelzők'}
          </span>
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white border-t">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant={activeTab === 'chapters' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chapters')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Fejezetek ({chapters.length})
          </Button>
          <Button
            variant={activeTab === 'bookmarks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bookmarks')}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Könyvjelzők ({bookmarks.length})
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* Chapters Tab */}
        {activeTab === 'chapters' && (
          <div className="p-4 space-y-3">
            {chapters.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nincsenek fejezetek ehhez a videóhoz</p>
            ) : (
              chapters.map((chapter, index) => {
                const isActive = chapter.id === currentChapter?.id
                const progress = getChapterProgress(chapter)
                
                return (
                  <div
                    key={chapter.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isActive ? 'bg-brand-secondary/5 border-brand-secondary/20' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onSeekTo(chapter.startTime)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium truncate ${isActive ? 'text-brand-secondary-hover' : 'text-gray-900'}`}>
                            {chapter.title}
                          </h4>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatTime(chapter.startTime)}
                          </span>
                        </div>
                        {chapter.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {chapter.description}
                          </p>
                        )}
                        {chapter.endTime && (
                          <div className="mt-2">
                            <Progress value={progress} className="h-1" />
                          </div>
                        )}
                        {chapter.isCompleted && (
                          <Badge variant="secondary" className="mt-2">
                            <BookmarkCheck className="w-3 h-3 mr-1" />
                            Befejezve
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="p-4 space-y-3">
            {/* Add Bookmark Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddBookmark(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Könyvjelző hozzáadása ({formatTime(currentTime)})
            </Button>

            {/* Add/Edit Bookmark Form */}
            {showAddBookmark && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Könyvjelző címe..."
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
                <textarea
                  placeholder="Jegyzet (opcionális)..."
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  rows={2}
                  className="w-full p-2 border rounded text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={editingBookmark ? handleUpdateBookmark : handleAddBookmark}
                    disabled={!bookmarkTitle.trim()}
                  >
                    {editingBookmark ? 'Frissítés' : 'Mentés'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddBookmark(false)
                      setEditingBookmark(null)
                      setBookmarkTitle('')
                      setBookmarkNote('')
                    }}
                  >
                    Mégse
                  </Button>
                </div>
              </div>
            )}

            {/* Bookmarks List */}
            {bookmarks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Még nincsenek könyvjelzők</p>
            ) : (
              <div className="space-y-2">
                {bookmarks
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => onSeekTo(bookmark.timestamp)}
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-white0" />
                            <h5 className="font-medium text-sm">{bookmark.title}</h5>
                            <span className="text-xs text-gray-500">
                              {formatTime(bookmark.timestamp)}
                            </span>
                          </div>
                          {bookmark.note && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">
                              {bookmark.note}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBookmark(bookmark.id)}
                            className="p-1 h-auto"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveBookmark?.(bookmark.id)}
                            className="p-1 h-auto text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}