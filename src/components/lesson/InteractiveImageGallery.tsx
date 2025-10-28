"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  Share2,
  Image as ImageIcon,
  Grid3X3,
  List,
  Search,
  Filter,
  BookmarkPlus,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  Tag,
  Clock,
  Eye,
  Heart,
  Star,
  MapPin,
  Calendar,
  User,
  Camera,
  Palette,
  Hash,
  X,
  ChevronDown,
  ChevronUp,
  Move,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Image data interface
interface GalleryImage {
  id: string
  src: string
  thumbnail?: string
  title: string
  description?: string
  alt: string
  tags: string[]
  metadata?: {
    width: number
    height: number
    size: number
    format: string
    captureDate?: Date
    location?: string
    camera?: string
    settings?: {
      aperture?: string
      shutterSpeed?: string
      iso?: string
      focalLength?: string
    }
  }
  annotations?: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    title: string
    description: string
    type: 'highlight' | 'note' | 'hotspot'
    color?: string
  }>
  assessmentData?: {
    isAssessment: boolean
    questionText?: string
    hotspots?: Array<{
      id: string
      x: number
      y: number
      width: number
      height: number
      isCorrect: boolean
      feedback?: string
    }>
  }
}

// Gallery view modes
type ViewMode = 'grid' | 'carousel' | 'list' | 'fullscreen' | 'comparison'

// Gallery configuration
interface GalleryConfig {
  enableZoom: boolean
  enableRotation: boolean
  enableDownload: boolean
  enableAnnotations: boolean
  enableAssessment: boolean
  enableSlideshow: boolean
  autoplayInterval: number
  showMetadata: boolean
  showThumbnails: boolean
  enableSearch: boolean
  enableFilters: boolean
  gridColumns: number
  imageFit: 'contain' | 'cover' | 'fill'
  transitionDuration: number
}

// Touch gesture tracking
interface TouchState {
  startX: number
  startY: number
  lastX: number
  lastY: number
  pinchDistance: number
  isZooming: boolean
  isPanning: boolean
}

interface Props {
  images: GalleryImage[]
  title?: string
  description?: string
  initialViewMode?: ViewMode
  config?: Partial<GalleryConfig>
  onImageProgress?: (imageIndex: number, timeSpent: number) => void
  onImageComplete?: (imageIndex: number) => void
  onAnnotationAdd?: (imageId: string, annotation: any) => void
  onAssessmentAnswer?: (imageId: string, answer: any) => void
  className?: string
}

export const InteractiveImageGallery: React.FC<Props> = ({
  images,
  title = "Image Gallery",
  description,
  initialViewMode = 'grid',
  config = {},
  onImageProgress,
  onImageComplete,
  onAnnotationAdd,
  onAssessmentAnswer,
  className
}) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showMetadata, setShowMetadata] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [isSlideshow, setIsSlideshow] = useState(false)
  const [imageProgress, setImageProgress] = useState<Record<string, number>>({})
  const [touchState, setTouchState] = useState<TouchState | null>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  
  // Refs
  const galleryRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const slideshowIntervalRef = useRef<NodeJS.Timeout>()
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const imageStartTimeRef = useRef<Date>(new Date())

  // Default configuration
  const defaultConfig: GalleryConfig = {
    enableZoom: true,
    enableRotation: true,
    enableDownload: true,
    enableAnnotations: true,
    enableAssessment: false,
    enableSlideshow: true,
    autoplayInterval: 5000,
    showMetadata: true,
    showThumbnails: true,
    enableSearch: true,
    enableFilters: true,
    gridColumns: 3,
    imageFit: 'contain',
    transitionDuration: 300,
    ...config
  }

  const currentImage = images[currentImageIndex]
  
  // Filter images based on search and tags
  const filteredImages = images.filter(image => {
    const matchesSearch = !searchQuery || 
      image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => image.tags.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // Get all unique tags
  const allTags = Array.from(new Set(images.flatMap(img => img.tags)))

  // Progress tracking
  useEffect(() => {
    if (viewMode === 'fullscreen' || viewMode === 'carousel') {
      imageStartTimeRef.current = new Date()
      
      progressIntervalRef.current = setInterval(() => {
        const timeSpent = Date.now() - imageStartTimeRef.current.getTime()
        const progress = Math.min(100, (timeSpent / 30000) * 100) // 30 seconds = 100%
        
        setImageProgress(prev => ({
          ...prev,
          [currentImage.id]: progress
        }))

        if (onImageProgress) {
          onImageProgress(currentImageIndex, timeSpent)
        }

        if (progress >= 100 && onImageComplete) {
          onImageComplete(currentImageIndex)
        }
      }, 1000)
      
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    }
  }, [currentImageIndex, viewMode, currentImage, onImageProgress, onImageComplete])

  // Slideshow functionality
  useEffect(() => {
    if (isSlideshow && viewMode === 'carousel') {
      slideshowIntervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => 
          prev >= images.length - 1 ? 0 : prev + 1
        )
      }, defaultConfig.autoplayInterval)
      
      return () => {
        if (slideshowIntervalRef.current) {
          clearInterval(slideshowIntervalRef.current)
        }
      }
    }
  }, [isSlideshow, viewMode, images.length, defaultConfig.autoplayInterval])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'fullscreen') {
        switch (e.key) {
          case 'ArrowLeft':
            navigateImage(-1)
            break
          case 'ArrowRight':
            navigateImage(1)
            break
          case 'Escape':
            setViewMode('grid')
            setIsFullscreen(false)
            break
          case ' ':
            e.preventDefault()
            setIsSlideshow(!isSlideshow)
            break
          case '+':
          case '=':
            handleZoom(0.2)
            break
          case '-':
            handleZoom(-0.2)
            break
          case '0':
            setZoomLevel(1)
            setPanOffset({ x: 0, y: 0 })
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, isSlideshow])

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      setTouchState({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        pinchDistance: 0,
        isZooming: false,
        isPanning: true
      })
    } else if (e.touches.length === 2) {
      // Two touches - zoom
      const distance = Math.sqrt(
        Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) +
        Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2)
      )
      
      setTouchState({
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        pinchDistance: distance,
        isZooming: true,
        isPanning: false
      })
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState) return

    if (touchState.isPanning && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchState.lastX
      const deltaY = e.touches[0].clientY - touchState.lastY
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setTouchState(prev => prev ? {
        ...prev,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY
      } : null)
    } else if (touchState.isZooming && e.touches.length === 2) {
      const distance = Math.sqrt(
        Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) +
        Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2)
      )
      
      const zoomFactor = distance / touchState.pinchDistance
      const newZoom = Math.max(0.5, Math.min(5, zoomLevel * zoomFactor))
      setZoomLevel(newZoom)
      
      setTouchState(prev => prev ? {
        ...prev,
        pinchDistance: distance
      } : null)
    }
  }, [touchState, zoomLevel])

  const handleTouchEnd = useCallback(() => {
    setTouchState(null)
  }, [])

  // Navigation functions
  const navigateImage = useCallback((direction: number) => {
    const newIndex = currentImageIndex + direction
    if (newIndex >= 0 && newIndex < filteredImages.length) {
      setCurrentImageIndex(newIndex)
      setZoomLevel(1)
      setPanOffset({ x: 0, y: 0 })
      setRotation(0)
    }
  }, [currentImageIndex, filteredImages.length])

  const selectImage = useCallback((index: number) => {
    setCurrentImageIndex(index)
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setRotation(0)
  }, [])

  // Zoom and pan functions
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.5, Math.min(5, zoomLevel + delta))
    setZoomLevel(newZoom)
  }, [zoomLevel])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const resetView = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setRotation(0)
  }, [])

  // Download function
  const handleDownload = useCallback((image: GalleryImage) => {
    const link = document.createElement('a')
    link.href = image.src
    link.download = `${image.title}.jpg`
    link.click()
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      galleryRef.current?.requestFullscreen()
      setViewMode('fullscreen')
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setViewMode('grid')
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  // Assessment interaction
  const handleHotspotClick = useCallback((image: GalleryImage, hotspot: any, e: React.MouseEvent) => {
    if (image.assessmentData && onAssessmentAnswer) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      onAssessmentAnswer(image.id, {
        hotspotId: hotspot.id,
        clickX: x,
        clickY: y,
        isCorrect: hotspot.isCorrect
      })
    }
  }, [onAssessmentAnswer])

  // Render grid view
  const renderGridView = () => (
    <div 
      className={`grid gap-4`}
      style={{ gridTemplateColumns: `repeat(${defaultConfig.gridColumns}, 1fr)` }}
    >
      {filteredImages.map((image, index) => (
        <Card 
          key={image.id}
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
          onClick={() => {
            setCurrentImageIndex(index)
            setViewMode('carousel')
          }}
        >
          <div className="relative aspect-square">
            <img
              src={image.thumbnail || image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            
            {/* Progress overlay */}
            {imageProgress[image.id] && (
              <div className="absolute bottom-0 left-0 right-0">
                <Progress value={imageProgress[image.id]} className="h-1" />
              </div>
            )}
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  <Eye className="w-4 h-4" />
                </Button>
                {defaultConfig.enableDownload && (
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(image)
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags */}
            {image.tags.length > 0 && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {image.tags.length} <Tag className="w-3 h-3 ml-1" />
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-3">
            <h4 className="font-medium text-sm truncate">{image.title}</h4>
            {image.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {image.description}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  )

  // Render carousel view
  const renderCarouselView = () => (
    <div className="space-y-4">
      {/* Main image display */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div 
            className="relative overflow-hidden bg-gray-100"
            style={{ height: '60vh' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={currentImage.src}
              alt={currentImage.alt}
              className="w-full h-full object-contain transition-transform"
              style={{ 
                transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: touchState ? 'none' : `transform ${defaultConfig.transitionDuration}ms ease-out`
              }}
            />

            {/* Annotations overlay */}
            {showAnnotations && currentImage.annotations && (
              <div className="absolute inset-0">
                {currentImage.annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-pointer hover:bg-blue-500/40 transition-colors"
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                      width: `${annotation.width}%`,
                      height: `${annotation.height}%`
                    }}
                    title={annotation.title}
                  >
                    <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {annotation.title}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assessment hotspots */}
            {currentImage.assessmentData?.hotspots && (
              <div className="absolute inset-0">
                {currentImage.assessmentData.hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    className="absolute border-2 border-red-500/50 hover:border-red-500 cursor-pointer transition-colors"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`
                    }}
                    onClick={(e) => handleHotspotClick(currentImage, hotspot, e)}
                  />
                ))}
              </div>
            )}

            {/* Navigation arrows */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => navigateImage(-1)}
              disabled={currentImageIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => navigateImage(1)}
              disabled={currentImageIndex === images.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Controls overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              {/* Slideshow toggle */}
              {defaultConfig.enableSlideshow && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setIsSlideshow(!isSlideshow)}
                >
                  {isSlideshow ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              )}

              {/* Zoom controls */}
              {defaultConfig.enableZoom && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-black/50 text-white hover:bg-black/70"
                    onClick={() => handleZoom(-0.2)}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-black/50 text-white hover:bg-black/70"
                    onClick={() => handleZoom(0.2)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Rotation */}
              {defaultConfig.enableRotation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/50 text-white hover:bg-black/70"
                  onClick={handleRotate}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              )}

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress indicator */}
            {imageProgress[currentImage.id] && (
              <div className="absolute bottom-0 left-0 right-0">
                <Progress value={imageProgress[currentImage.id]} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Image info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium">{currentImage.title}</h3>
              {currentImage.description && (
                <p className="text-gray-600 mt-1">{currentImage.description}</p>
              )}
              
              {/* Tags */}
              {currentImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentImage.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Badge variant="secondary">
                {currentImageIndex + 1} / {images.length}
              </Badge>
              
              {defaultConfig.enableDownload && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(currentImage)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Assessment question */}
          {currentImage.assessmentData?.isAssessment && currentImage.assessmentData.questionText && (
            <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  ?
                </div>
                <div>
                  <p className="font-medium text-blue-900">Assessment Question</p>
                  <p className="text-blue-800 mt-1">{currentImage.assessmentData.questionText}</p>
                  <p className="text-blue-700 text-sm mt-2">
                    Click on the correct areas in the image above to answer.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Metadata */}
          {showMetadata && currentImage.metadata && defaultConfig.showMetadata && (
            <Card className="mt-4 p-4 bg-gray-50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Metadata
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Dimensions:</span>
                  <div>{currentImage.metadata.width} × {currentImage.metadata.height}</div>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>
                  <div>{(currentImage.metadata.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                <div>
                  <span className="text-gray-500">Format:</span>
                  <div>{currentImage.metadata.format.toUpperCase()}</div>
                </div>
                {currentImage.metadata.captureDate && (
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div>{currentImage.metadata.captureDate.toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Thumbnail strip */}
      {defaultConfig.showThumbnails && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
                index === currentImageIndex 
                  ? "border-blue-500 shadow-lg" 
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => selectImage(index)}
            >
              <img
                src={image.thumbnail || image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div ref={galleryRef} className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          {defaultConfig.enableSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}

          {/* Filters */}
          {defaultConfig.enableFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="p-2">
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="space-y-1">
                    {allTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags([...selectedTags, tag])
                            } else {
                              setSelectedTags(selectedTags.filter(t => t !== tag))
                            }
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* View mode selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {viewMode === 'grid' && <Grid3X3 className="w-4 h-4 mr-2" />}
                {viewMode === 'carousel' && <ImageIcon className="w-4 h-4 mr-2" />}
                {viewMode === 'list' && <List className="w-4 h-4 mr-2" />}
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode('grid')}>
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('carousel')}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Carousel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <List className="w-4 h-4 mr-2" />
                List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle metadata */}
          {defaultConfig.showMetadata && (
            <Button
              variant={showMetadata ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
            >
              <Info className="w-4 h-4" />
            </Button>
          )}

          {/* Toggle annotations */}
          {defaultConfig.enableAnnotations && (
            <Button
              variant={showAnnotations ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Image count and progress */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{filteredImages.length} images</span>
        <div className="flex items-center gap-4">
          {Object.keys(imageProgress).length > 0 && (
            <span>
              {Object.values(imageProgress).filter(p => p >= 100).length} completed
            </span>
          )}
          {viewMode === 'carousel' && (
            <Badge variant="outline">
              {currentImageIndex + 1} / {images.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Gallery content */}
      {filteredImages.length === 0 ? (
        <Card className="p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No images match your search criteria</p>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'carousel' && renderCarouselView()}
        </>
      )}
    </div>
  )
}