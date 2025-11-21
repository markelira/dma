'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  BookmarkPlus, 
  Edit3, 
  Trash2, 
  Clock, 
  Tag,
  Search,
  Filter,
  PlusCircle,
  Save,
  X,
  Star,
  Hash
} from 'lucide-react'
import { toast } from 'sonner'
import { useDemoNotes } from '@/lib/demoDataManager'

interface Note {
  id: string
  title: string
  content: string
  timestamp?: number
  tags: string[]
  isBookmark: boolean
  createdAt: Date
  updatedAt: Date
}

interface InteractiveNoteTakingProps {
  lessonId: string
  currentTime?: number
  onSeekTo?: (time: number) => void
}

export const InteractiveNoteTaking: React.FC<InteractiveNoteTakingProps> = ({
  lessonId,
  currentTime = 0,
  onSeekTo
}) => {
  // Use demo data manager for realistic demo experience
  const { notes: demoNotes, addNote: addDemoNote, updateNote: updateDemoNote, deleteNote: deleteDemoNote } = useDemoNotes(lessonId)
  
  // Convert demo notes to component format
  const notes: Note[] = demoNotes.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content,
    timestamp: note.timestamp,
    tags: note.tags,
    isBookmark: note.isBookmark,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }))

  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '', isBookmark: false })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [showNewNoteForm, setShowNewNoteForm] = useState(false)

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)))

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = filterTag === '' || note.tags.includes(filterTag)
    return matchesSearch && matchesTag
  })

  // Sort notes by timestamp, then by creation date
  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp
    if (a.timestamp && !b.timestamp) return -1
    if (!a.timestamp && b.timestamp) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const handleSaveNote = () => {
    if (!newNote.title.trim() && !newNote.content.trim()) {
      toast.error('Add meg a jegyzet címét vagy tartalmát!')
      return
    }

    const noteData = {
      title: newNote.title || 'Cím nélküli jegyzet',
      content: newNote.content,
      timestamp: newNote.isBookmark ? currentTime : undefined,
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isBookmark: newNote.isBookmark,
      lessonId: lessonId
    }

    addDemoNote(noteData)
    setNewNote({ title: '', content: '', tags: '', isBookmark: false })
    setShowNewNoteForm(false)
    
    toast.success(newNote.isBookmark ? 'Könyvjelző hozzáadva!' : 'Jegyzet mentve!')
  }

  const handleUpdateNote = (noteId: string, updates: Partial<Note>) => {
    updateDemoNote(noteId, updates)
    setEditingNote(null)
    toast.success('Jegyzet frissítve!')
  }

  const handleDeleteNote = (noteId: string) => {
    deleteDemoNote(noteId)
    toast.success('Jegyzet törölve!')
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleQuickBookmark = () => {
    const bookmarkData = {
      title: `Könyvjelző ${formatTime(currentTime)}`,
      content: '',
      timestamp: currentTime,
      tags: ['könyvjelző'],
      isBookmark: true,
      lessonId: lessonId
    }

    addDemoNote(bookmarkData)
    toast.success('Gyors könyvjelző hozzáadva!')
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickBookmark}
          className="flex items-center gap-2 bg-white hover:bg-blue-50"
        >
          <BookmarkPlus className="w-4 h-4" />
          Gyors könyvjelző
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewNoteForm(true)}
          className="flex items-center gap-2 bg-white hover:bg-indigo-50"
        >
          <Edit3 className="w-4 h-4" />
          Új jegyzet
        </Button>
        <div className="ml-auto text-sm text-blue-700 font-medium">
          <Clock className="w-4 h-4 inline mr-1" />
          {formatTime(currentTime)}
        </div>
      </div>

      {/* New Note Form */}
      {showNewNoteForm && (
        <Card className="border-blue-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Új jegyzet készítése</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewNoteForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              placeholder="Jegyzet címe..."
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
            />
            
            <Textarea
              placeholder="Itt írhatsz részletes jegyzeteket..."
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />
            
            <Input
              placeholder="Címkék (vesszővel elválasztva)..."
              value={newNote.tags}
              onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newNote.isBookmark}
                  onChange={(e) => setNewNote(prev => ({ ...prev, isBookmark: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Könyvjelző az aktuális időponthoz ({formatTime(currentTime)})
              </label>
              
              <Button onClick={handleSaveNote} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Mentés
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Keresés a jegyzetekben..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="">Minden címke</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <Card className="border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Még nincsenek jegyzeteid</p>
              <p className="text-sm text-gray-500">
                {searchTerm || filterTag ? 'Próbálj más keresési feltételeket.' : 'Kezdj el jegyzetelni a videó alatt!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedNotes.map(note => (
            <Card 
              key={note.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                note.isBookmark ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
              }`}
            >
              <CardContent className="p-4">
                {editingNote === note.id ? (
                  <EditNoteForm
                    note={note}
                    onSave={(updates) => handleUpdateNote(note.id, updates)}
                    onCancel={() => setEditingNote(null)}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {note.isBookmark && <Star className="w-4 h-4 text-amber-500" />}
                          <h4 className="font-medium text-gray-900 truncate">{note.title}</h4>
                          {note.timestamp !== undefined && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSeekTo?.(note.timestamp!)}
                              className="p-1 h-auto text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(note.timestamp)}
                            </Button>
                          )}
                        </div>
                        
                        {note.content && (
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">
                            {note.content}
                          </p>
                        )}
                        
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {note.tags.map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                onClick={() => setFilterTag(tag)}
                              >
                                <Hash className="w-2 h-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNote(note.id)}
                          className="p-1 h-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 h-auto text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {note.updatedAt.toLocaleDateString('hu-HU')} {note.updatedAt.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// Edit Note Form Component
interface EditNoteFormProps {
  note: Note
  onSave: (updates: Partial<Note>) => void
  onCancel: () => void
}

const EditNoteForm: React.FC<EditNoteFormProps> = ({ note, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: note.title,
    content: note.content,
    tags: note.tags.join(', ')
  })

  const handleSave = () => {
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })
  }

  return (
    <div className="space-y-3">
      <Input
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Jegyzet címe..."
      />
      
      <Textarea
        value={formData.content}
        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
        placeholder="Jegyzet tartalma..."
        rows={3}
      />
      
      <Input
        value={formData.tags}
        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
        placeholder="Címkék (vesszővel elválasztva)..."
      />
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Mégse
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Mentés
        </Button>
      </div>
    </div>
  )
}