"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Info,
  MousePointer,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Award,
  Star,
  ThumbsUp,
  MessageCircle,
  X,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  Filter,
  Search,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Interactive hotspot data structure
interface InfographicHotspot {
  id: string
  x: number // percentage position
  y: number // percentage position
  width: number // percentage size
  height: number // percentage size
  type: 'info' | 'question' | 'action' | 'chart' | 'video' | 'link' | 'tooltip'
  title: string
  description: string
  content?: {
    text?: string
    html?: string
    imageUrl?: string
    videoUrl?: string
    chartData?: any
    linkUrl?: string
    actionType?: 'expand' | 'popup' | 'navigate' | 'download'
  }
  style?: {
    color?: string
    borderColor?: string
    backgroundColor?: string
    borderWidth?: number
    borderRadius?: number
    opacity?: number
    animation?: 'pulse' | 'bounce' | 'glow' | 'shake' | 'none'
  }
  triggers?: {
    onClick?: boolean
    onHover?: boolean
    onFocus?: boolean
    autoShow?: boolean
    autoShowDelay?: number
  }
  assessment?: {
    isAssessment: boolean
    questionText?: string
    correctAnswer?: string
    explanation?: string
    points?: number
    attempts?: number
  }
  analytics?: {
    category: string
    label: string
    value?: number
  }
}

// Data visualization configuration
interface DataVisualization {
  id: string
  type: 'bar' | 'pie' | 'line' | 'area' | 'scatter' | 'heatmap' | 'treemap'
  title: string
  data: Array<{
    label: string
    value: number
    color?: string
    description?: string
    category?: string
  }>
  config?: {
    animated?: boolean
    interactive?: boolean
    showLegend?: boolean
    showValues?: boolean
    showGrid?: boolean
    theme?: 'light' | 'dark'
    colors?: string[]
  }
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Animation and transition settings
interface AnimationConfig {
  enableAnimations: boolean
  transitionDuration: number
  hoverDelay: number
  autoPlayEnabled: boolean
  autoPlayInterval: number
  sequentialReveal: boolean
  revealDelay: number
}

// Progress tracking for interactive elements
interface InteractionProgress {
  hotspotsViewed: Set<string>
  hotspotsClicked: Set<string>
  visualizationsInteracted: Set<string>
  timeSpentPerHotspot: Record<string, number>
  completionPercentage: number
  assessmentAnswers: Record<string, any>
  userPath: Array<{
    hotspotId: string
    timestamp: number
    action: 'view' | 'click' | 'hover' | 'complete'
  }>
}

interface Props {
  infographicUrl: string
  title?: string
  description?: string
  hotspots: InfographicHotspot[]
  visualizations?: DataVisualization[]
  animationConfig?: Partial<AnimationConfig>
  enableAssessment?: boolean
  enableProgress?: boolean
  onHotspotInteraction?: (hotspotId: string, interactionType: string, data?: any) => void
  onProgressUpdate?: (progress: InteractionProgress) => void
  onAssessmentAnswer?: (hotspotId: string, answer: any, isCorrect: boolean) => void
  onComplete?: (progress: InteractionProgress) => void
  className?: string
}

export const InteractiveInfographics: React.FC<Props> = ({
  infographicUrl,
  title = "Interactive Infographics",
  description,
  hotspots,
  visualizations = [],
  animationConfig = {},
  enableAssessment = false,
  enableProgress = true,
  onHotspotInteraction,
  onProgressUpdate,
  onAssessmentAnswer,
  onComplete,
  className
}) => {
  // State management
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<InteractionProgress>({
    hotspotsViewed: new Set(),
    hotspotsClicked: new Set(),
    visualizationsInteracted: new Set(),
    timeSpentPerHotspot: {},
    completionPercentage: 0,
    assessmentAnswers: {},
    userPath: []
  })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAllHotspots, setShowAllHotspots] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [currentAutoPlayIndex, setCurrentAutoPlayIndex] = useState(0)
  const [showProgress, setShowProgress] = useState(enableProgress)
  const [filterType, setFilterType] = useState<string>('all')
  
  // Refs
  const infographicRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const autoPlayIntervalRef = useRef<NodeJS.Timeout>()
  const hotspotTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  const interactionStartTimeRef = useRef<Record<string, number>>({})

  // Default animation configuration
  const defaultAnimationConfig: AnimationConfig = {
    enableAnimations: true,
    transitionDuration: 300,
    hoverDelay: 500,
    autoPlayEnabled: false,
    autoPlayInterval: 5000,
    sequentialReveal: false,
    revealDelay: 1000,
    ...animationConfig
  }

  // Calculate completion percentage
  const calculateProgress = useCallback(() => {
    const totalInteractiveElements = hotspots.length + visualizations.length
    const completedElements = progress.hotspotsClicked.size + progress.visualizationsInteracted.size
    return totalInteractiveElements > 0 ? (completedElements / totalInteractiveElements) * 100 : 0
  }, [hotspots.length, visualizations.length, progress])

  // Update progress tracking
  const updateProgress = useCallback((update: Partial<InteractionProgress>) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...update }
      newProgress.completionPercentage = calculateProgress()
      
      if (onProgressUpdate) {
        onProgressUpdate(newProgress)
      }
      
      // Check if completed
      if (newProgress.completionPercentage === 100 && onComplete) {
        onComplete(newProgress)
      }
      
      return newProgress
    })
  }, [calculateProgress, onProgressUpdate, onComplete])

  // Handle hotspot interaction
  const handleHotspotInteraction = useCallback((
    hotspot: InfographicHotspot, 
    interactionType: 'view' | 'click' | 'hover' | 'complete',
    event?: React.MouseEvent
  ) => {
    const timestamp = Date.now()
    
    // Start timing if not already started
    if (!interactionStartTimeRef.current[hotspot.id]) {
      interactionStartTimeRef.current[hotspot.id] = timestamp
    }

    // Update progress based on interaction type
    const progressUpdate: Partial<InteractionProgress> = {
      userPath: [...progress.userPath, {
        hotspotId: hotspot.id,
        timestamp,
        action: interactionType
      }]
    }

    switch (interactionType) {
      case 'view':
        progressUpdate.hotspotsViewed = new Set([...progress.hotspotsViewed, hotspot.id])
        break
      case 'click':
        progressUpdate.hotspotsClicked = new Set([...progress.hotspotsClicked, hotspot.id])
        setActiveHotspot(hotspot.id)
        break
      case 'hover':
        setHoveredHotspot(hotspot.id)
        break
      case 'complete':
        const timeSpent = timestamp - (interactionStartTimeRef.current[hotspot.id] || timestamp)
        progressUpdate.timeSpentPerHotspot = {
          ...progress.timeSpentPerHotspot,
          [hotspot.id]: (progress.timeSpentPerHotspot[hotspot.id] || 0) + timeSpent
        }
        setCompletedHotspots(prev => new Set([...prev, hotspot.id]))
        break
    }

    updateProgress(progressUpdate)

    // Notify parent component
    if (onHotspotInteraction) {
      onHotspotInteraction(hotspot.id, interactionType, {
        hotspot,
        event,
        progress: progressUpdate
      })
    }

    // Handle assessment
    if (interactionType === 'click' && hotspot.assessment?.isAssessment && onAssessmentAnswer) {
      // This would typically open an assessment modal or inline form
      // For now, we'll simulate the assessment interaction
      const isCorrect = true // This would come from user input
      onAssessmentAnswer(hotspot.id, { answer: 'simulated' }, isCorrect)
    }
  }, [progress, updateProgress, onHotspotInteraction, onAssessmentAnswer])

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && defaultAnimationConfig.autoPlayEnabled) {
      autoPlayIntervalRef.current = setInterval(() => {
        const nextIndex = (currentAutoPlayIndex + 1) % hotspots.length
        const nextHotspot = hotspots[nextIndex]
        
        if (nextHotspot) {
          handleHotspotInteraction(nextHotspot, 'click')
          setCurrentAutoPlayIndex(nextIndex)
        }
      }, defaultAnimationConfig.autoPlayInterval)

      return () => {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current)
        }
      }
    }
  }, [autoPlay, currentAutoPlayIndex, hotspots, defaultAnimationConfig, handleHotspotInteraction])

  // Sequential reveal animation
  useEffect(() => {
    if (defaultAnimationConfig.sequentialReveal && isLoaded) {
      hotspots.forEach((hotspot, index) => {
        const timer = setTimeout(() => {
          handleHotspotInteraction(hotspot, 'view')
        }, index * defaultAnimationConfig.revealDelay)
        
        hotspotTimersRef.current[hotspot.id] = timer
      })

      return () => {
        Object.values(hotspotTimersRef.current).forEach(timer => clearTimeout(timer))
      }
    }
  }, [isLoaded, hotspots, defaultAnimationConfig, handleHotspotInteraction])

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  // Zoom and pan handlers
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }, [])

  const handleReset = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setActiveHotspot(null)
    setHoveredHotspot(null)
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      infographicRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Filter hotspots by type
  const filteredHotspots = hotspots.filter(hotspot => 
    filterType === 'all' || hotspot.type === filterType
  )

  // Get hotspot style based on state
  const getHotspotStyle = useCallback((hotspot: InfographicHotspot) => {
    const isActive = activeHotspot === hotspot.id
    const isHovered = hoveredHotspot === hotspot.id
    const isCompleted = completedHotspots.has(hotspot.id)
    const isViewed = progress.hotspotsViewed.has(hotspot.id)

    const baseStyle = {
      position: 'absolute' as const,
      left: `${hotspot.x}%`,
      top: `${hotspot.y}%`,
      width: `${hotspot.width}%`,
      height: `${hotspot.height}%`,
      cursor: 'pointer',
      transition: `all ${defaultAnimationConfig.transitionDuration}ms ease-in-out`,
      transform: isActive ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
      zIndex: isActive ? 50 : isHovered ? 40 : 30,
      borderRadius: hotspot.style?.borderRadius || 8,
      border: `${hotspot.style?.borderWidth || 2}px solid ${
        isCompleted ? '#10B981' : 
        isActive ? '#3B82F6' : 
        isHovered ? '#6366F1' :
        isViewed ? '#F59E0B' :
        hotspot.style?.borderColor || '#E5E7EB'
      }`,
      backgroundColor: hotspot.style?.backgroundColor || (
        isCompleted ? '#10B98120' :
        isActive ? '#3B82F620' :
        isHovered ? '#6366F120' :
        isViewed ? '#F59E0B20' :
        '#E5E7EB20'
      ),
      opacity: hotspot.style?.opacity ?? (showAllHotspots ? 0.8 : isHovered || isActive ? 0.8 : 0.3)
    }

    // Add animation classes
    if (defaultAnimationConfig.enableAnimations && hotspot.style?.animation) {
      const animationClass = `animate-${hotspot.style.animation}`
      // Note: You would need to add these animations to your CSS
    }

    return baseStyle
  }, [
    activeHotspot, 
    hoveredHotspot, 
    completedHotspots, 
    progress.hotspotsViewed, 
    showAllHotspots, 
    defaultAnimationConfig
  ])

  // Render hotspot content popup
  const renderHotspotContent = (hotspot: InfographicHotspot) => {
    if (activeHotspot !== hotspot.id) return null

    return (
      <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-50 min-w-64 max-w-sm">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{hotspot.title}</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveHotspot(null)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{hotspot.description}</p>
        
        {/* Content based on type */}
        {hotspot.content && (
          <div className="mb-3">
            {hotspot.content.text && (
              <p className="text-sm">{hotspot.content.text}</p>
            )}
            
            {hotspot.content.imageUrl && (
              <img 
                src={hotspot.content.imageUrl} 
                alt={hotspot.title}
                className="w-full h-32 object-cover rounded mt-2"
              />
            )}
            
            {hotspot.content.linkUrl && (
              <a 
                href={hotspot.content.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 mt-2"
              >
                <BookOpen className="w-4 h-4" />
                További információ
              </a>
            )}
          </div>
        )}
        
        {/* Assessment question */}
        {hotspot.assessment?.isAssessment && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Kérdés</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              {hotspot.assessment.questionText}
            </p>
            <Button 
              size="sm" 
              onClick={() => {
                handleHotspotInteraction(hotspot, 'complete')
                setActiveHotspot(null)
              }}
            >
              Válasz elküldése
            </Button>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleHotspotInteraction(hotspot, 'complete')}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Kész
          </Button>
          
          {hotspot.content?.linkUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(hotspot.content?.linkUrl, '_blank')}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Megnyitás
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={infographicRef} className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                Összes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('info')}>
                <Info className="w-4 h-4 mr-2" />
                Információ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('question')}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Kérdések
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('chart')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Diagramok
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Controls */}
          <Button
            variant={showAllHotspots ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllHotspots(!showAllHotspots)}
          >
            {showAllHotspots ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button
            variant={autoPlay ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoPlay(!autoPlay)}
          >
            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-sm text-gray-600 px-2">
            {Math.round(zoomLevel * 100)}%
          </span>

          <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress indicators */}
      {showProgress && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Interakciók előrehaladása</span>
            <Badge variant="secondary">
              {progress.hotspotsClicked.size} / {hotspots.length}
            </Badge>
          </div>
          <Progress value={progress.completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Megtekintett: {progress.hotspotsViewed.size}</span>
            <span>Befejezett: {completedHotspots.size}</span>
          </div>
        </Card>
      )}

      {/* Main infographic container */}
      <Card className="overflow-hidden">
        <div 
          className="relative bg-gray-50"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          {/* Base infographic image */}
          <img
            ref={imageRef}
            src={infographicUrl}
            alt={title}
            className="w-full h-auto"
            onLoad={handleImageLoad}
          />

          {/* Interactive hotspots overlay */}
          {isLoaded && filteredHotspots.map((hotspot) => (
            <TooltipProvider key={hotspot.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    style={getHotspotStyle(hotspot)}
                    onClick={(e) => handleHotspotInteraction(hotspot, 'click', e)}
                    onMouseEnter={() => handleHotspotInteraction(hotspot, 'hover')}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    className="group"
                  >
                    {/* Hotspot indicator */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
                        completedHotspots.has(hotspot.id) ? "bg-green-500" :
                        progress.hotspotsViewed.has(hotspot.id) ? "bg-blue-500" : "bg-gray-500"
                      )}>
                        {hotspot.type === 'info' && <Info className="w-3 h-3" />}
                        {hotspot.type === 'question' && <HelpCircle className="w-3 h-3" />}
                        {hotspot.type === 'chart' && <BarChart3 className="w-3 h-3" />}
                        {hotspot.type === 'action' && <MousePointer className="w-3 h-3" />}
                        {hotspot.type === 'video' && <Play className="w-3 h-3" />}
                        {hotspot.type === 'link' && <BookOpen className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Animated pulse effect */}
                    {defaultAnimationConfig.enableAnimations && (
                      <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-25" />
                    )}

                    {/* Content popup */}
                    {renderHotspotContent(hotspot)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div>
                    <div className="font-medium">{hotspot.title}</div>
                    <div className="text-sm text-gray-600">{hotspot.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

          {/* Data visualizations overlay */}
          {visualizations.map((viz) => (
            <div
              key={viz.id}
              className="absolute border rounded bg-white/90 backdrop-blur-sm shadow-lg"
              style={{
                left: `${viz.position.x}%`,
                top: `${viz.position.y}%`,
                width: `${viz.position.width}%`,
                height: `${viz.position.height}%`
              }}
            >
              <div className="p-2">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {viz.title}
                </h4>
                {/* Simple bar chart visualization */}
                <div className="space-y-1">
                  {viz.data.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="w-12 truncate">{item.label}</span>
                      <div className="flex-1 bg-gray-200 rounded h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded transition-all duration-500"
                          style={{ 
                            width: `${(item.value / Math.max(...viz.data.map(d => d.value))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="w-8 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary statistics */}
      {showProgress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3 text-center">
            <Eye className="w-8 h-8 text-blue-500 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Megtekintett</div>
            <div className="text-lg font-bold">{progress.hotspotsViewed.size}</div>
          </Card>
          
          <Card className="p-3 text-center">
            <MousePointer className="w-8 h-8 text-green-500 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Rákattintott</div>
            <div className="text-lg font-bold">{progress.hotspotsClicked.size}</div>
          </Card>
          
          <Card className="p-3 text-center">
            <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Befejezett</div>
            <div className="text-lg font-bold">{completedHotspots.size}</div>
          </Card>
          
          <Card className="p-3 text-center">
            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Előrehaladás</div>
            <div className="text-lg font-bold">{Math.round(progress.completionPercentage)}%</div>
          </Card>
        </div>
      )}
    </div>
  )
}