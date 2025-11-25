"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Circle,
  SkipForward,
  SkipBack,
  BookOpen,
  Target,
  Trophy,
  RotateCcw,
  FastForward,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  Filter,
  Search,
  Bookmark,
  MessageSquare,
  Star,
  TrendingUp,
  BarChart3,
  MapPin,
  Zap,
  Film
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Enhanced chapter interface
interface EnhancedChapter {
  id: string
  title: string
  startTime: number
  endTime?: number
  duration: number
  description?: string
  thumbnail?: string
  tags: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  objectives?: string[]
  prerequisites?: string[]
  keyPoints?: string[]
  
  // Progress tracking
  progress: {
    watchTime: number
    completionPercentage: number
    lastWatchedTime: number
    isCompleted: boolean
    attempts: number
    averageWatchTime: number
    engagementScore: number
  }
  
  // Interactive elements
  interactiveElements: Array<{
    type: 'quiz' | 'note' | 'bookmark' | 'discussion' | 'exercise'
    timestamp: number
    title: string
    data?: any
  }>
  
  // Analytics
  analytics: {
    totalViews: number
    averageCompletionRate: number
    dropoffPoints: number[]
    popularSegments: Array<{
      startTime: number
      endTime: number
      viewCount: number
    }>
  }
}

// Chapter navigation view modes
type ViewMode = 'list' | 'grid' | 'timeline' | 'compact'

// Chapter filter options
interface ChapterFilter {
  difficulty?: string[]
  tags?: string[]
  progress?: 'all' | 'completed' | 'in_progress' | 'not_started'
  duration?: 'short' | 'medium' | 'long' | 'all'
  searchQuery?: string
}

// Chapter system settings
interface ChapterSystemSettings {
  autoPlay: boolean
  showThumbnails: boolean
  showProgress: boolean
  showDifficulty: boolean
  showDuration: boolean
  showObjectives: boolean
  jumpToIncomplete: boolean
  trackWatchTime: boolean
  enableKeyboardNav: boolean
  showAnalytics: boolean
  compactMode: boolean
  stickyCurrentChapter: boolean
}

interface Props {
  chapters: EnhancedChapter[]
  currentTime: number
  duration: number
  isPlaying: boolean
  currentChapterId?: string
  settings?: Partial<ChapterSystemSettings>
  onSeekTo: (time: number) => void
  onChapterSelect: (chapter: EnhancedChapter) => void
  onChapterComplete: (chapterId: string) => void
  onProgressUpdate: (chapterId: string, progress: Partial<EnhancedChapter['progress']>) => void
  onAddBookmark?: (chapterId: string, timestamp: number) => void
  onAddNote?: (chapterId: string, timestamp: number, content: string) => void
  onStartQuiz?: (chapterId: string, quizData: any) => void
  className?: string
}

export const EnhancedChapterSystem: React.FC<Props> = ({
  chapters,
  currentTime,
  duration,
  isPlaying,
  currentChapterId,
  settings = {},
  onSeekTo,
  onChapterSelect,
  onChapterComplete,
  onProgressUpdate,
  onAddBookmark,
  onAddNote,
  onStartQuiz,
  className
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isExpanded, setIsExpanded] = useState(true)
  const [filter, setFilter] = useState<ChapterFilter>({ progress: 'all', duration: 'all' })
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(currentChapterId || null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)

  const chaptersRef = useRef<HTMLDivElement>(null)
  const currentChapterRef = useRef<HTMLDivElement>(null)

  // Default settings
  const defaultSettings: ChapterSystemSettings = {
    autoPlay: false,
    showThumbnails: true,
    showProgress: true,
    showDifficulty: true,
    showDuration: true,
    showObjectives: false,
    jumpToIncomplete: false,
    trackWatchTime: true,
    enableKeyboardNav: true,
    showAnalytics: false,
    compactMode: false,
    stickyCurrentChapter: true,
    ...settings
  }

  // Find current chapter based on current time
  const currentChapter = chapters.find(chapter => 
    currentTime >= chapter.startTime && 
    (chapter.endTime ? currentTime <= chapter.endTime : 
     chapter === chapters[chapters.length - 1] || 
     currentTime < chapters[chapters.indexOf(chapter) + 1]?.startTime)
  )

  // Filter chapters based on current filter
  const filteredChapters = chapters.filter(chapter => {
    // Search query filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const matchesSearch = 
        chapter.title.toLowerCase().includes(query) ||
        chapter.description?.toLowerCase().includes(query) ||
        chapter.tags.some(tag => tag.toLowerCase().includes(query)) ||
        chapter.keyPoints?.some(point => point.toLowerCase().includes(query))
      
      if (!matchesSearch) return false
    }

    // Difficulty filter
    if (filter.difficulty && filter.difficulty.length > 0) {
      if (!chapter.difficulty || !filter.difficulty.includes(chapter.difficulty)) {
        return false
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      if (!chapter.tags.some(tag => filter.tags!.includes(tag))) {
        return false
      }
    }

    // Progress filter
    if (filter.progress && filter.progress !== 'all') {
      switch (filter.progress) {
        case 'completed':
          if (!chapter.progress.isCompleted) return false
          break
        case 'in_progress':
          if (chapter.progress.completionPercentage === 0 || chapter.progress.isCompleted) return false
          break
        case 'not_started':
          if (chapter.progress.completionPercentage > 0) return false
          break
      }
    }

    // Duration filter
    if (filter.duration && filter.duration !== 'all') {
      const durationMinutes = chapter.duration / 60
      switch (filter.duration) {
        case 'short':
          if (durationMinutes > 5) return false
          break
        case 'medium':
          if (durationMinutes <= 5 || durationMinutes > 15) return false
          break
        case 'long':
          if (durationMinutes <= 15) return false
          break
      }
    }

    return true
  })

  // Get chapter statistics
  const getChapterStats = () => {
    const totalChapters = chapters.length
    const completedChapters = chapters.filter(ch => ch.progress.isCompleted).length
    const inProgressChapters = chapters.filter(ch => 
      ch.progress.completionPercentage > 0 && !ch.progress.isCompleted
    ).length
    const totalWatchTime = chapters.reduce((sum, ch) => sum + ch.progress.watchTime, 0)
    const avgEngagement = chapters.reduce((sum, ch) => sum + ch.progress.engagementScore, 0) / totalChapters

    return {
      totalChapters,
      completedChapters,
      inProgressChapters,
      completionRate: (completedChapters / totalChapters) * 100,
      totalWatchTime,
      avgEngagement
    }
  }

  // Handle chapter selection
  const handleChapterSelect = useCallback((chapter: EnhancedChapter) => {
    setSelectedChapter(chapter.id)
    onSeekTo(chapter.startTime)
    onChapterSelect(chapter)

    // Scroll to chapter if needed
    if (currentChapterRef.current && defaultSettings.stickyCurrentChapter) {
      currentChapterRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      })
    }
  }, [onSeekTo, onChapterSelect, defaultSettings.stickyCurrentChapter])

  // Handle keyboard navigation
  useEffect(() => {
    if (!defaultSettings.enableKeyboardNav) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      const currentIndex = chapters.findIndex(ch => ch.id === selectedChapter)
      
      switch (e.key) {
        case 'ArrowUp':
          if (currentIndex > 0) {
            e.preventDefault()
            handleChapterSelect(chapters[currentIndex - 1])
          }
          break
        case 'ArrowDown':
          if (currentIndex < chapters.length - 1) {
            e.preventDefault()
            handleChapterSelect(chapters[currentIndex + 1])
          }
          break
        case 'Enter':
          if (selectedChapter) {
            e.preventDefault()
            const chapter = chapters.find(ch => ch.id === selectedChapter)
            if (chapter) handleChapterSelect(chapter)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedChapter, chapters, handleChapterSelect, defaultSettings.enableKeyboardNav])

  // Auto-scroll to current chapter
  useEffect(() => {
    if (currentChapter && defaultSettings.stickyCurrentChapter && currentChapterRef.current) {
      currentChapterRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      })
    }
  }, [currentChapter, defaultSettings.stickyCurrentChapter])

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-200'
    if (percentage < 50) return 'bg-brand-secondary/50'
    if (percentage < 100) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Render chapter item based on view mode
  const renderChapterItem = (chapter: EnhancedChapter, index: number) => {
    const isCurrentChapter = currentChapter?.id === chapter.id
    const isSelected = selectedChapter === chapter.id
    const isHovered = hoveredChapter === chapter.id

    const chapterElement = (
      <div
        key={chapter.id}
        ref={isCurrentChapter ? currentChapterRef : undefined}
        className={cn(
          "transition-all duration-200 cursor-pointer group",
          isCurrentChapter && "ring-2 ring-brand-secondary",
          isSelected && "bg-brand-secondary/5",
          isHovered && "shadow-md scale-[1.02]",
          viewMode === 'compact' ? "p-2" : "p-4"
        )}
        onMouseEnter={() => setHoveredChapter(chapter.id)}
        onMouseLeave={() => setHoveredChapter(null)}
        onClick={() => handleChapterSelect(chapter)}
      >
        {viewMode === 'grid' ? (
          // Grid view
          <div className="space-y-3">
            {defaultSettings.showThumbnails && chapter.thumbnail && (
              <div className="aspect-video bg-gray-200 rounded overflow-hidden">
                <img 
                  src={chapter.thumbnail} 
                  alt={chapter.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm line-clamp-2">{chapter.title}</h4>
                {isCurrentChapter && <Eye className="w-4 h-4 text-white0 flex-shrink-0" />}
              </div>
              
              {defaultSettings.showDuration && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatTime(chapter.duration)}
                </div>
              )}
              
              {defaultSettings.showProgress && (
                <div className="space-y-1">
                  <Progress 
                    value={chapter.progress.completionPercentage} 
                    className="h-1"
                  />
                  <div className="text-xs text-gray-500">
                    {Math.round(chapter.progress.completionPercentage)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'timeline' ? (
          // Timeline view
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                chapter.progress.isCompleted 
                  ? "bg-green-500 border-green-500" 
                  : isCurrentChapter 
                    ? "bg-brand-secondary/50 border-brand-secondary"
                    : "bg-white border-gray-300"
              )}>
                {chapter.progress.isCompleted && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </div>
              {index < filteredChapters.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 mt-2" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium truncate">{chapter.title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {formatTime(chapter.startTime)} - {formatTime(chapter.startTime + chapter.duration)}
                </div>
              </div>
              
              {chapter.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {chapter.description}
                </p>
              )}
              
              {defaultSettings.showProgress && (
                <div className="mt-2">
                  <Progress 
                    value={chapter.progress.completionPercentage} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          // List view (default)
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                chapter.progress.isCompleted 
                  ? "bg-green-100 text-green-800" 
                  : isCurrentChapter 
                    ? "bg-brand-secondary/10 text-brand-secondary-hover"
                    : "bg-gray-100 text-gray-600"
              )}>
                {chapter.progress.isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              {defaultSettings.showThumbnails && chapter.thumbnail && (
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={chapter.thumbnail} 
                    alt={chapter.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{chapter.title}</h4>
                  {chapter.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {chapter.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2">
                    {defaultSettings.showDuration && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(chapter.duration)}
                      </div>
                    )}
                    
                    {defaultSettings.showDifficulty && chapter.difficulty && (
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getDifficultyColor(chapter.difficulty))}
                      >
                        {chapter.difficulty}
                      </Badge>
                    )}
                    
                    {chapter.interactiveElements.length > 0 && (
                      <div className="flex items-center gap-1">
                        {chapter.interactiveElements.some(el => el.type === 'quiz') && (
                          <Target className="w-3 h-3 text-orange-500" title="Kvíz" />
                        )}
                        {chapter.interactiveElements.some(el => el.type === 'exercise') && (
                          <Zap className="w-3 h-3 text-purple-500" title="Gyakorlat" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {defaultSettings.showProgress && (
                    <div className="w-20">
                      <Progress 
                        value={chapter.progress.completionPercentage} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {Math.round(chapter.progress.completionPercentage)}%
                      </div>
                    </div>
                  )}
                  
                  {isCurrentChapter && (
                    <Badge variant="default" className="text-xs">
                      Most nézi
                    </Badge>
                  )}
                </div>
              </div>
              
              {defaultSettings.showObjectives && chapter.objectives && chapter.objectives.length > 0 && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium mb-1">Tanulási célok:</div>
                  <ul className="space-y-1">
                    {chapter.objectives.slice(0, 3).map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <Target className="w-3 h-3 mt-0.5 text-white0 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                    {chapter.objectives.length > 3 && (
                      <li className="text-gray-500">
                        +{chapter.objectives.length - 3} további cél
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )

    return viewMode === 'grid' ? (
      <Card key={chapter.id} className="p-0 overflow-hidden">
        {chapterElement}
      </Card>
    ) : (
      <Card key={chapter.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow">
        {chapterElement}
      </Card>
    )
  }

  const stats = getChapterStats()

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          <h3 className="text-lg font-medium">
            Fejezetek ({filteredChapters.length}/{chapters.length})
          </h3>
          
          <Badge variant="outline" className="text-xs">
            {Math.round(stats.completionRate)}% kész
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {viewMode === 'list' && <List className="w-4 h-4" />}
                {viewMode === 'grid' && <Grid3X3 className="w-4 h-4" />}
                {viewMode === 'timeline' && <BarChart3 className="w-4 h-4" />}
                {viewMode === 'compact' && <Eye className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <List className="w-4 h-4 mr-2" />
                Lista nézet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('grid')}>
                <Grid3X3 className="w-4 h-4 mr-2" />
                Rács nézet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('timeline')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Idővonal nézet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('compact')}>
                <Eye className="w-4 h-4 mr-2" />
                Kompakt nézet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Analytics Toggle */}
          <Button
            variant={showAnalytics ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Tanulási statisztikák</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedChapters}</div>
              <div className="text-gray-500">Befejezett</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-secondary">{stats.inProgressChapters}</div>
              <div className="text-gray-500">Folyamatban</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatTime(stats.totalWatchTime)}
              </div>
              <div className="text-gray-500">Nézési idő</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(stats.avgEngagement)}%
              </div>
              <div className="text-gray-500">Átlag elköteleződés</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      {isExpanded && (
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Keresés fejezetek között..."
                value={filter.searchQuery || ''}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                className="w-full"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Szűrők
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-2 font-medium">Haladás</div>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, progress: 'all' })}>
                  Minden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, progress: 'completed' })}>
                  Befejezett
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, progress: 'in_progress' })}>
                  Folyamatban
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, progress: 'not_started' })}>
                  Nem kezdett
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2 font-medium">Időtartam</div>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, duration: 'all' })}>
                  Minden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, duration: 'short' })}>
                  Rövid (&lt;5 perc)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, duration: 'medium' })}>
                  Közepes (5-15 perc)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ ...filter, duration: 'long' })}>
                  Hosszú (&gt;15 perc)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextIncomplete = chapters.find(ch => !ch.progress.isCompleted)
                if (nextIncomplete) handleChapterSelect(nextIncomplete)
              }}
              disabled={stats.completedChapters === stats.totalChapters}
            >
              Következő befejezetlen
            </Button>
          </div>
        </Card>
      )}

      {/* Chapter List */}
      {isExpanded && (
        <div 
          ref={chaptersRef}
          className={cn(
            "space-y-2",
            viewMode === 'grid' && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 space-y-0",
            defaultSettings.compactMode && "space-y-1"
          )}
        >
          {filteredChapters.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2" />
                Nincs találat a szűrési feltételeknek megfelelően
              </div>
            </Card>
          ) : (
            filteredChapters.map((chapter, index) => renderChapterItem(chapter, index))
          )}
        </div>
      )}

      {/* Current Chapter Progress */}
      {currentChapter && (
        <Card className="p-4 bg-brand-secondary/5 border-brand-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-brand-secondary/50 rounded-full animate-pulse" />
              <div>
                <h4 className="font-medium">{currentChapter.title}</h4>
                <div className="text-sm text-gray-600">
                  {formatTime(currentTime - currentChapter.startTime)} / {formatTime(currentChapter.duration)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Progress 
                value={((currentTime - currentChapter.startTime) / currentChapter.duration) * 100} 
                className="w-24"
              />
              <div className="text-sm font-medium">
                {Math.round(((currentTime - currentChapter.startTime) / currentChapter.duration) * 100)}%
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}