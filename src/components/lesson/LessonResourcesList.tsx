"use client"

import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Download, 
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  ExternalLink,
  FileVideo,
  FileAudio,
  FileType,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  FolderOpen,
  Star,
  Eye,
  Share2,
  MoreHorizontal,
  CheckSquare,
  Square,
  DownloadCloud,
  Trash2,
  Edit3,
  Copy,
  Clock,
  User,
  Calendar,
  Tag,
  BookOpen,
  Play,
  Pause,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Folder,
  Archive,
  Upload,
  Link,
  Info
} from 'lucide-react'
import { LessonResource } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Extended resource interface with additional metadata
interface EnhancedLessonResource extends LessonResource {
  category?: string
  tags?: string[]
  downloadCount?: number
  lastAccessed?: Date
  isStarred?: boolean
  version?: string
  author?: string
  uploadDate?: Date
  thumbnail?: string
  previewUrl?: string
  isOfflineAvailable?: boolean
  accessLevel?: 'public' | 'private' | 'restricted'
  relatedResources?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedReadTime?: number // in minutes
}

// Resource category definition
interface ResourceCategory {
  id: string
  name: string
  color: string
  icon: any
  description?: string
  count: number
}

// Download progress tracking
interface DownloadProgress {
  resourceId: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'failed'
  startTime: Date
  estimatedTimeRemaining?: number
}

// View mode options
type ViewMode = 'grid' | 'list' | 'compact' | 'detail'

// Sort options
type SortOption = 'name' | 'date' | 'size' | 'type' | 'downloads' | 'lastAccessed'

interface LessonResourcesListProps {
  resources?: EnhancedLessonResource[]
  title?: string
  enableSearch?: boolean
  enableFilters?: boolean
  enableBatchOperations?: boolean
  enableCategories?: boolean
  enableOfflineDownload?: boolean
  enablePreview?: boolean
  enableSharing?: boolean
  onResourceSelect?: (resource: EnhancedLessonResource) => void
  onBatchDownload?: (resources: EnhancedLessonResource[]) => void
  onResourceUpdate?: (resource: EnhancedLessonResource) => void
  className?: string
}

const getResourceIcon = (type: LessonResource['type'], mimeType?: string) => {
  switch (type) {
    case 'PDF':
      return FileText
    case 'DOC':
      return FileType
    case 'XLS':
      return FileSpreadsheet
    case 'PPT':
      return FileType
    case 'ZIP':
      return FileArchive
    case 'IMAGE':
      return FileImage
    default:
      // Try to guess from mime type
      if (mimeType?.includes('video')) return FileVideo
      if (mimeType?.includes('audio')) return FileAudio
      return File
  }
}

const getResourceColor = (type: LessonResource['type']) => {
  switch (type) {
    case 'PDF':
      return 'text-red-600 bg-red-50'
    case 'DOC':
      return 'text-blue-600 bg-blue-50'
    case 'XLS':
      return 'text-green-600 bg-green-50'
    case 'PPT':
      return 'text-orange-600 bg-orange-50'
    case 'ZIP':
      return 'text-purple-600 bg-purple-50'
    case 'IMAGE':
      return 'text-pink-600 bg-pink-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export const LessonResourcesList: React.FC<LessonResourcesListProps> = ({ 
  resources = [],
  title = "Letölthető anyagok",
  enableSearch = true,
  enableFilters = true,
  enableBatchOperations = true,
  enableCategories = true,
  enableOfflineDownload = false,
  enablePreview = true,
  enableSharing = true,
  onResourceSelect,
  onBatchDownload,
  onResourceUpdate,
  className
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortDesc, setSortDesc] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map())
  const [showPreview, setShowPreview] = useState<EnhancedLessonResource | null>(null)
  const [isCompactMode, setIsCompactMode] = useState(false)

  // Resource categories with icons and colors
  const categories: ResourceCategory[] = useMemo(() => {
    const categoryMap = new Map<string, { count: number }>()
    resources.forEach(resource => {
      const category = resource.category || 'uncategorized'
      categoryMap.set(category, { count: (categoryMap.get(category)?.count || 0) + 1 })
    })

    const defaultCategories: ResourceCategory[] = [
      { id: 'documents', name: 'Dokumentumok', color: 'blue', icon: FileText, count: 0 },
      { id: 'presentations', name: 'Prezentációk', color: 'orange', icon: FileType, count: 0 },
      { id: 'videos', name: 'Videók', color: 'red', icon: FileVideo, count: 0 },
      { id: 'audio', name: 'Hanganyagok', color: 'purple', icon: FileAudio, count: 0 },
      { id: 'images', name: 'Képek', color: 'green', icon: FileImage, count: 0 },
      { id: 'archives', name: 'Archívumok', color: 'gray', icon: FileArchive, count: 0 },
      { id: 'links', name: 'Linkek', color: 'indigo', icon: Link, count: 0 },
    ]

    // Update counts based on actual resources
    defaultCategories.forEach(cat => {
      cat.count = categoryMap.get(cat.id)?.count || 0
    })

    return defaultCategories
  }, [resources])

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    resources.forEach(resource => {
      resource.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [resources])

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter(resource => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          resource.title.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query) ||
          resource.tags?.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory !== 'all' && resource.category !== selectedCategory) {
        return false
      }

      // Tags filter
      if (selectedTags.size > 0) {
        const hasSelectedTag = resource.tags?.some(tag => selectedTags.has(tag))
        if (!hasSelectedTag) return false
      }

      return true
    })

    // Sort resources
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'date':
          comparison = (a.uploadDate?.getTime() || 0) - (b.uploadDate?.getTime() || 0)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'downloads':
          comparison = (a.downloadCount || 0) - (b.downloadCount || 0)
          break
        case 'lastAccessed':
          comparison = (a.lastAccessed?.getTime() || 0) - (b.lastAccessed?.getTime() || 0)
          break
      }

      return sortDesc ? -comparison : comparison
    })

    return filtered
  }, [resources, searchQuery, selectedCategory, selectedTags, sortBy, sortDesc])

  // Handle resource selection
  const toggleResourceSelection = (resourceId: string) => {
    const newSelection = new Set(selectedResources)
    if (newSelection.has(resourceId)) {
      newSelection.delete(resourceId)
    } else {
      newSelection.add(resourceId)
    }
    setSelectedResources(newSelection)
  }

  const selectAllResources = () => {
    setSelectedResources(new Set(filteredAndSortedResources.map(r => r.id)))
  }

  const clearSelection = () => {
    setSelectedResources(new Set())
  }

  // Handle downloads
  const handleSingleDownload = async (resource: EnhancedLessonResource) => {
    if (enableOfflineDownload) {
      // Simulate download with progress
      setDownloadProgress(prev => new Map(prev.set(resource.id, {
        resourceId: resource.id,
        progress: 0,
        status: 'downloading',
        startTime: new Date()
      })))

      // Simulate progress
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          const current = prev.get(resource.id)
          if (current && current.progress < 100) {
            const newProgress = current.progress + Math.random() * 15
            return new Map(prev.set(resource.id, {
              ...current,
              progress: Math.min(100, newProgress),
              status: newProgress >= 100 ? 'completed' : 'downloading'
            }))
          }
          return prev
        })
      }, 500)

      setTimeout(() => {
        clearInterval(interval)
        setDownloadProgress(prev => {
          const newMap = new Map(prev)
          newMap.delete(resource.id)
          return newMap
        })
      }, 5000)
    }

    // Actual download
    const link = document.createElement('a')
    link.href = resource.url
    link.download = resource.title || 'resource'
    link.click()

    // Update access tracking
    if (onResourceUpdate) {
      onResourceUpdate({
        ...resource,
        downloadCount: (resource.downloadCount || 0) + 1,
        lastAccessed: new Date()
      })
    }
  }

  const handleBatchDownloadSelected = () => {
    const selectedResourceObjects = filteredAndSortedResources.filter(r => 
      selectedResources.has(r.id)
    )
    
    if (onBatchDownload) {
      onBatchDownload(selectedResourceObjects)
    } else {
      // Default batch download behavior
      selectedResourceObjects.forEach(resource => {
        handleSingleDownload(resource)
      })
    }
    
    clearSelection()
  }

  // Toggle star/favorite
  const toggleStar = (resource: EnhancedLessonResource) => {
    if (onResourceUpdate) {
      onResourceUpdate({
        ...resource,
        isStarred: !resource.isStarred
      })
    }
  }

  // Resource preview
  const handlePreview = (resource: EnhancedLessonResource) => {
    if (enablePreview) {
      setShowPreview(resource)
    }
  }

  // Share resource
  const handleShare = async (resource: EnhancedLessonResource) => {
    if (enableSharing && navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: resource.url
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(resource.url)
      }
    }
  }

  if (resources.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nincsenek elérhető anyagok</h3>
        <p className="text-gray-500">
          Jelenleg nincsenek letölthető források ehhez a leckéhez.
        </p>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedResources.length} of {resources.length} anyag
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {resources.reduce((sum, r) => sum + (r.size || 0), 0) > 0 && 
                formatFileSize(resources.reduce((sum, r) => sum + (r.size || 0), 0))
              }
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompactMode(!isCompactMode)}
            >
              {isCompactMode ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {enableSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Keresés anyagok között..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            {enableCategories && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Folder className="w-4 h-4 mr-2" />
                    {selectedCategory === 'all' ? 'Összes kategória' : 
                     categories.find(c => c.id === selectedCategory)?.name}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                    Összes kategória
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map(category => (
                    <DropdownMenuItem 
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <category.icon className="w-4 h-4 mr-2" />
                      {category.name} ({category.count})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Tags Filter */}
            {enableFilters && allTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tag className="w-4 h-4 mr-2" />
                    Címkék
                    {selectedTags.size > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedTags.size}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {allTags.map(tag => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.has(tag)}
                      onCheckedChange={(checked) => {
                        const newTags = new Set(selectedTags)
                        if (checked) {
                          newTags.add(tag)
                        } else {
                          newTags.delete(tag)
                        }
                        setSelectedTags(newTags)
                      }}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortDesc ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />}
                  Rendezés
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Név szerint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  Dátum szerint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('size')}>
                  Méret szerint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('type')}>
                  Típus szerint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('downloads')}>
                  Letöltések szerint
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortDesc(!sortDesc)}>
                  {sortDesc ? 'Növekvő' : 'Csökkenő'} sorrend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {(searchQuery || selectedCategory !== 'all' || selectedTags.size > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedTags(new Set())
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Szűrők törlése
              </Button>
            )}
          </div>
        </div>

        {/* Batch Operations */}
        {enableBatchOperations && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedResources.size === filteredAndSortedResources.length ? clearSelection : selectAllResources}
              >
                {selectedResources.size === filteredAndSortedResources.length ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                {selectedResources.size === filteredAndSortedResources.length ? 'Kijelölés törlése' : 'Összes kijelölése'}
              </Button>
              {selectedResources.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedResources.size} elem kijelölve
                </span>
              )}
            </div>
            
            {selectedResources.size > 0 && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleBatchDownloadSelected}>
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Kijelöltek letöltése
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resources List */}
      <div className="p-6">
        <div className={cn(
          "space-y-3",
          isCompactMode && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0"
        )}>
          {filteredAndSortedResources.map((resource) => {
            const Icon = getResourceIcon(resource.type, resource.mimeType)
            const colorClass = getResourceColor(resource.type)
            const isSelected = selectedResources.has(resource.id)
            const downloadState = downloadProgress.get(resource.id)
            
            return (
              <div
                key={resource.id}
                className={cn(
                  "relative group rounded-lg border transition-all duration-200",
                  isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
                  isCompactMode ? "p-4" : "p-4"
                )}
              >
                {/* Selection checkbox */}
                {enableBatchOperations && (
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleResourceSelection(resource.id)}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                <div className={cn(
                  "flex gap-4",
                  isCompactMode ? "flex-col" : "items-start",
                  enableBatchOperations && "ml-8"
                )}>
                  {/* Resource Icon */}
                  <div className={cn(
                    "flex-shrink-0 p-3 rounded-lg",
                    colorClass,
                    isCompactMode && "self-center"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Resource Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm truncate" title={resource.title}>
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Star toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleStar(resource)}
                      >
                        <Star className={cn(
                          "w-4 h-4",
                          resource.isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                        )} />
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                      {resource.size && (
                        <span className="text-xs text-gray-500">
                          {formatFileSize(resource.size)}
                        </span>
                      )}
                      {resource.difficulty && (
                        <Badge variant="secondary" className="text-xs">
                          {resource.difficulty}
                        </Badge>
                      )}
                      {resource.downloadCount && resource.downloadCount > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.downloadCount}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Download Progress */}
                    {downloadState && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>
                            {downloadState.status === 'downloading' ? 'Letöltés...' : 
                             downloadState.status === 'completed' ? 'Kész' : 'Várakozás...'}
                          </span>
                          <span>{Math.round(downloadState.progress)}%</span>
                        </div>
                        <Progress value={downloadState.progress} className="h-1" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* Preview */}
                        {enablePreview && resource.previewUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(resource)}
                            title="Előnézet"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}

                        {/* External link */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(resource.url, '_blank')}
                          title="Megnyitás új ablakban"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>

                        {/* Download */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSingleDownload(resource)}
                          title="Letöltés"
                          disabled={downloadState?.status === 'downloading'}
                        >
                          {downloadState?.status === 'downloading' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>

                        {/* Share */}
                        {enableSharing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShare(resource)}
                            title="Megosztás"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* More actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(resource)}>
                            <Info className="w-4 h-4 mr-2" />
                            Részletek
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(resource.url)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Link másolása
                          </DropdownMenuItem>
                          {resource.relatedResources && resource.relatedResources.length > 0 && (
                            <DropdownMenuItem>
                              <Link className="w-4 h-4 mr-2" />
                              Kapcsolódó anyagok
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredAndSortedResources.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nincs találat</h3>
            <p className="text-gray-500">
              Próbálja meg módosítani a keresési feltételeket vagy szűrőket.
            </p>
          </div>
        )}
      </div>

      {/* Resource Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{showPreview?.title}</DialogTitle>
            <DialogDescription>
              Erőforrás részletei és előnézet
            </DialogDescription>
          </DialogHeader>
          
          {showPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Típus:</span> {showPreview.type}
                </div>
                <div>
                  <span className="font-medium">Méret:</span> {formatFileSize(showPreview.size || 0)}
                </div>
                <div>
                  <span className="font-medium">Szerző:</span> {showPreview.author || 'Ismeretlen'}
                </div>
                <div>
                  <span className="font-medium">Feltöltés:</span> {showPreview.uploadDate?.toLocaleDateString() || 'Ismeretlen'}
                </div>
              </div>
              
              {showPreview.description && (
                <div>
                  <h4 className="font-medium mb-2">Leírás</h4>
                  <p className="text-sm text-gray-600">{showPreview.description}</p>
                </div>
              )}

              {showPreview.tags && showPreview.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Címkék</h4>
                  <div className="flex flex-wrap gap-1">
                    {showPreview.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {showPreview.previewUrl && (
                <div>
                  <h4 className="font-medium mb-2">Előnézet</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {showPreview.type === 'IMAGE' ? (
                      <img 
                        src={showPreview.previewUrl} 
                        alt={showPreview.title}
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="w-16 h-16 mx-auto mb-4" />
                        <p>Előnézet nem elérhető</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(null)}>
              Bezárás
            </Button>
            {showPreview && (
              <Button onClick={() => handleSingleDownload(showPreview)}>
                <Download className="w-4 h-4 mr-2" />
                Letöltés
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 