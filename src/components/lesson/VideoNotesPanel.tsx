"use client"

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Bookmark, 
  Clock, 
  Search, 
  Edit3, 
  Trash2, 
  Download, 
  Filter,
  SortDesc,
  Play,
  Plus,
  Tag,
  Calendar,
  FileText
} from 'lucide-react'

interface VideoNote {
  id: string
  timestamp: number
  title: string
  content: string
  color: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface VideoBookmark {
  id: string
  timestamp: number
  title: string
  note?: string
  tags: string[]
  createdAt: Date
}

interface VideoNotesPanel {
  notes: VideoNote[]
  bookmarks: VideoBookmark[]
  onSeekToTime: (time: number) => void
  onUpdateNote: (noteId: string, updates: Partial<VideoNote>) => void
  onDeleteNote: (noteId: string) => void
  onUpdateBookmark: (bookmarkId: string, updates: Partial<VideoBookmark>) => void
  onDeleteBookmark: (bookmarkId: string) => void
  onExportNotes: () => void
  currentTime: number
  duration: number
  lessonTitle?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const noteColors = [
  { name: 'Yellow', value: '#fbbf24', bg: 'bg-yellow-400', text: 'text-yellow-800' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-800' },
  { name: 'Green', value: '#10b981', bg: 'bg-green-500', text: 'text-green-800' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-800' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-800' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500', text: 'text-red-800' }
]

export const VideoNotesPanel: React.FC<VideoNotesPanel> = ({
  notes,
  bookmarks,
  onSeekToTime,
  onUpdateNote,
  onDeleteNote,
  onUpdateBookmark,
  onDeleteBookmark,
  onExportNotes,
  currentTime,
  duration,
  lessonTitle = "Video Lesson",
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'time' | 'created' | 'title'>('time')
  const [filterColor, setFilterColor] = useState<string>('all')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null)

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getColorInfo = (color: string) => {
    return noteColors.find(c => c.value === color) || noteColors[0]
  }

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           note.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesColor = filterColor === 'all' || note.color === filterColor
      return matchesSearch && matchesColor
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return a.timestamp - b.timestamp
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [notes, searchQuery, filterColor, sortBy])

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = bookmarks.filter(bookmark => {
      const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (bookmark.note && bookmark.note.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return a.timestamp - b.timestamp
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [bookmarks, searchQuery, sortBy])

  const handleNoteEdit = (noteId: string, field: keyof VideoNote, value: any) => {
    onUpdateNote(noteId, { [field]: value, updatedAt: new Date() })
  }

  const handleBookmarkEdit = (bookmarkId: string, field: keyof VideoBookmark, value: any) => {
    onUpdateBookmark(bookmarkId, { [field]: value })
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l flex flex-col items-center py-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-2"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center text-gray-500 -rotate-90 whitespace-nowrap mt-8">
          Jegyzetek
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Jegyzetek és könyvjelzők</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1"
          >
            ←
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'time' | 'created' | 'title')}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="time">Időrend</option>
            <option value="created">Létrehozás</option>
            <option value="title">Név</option>
          </select>

          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="all">Minden szín</option>
            {noteColors.map(color => (
              <option key={color.value} value={color.value}>{color.name}</option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExportNotes}
            className="p-1"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="notes" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="notes" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Jegyzetek ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="text-xs">
              <Bookmark className="w-3 h-3 mr-1" />
              Könyvjelzők ({bookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="flex-1 overflow-hidden mt-2">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 pb-4">
                {filteredAndSortedNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Még nincsenek jegyzetek</p>
                  </div>
                ) : (
                  filteredAndSortedNotes.map((note) => (
                    <Card key={note.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: note.color }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSeekToTime(note.timestamp)}
                              className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(note.timestamp)}
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
                              className="p-1 h-auto"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1 h-auto text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {editingNote === note.id ? (
                          <div className="space-y-2">
                            <Input
                              value={note.title}
                              onChange={(e) => handleNoteEdit(note.id, 'title', e.target.value)}
                              className="text-sm"
                            />
                            <Textarea
                              value={note.content}
                              onChange={(e) => handleNoteEdit(note.id, 'content', e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => setEditingNote(null)}
                              >
                                Kész
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium text-sm mb-1">{note.title}</h4>
                            {note.content && (
                              <p className="text-xs text-gray-600 line-clamp-3">{note.content}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                              {new Date(note.createdAt).toLocaleDateString('hu-HU')}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks" className="flex-1 overflow-hidden mt-2">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 pb-4">
                {filteredAndSortedBookmarks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Még nincsenek könyvjelzők</p>
                  </div>
                ) : (
                  filteredAndSortedBookmarks.map((bookmark) => (
                    <Card key={bookmark.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSeekToTime(bookmark.timestamp)}
                            className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            {formatTime(bookmark.timestamp)}
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingBookmark(editingBookmark === bookmark.id ? null : bookmark.id)}
                              className="p-1 h-auto"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteBookmark(bookmark.id)}
                              className="p-1 h-auto text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {editingBookmark === bookmark.id ? (
                          <div className="space-y-2">
                            <Input
                              value={bookmark.title}
                              onChange={(e) => handleBookmarkEdit(bookmark.id, 'title', e.target.value)}
                              className="text-sm"
                            />
                            <Textarea
                              value={bookmark.note || ''}
                              onChange={(e) => handleBookmarkEdit(bookmark.id, 'note', e.target.value)}
                              rows={2}
                              className="text-sm"
                              placeholder="Megjegyzés..."
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => setEditingBookmark(null)}
                              >
                                Kész
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium text-sm mb-1">{bookmark.title}</h4>
                            {bookmark.note && (
                              <p className="text-xs text-gray-600 line-clamp-2">{bookmark.note}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                              {new Date(bookmark.createdAt).toLocaleDateString('hu-HU')}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}