"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, Info, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Hotspot {
  id: string
  x: number // Percentage from left
  y: number // Percentage from top
  width: number // Percentage width
  height: number // Percentage height
  shape: 'circle' | 'rectangle' | 'polygon'
  label: string
  isCorrect: boolean
  feedback?: string
  points: number
  polygon?: Array<{ x: number; y: number }> // For polygon shapes
}

interface HotspotQuestionData {
  id: string
  questionText: string
  instruction: string
  imageUrl: string
  imageAlt: string
  hotspots: Hotspot[]
  allowMultipleSelection: boolean
  requireAllCorrect: boolean
  showFeedbackImmediately: boolean
  maxAttempts?: number
  showHotspotsOnHover: boolean
  feedbackText?: string
  explanation?: string
}

interface Props {
  question: HotspotQuestionData
  onAnswer: (selectedHotspots: string[], isCorrect: boolean, score: number) => void
  showFeedback?: boolean
  disabled?: boolean
  className?: string
}

interface ClickEvent {
  x: number
  y: number
  hotspotId?: string
  timestamp: number
}

export const HotspotQuestion: React.FC<Props> = ({
  question,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className
}) => {
  const [selectedHotspots, setSelectedHotspots] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  const [attempts, setAttempts] = useState(0)
  const [clickHistory, setClickHistory] = useState<ClickEvent[]>([])
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageLoaded(true)
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      })
    }
  }, [])

  // Check if point is inside hotspot
  const isPointInHotspot = useCallback((x: number, y: number, hotspot: Hotspot, containerRect: DOMRect): boolean => {
    const relativeX = (x - containerRect.left) / containerRect.width * 100
    const relativeY = (y - containerRect.top) / containerRect.height * 100

    switch (hotspot.shape) {
      case 'rectangle':
        return (
          relativeX >= hotspot.x &&
          relativeX <= hotspot.x + hotspot.width &&
          relativeY >= hotspot.y &&
          relativeY <= hotspot.y + hotspot.height
        )
      
      case 'circle':
        const centerX = hotspot.x + hotspot.width / 2
        const centerY = hotspot.y + hotspot.height / 2
        const radiusX = hotspot.width / 2
        const radiusY = hotspot.height / 2
        
        const normalizedX = (relativeX - centerX) / radiusX
        const normalizedY = (relativeY - centerY) / radiusY
        
        return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1
      
      case 'polygon':
        if (!hotspot.polygon || hotspot.polygon.length < 3) return false
        
        // Ray casting algorithm for point-in-polygon
        let inside = false
        const polygon = hotspot.polygon
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x
          const yi = polygon[i].y
          const xj = polygon[j].x
          const yj = polygon[j].y
          
          if (((yi > relativeY) !== (yj > relativeY)) &&
              (relativeX < (xj - xi) * (relativeY - yi) / (yj - yi) + xi)) {
            inside = !inside
          }
        }
        
        return inside
      
      default:
        return false
    }
  }, [])

  // Handle click on image
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (disabled || !imageLoaded || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX
    const clickY = e.clientY

    // Find which hotspot was clicked
    let clickedHotspot: Hotspot | null = null
    for (const hotspot of question.hotspots) {
      if (isPointInHotspot(clickX, clickY, hotspot, containerRect)) {
        clickedHotspot = hotspot
        break
      }
    }

    // Record click
    const clickEvent: ClickEvent = {
      x: clickX - containerRect.left,
      y: clickY - containerRect.top,
      hotspotId: clickedHotspot?.id,
      timestamp: Date.now()
    }
    setClickHistory(prev => [...prev, clickEvent])

    if (clickedHotspot) {
      if (question.allowMultipleSelection) {
        // Toggle selection
        setSelectedHotspots(prev => {
          const newSet = new Set(prev)
          if (newSet.has(clickedHotspot.id)) {
            newSet.delete(clickedHotspot.id)
          } else {
            newSet.add(clickedHotspot.id)
          }
          return newSet
        })
      } else {
        // Single selection
        setSelectedHotspots(new Set([clickedHotspot.id]))
        
        // Auto-submit for single selection
        if (!question.allowMultipleSelection) {
          setTimeout(() => {
            handleSubmit([clickedHotspot.id])
          }, 100)
        }
      }

      // Show immediate feedback if enabled
      if (question.showFeedbackImmediately && !submitted) {
        if (clickedHotspot.feedback) {
          setFeedback(clickedHotspot.feedback)
        }
      }
    }
  }, [disabled, imageLoaded, question, isPointInHotspot, submitted])

  // Handle mouse move for hover effects
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!question.showHotspotsOnHover || !imageLoaded || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX
    const mouseY = e.clientY

    // Find hovered hotspot
    let hoveredId: string | null = null
    for (const hotspot of question.hotspots) {
      if (isPointInHotspot(mouseX, mouseY, hotspot, containerRect)) {
        hoveredId = hotspot.id
        break
      }
    }

    setHoveredHotspot(hoveredId)
  }, [question.showHotspotsOnHover, imageLoaded, isPointInHotspot])

  // Calculate score
  const calculateScore = useCallback((selectedIds: string[]) => {
    const selectedSet = new Set(selectedIds)
    const correctHotspots = question.hotspots.filter(h => h.isCorrect)
    const incorrectHotspots = question.hotspots.filter(h => !h.isCorrect)

    let correctSelections = 0
    let incorrectSelections = 0
    let totalPoints = 0
    let earnedPoints = 0

    // Calculate points for correct selections
    correctHotspots.forEach(hotspot => {
      totalPoints += hotspot.points
      if (selectedSet.has(hotspot.id)) {
        correctSelections++
        earnedPoints += hotspot.points
      }
    })

    // Penalize incorrect selections
    incorrectHotspots.forEach(hotspot => {
      if (selectedSet.has(hotspot.id)) {
        incorrectSelections++
        earnedPoints = Math.max(0, earnedPoints - hotspot.points) // Don't go below 0
      }
    })

    let isFullyCorrect = false
    if (question.requireAllCorrect) {
      // Must select all correct hotspots and no incorrect ones
      isFullyCorrect = correctSelections === correctHotspots.length && incorrectSelections === 0
    } else {
      // At least one correct selection and no incorrect ones
      isFullyCorrect = correctSelections > 0 && incorrectSelections === 0
    }

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

    return { scorePercentage, isFullyCorrect, correctSelections, incorrectSelections }
  }, [question])

  // Submit answer
  const handleSubmit = useCallback((selectedIds?: string[]) => {
    const ids = selectedIds || Array.from(selectedHotspots)
    const { scorePercentage, isFullyCorrect } = calculateScore(ids)
    
    setScore(scorePercentage)
    setIsCorrect(isFullyCorrect)
    setSubmitted(true)
    setAttempts(prev => prev + 1)

    // Generate feedback
    if (question.feedbackText) {
      setFeedback(question.feedbackText)
    } else {
      if (isFullyCorrect) {
        setFeedback('Kiváló! Minden helyes területet kiválasztott.')
      } else {
        setFeedback('Próbálja újra! Ellenőrizze a kiválasztott területeket.')
      }
    }

    onAnswer(ids, isFullyCorrect, scorePercentage)
  }, [selectedHotspots, calculateScore, question, onAnswer])

  // Reset selection
  const resetSelection = useCallback(() => {
    if (disabled) return

    setSelectedHotspots(new Set())
    setSubmitted(false)
    setScore(0)
    setIsCorrect(false)
    setFeedback('')
    setClickHistory([])
    setHoveredHotspot(null)
  }, [disabled])

  // Get hotspot style
  const getHotspotStyle = (hotspot: Hotspot) => {
    const isSelected = selectedHotspots.has(hotspot.id)
    const isHovered = hoveredHotspot === hotspot.id
    
    let baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${hotspot.x}%`,
      top: `${hotspot.y}%`,
      width: `${hotspot.width}%`,
      height: `${hotspot.height}%`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      pointerEvents: disabled ? 'none' : 'auto'
    }

    if (hotspot.shape === 'circle') {
      baseStyle.borderRadius = '50%'
    }

    // Visual feedback
    if (submitted) {
      if (hotspot.isCorrect && isSelected) {
        baseStyle.backgroundColor = 'rgba(34, 197, 94, 0.3)'
        baseStyle.border = '2px solid #22c55e'
      } else if (!hotspot.isCorrect && isSelected) {
        baseStyle.backgroundColor = 'rgba(239, 68, 68, 0.3)'
        baseStyle.border = '2px solid #ef4444'
      } else if (hotspot.isCorrect && !isSelected) {
        baseStyle.backgroundColor = 'rgba(34, 197, 94, 0.1)'
        baseStyle.border = '2px dashed #22c55e'
      }
    } else {
      if (isSelected) {
        baseStyle.backgroundColor = 'rgba(59, 130, 246, 0.3)'
        baseStyle.border = '2px solid #3b82f6'
      } else if (isHovered && question.showHotspotsOnHover) {
        baseStyle.backgroundColor = 'rgba(59, 130, 246, 0.1)'
        baseStyle.border = '2px dashed #3b82f6'
      }
    }

    return baseStyle
  }

  // Render polygon hotspot
  const renderPolygonHotspot = (hotspot: Hotspot) => {
    if (!hotspot.polygon) return null

    const points = hotspot.polygon
      .map(point => `${point.x}%,${point.y}%`)
      .join(' ')

    return (
      <svg
        key={hotspot.id}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <polygon
          points={points}
          fill={selectedHotspots.has(hotspot.id) ? "rgba(59, 130, 246, 0.3)" : "transparent"}
          stroke={selectedHotspots.has(hotspot.id) ? "#3b82f6" : "transparent"}
          strokeWidth="2"
          className="pointer-events-auto cursor-pointer"
          onClick={() => {
            if (!disabled) {
              if (question.allowMultipleSelection) {
                setSelectedHotspots(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(hotspot.id)) {
                    newSet.delete(hotspot.id)
                  } else {
                    newSet.add(hotspot.id)
                  }
                  return newSet
                })
              } else {
                setSelectedHotspots(new Set([hotspot.id]))
                setTimeout(() => handleSubmit([hotspot.id]), 100)
              }
            }
          }}
        />
      </svg>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Question Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{question.questionText}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {question.instruction}
          </span>
          {question.maxAttempts && (
            <Badge variant="outline">
              Próbálkozás: {attempts}/{question.maxAttempts}
            </Badge>
          )}
        </div>
      </div>

      {/* Interactive Image */}
      <Card className="p-0 overflow-hidden">
        <div
          ref={containerRef}
          className="relative inline-block w-full"
          style={{ maxWidth: '100%' }}
        >
          <img
            ref={imageRef}
            src={question.imageUrl}
            alt={question.imageAlt}
            className="w-full h-auto block cursor-crosshair"
            onLoad={handleImageLoad}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredHotspot(null)}
            draggable={false}
          />
          
          {/* Hotspot Overlays */}
          {imageLoaded && (
            <>
              {question.hotspots
                .filter(h => h.shape !== 'polygon')
                .map(hotspot => (
                  <div
                    key={hotspot.id}
                    style={getHotspotStyle(hotspot)}
                    title={question.showHotspotsOnHover ? hotspot.label : undefined}
                  />
                ))}
              
              {question.hotspots
                .filter(h => h.shape === 'polygon')
                .map(hotspot => renderPolygonHotspot(hotspot))}
            </>
          )}

          {/* Click Feedback */}
          {clickHistory.map((click, index) => (
            <div
              key={index}
              className="absolute pointer-events-none animate-ping"
              style={{
                left: click.x - 4,
                top: click.y - 4,
                width: 8,
                height: 8,
                backgroundColor: click.hotspotId ? '#3b82f6' : '#ef4444',
                borderRadius: '50%',
                zIndex: 10
              }}
            />
          ))}

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-gray-500">Kép betöltése...</div>
            </div>
          )}
        </div>
      </Card>

      {/* Selection Summary */}
      {selectedHotspots.size > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Kiválasztott területek:</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedHotspots).map(hotspotId => {
              const hotspot = question.hotspots.find(h => h.id === hotspotId)
              if (!hotspot) return null
              
              return (
                <Badge
                  key={hotspotId}
                  variant={submitted ? (hotspot.isCorrect ? "default" : "destructive") : "secondary"}
                  className="flex items-center gap-1"
                >
                  {hotspot.label}
                  {submitted && (
                    hotspot.isCorrect ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )
                  )}
                  {!disabled && !submitted && (
                    <button
                      onClick={() => {
                        setSelectedHotspots(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(hotspotId)
                          return newSet
                        })
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              )
            })}
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {!submitted && question.allowMultipleSelection && (
            <Button
              onClick={() => handleSubmit()}
              disabled={disabled || selectedHotspots.size === 0}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Ellenőrzés
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={resetSelection}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Újrakezdés
          </Button>
        </div>

        {submitted && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={cn(
              "font-medium",
              isCorrect ? "text-green-600" : "text-red-600"
            )}>
              {Math.round(score)}%
            </span>
          </div>
        )}
      </div>

      {/* Immediate Feedback */}
      {question.showFeedbackImmediately && feedback && !submitted && (
        <Card className="p-4 bg-brand-secondary/5 border-brand-secondary/20">
          <div className="flex items-center gap-2 text-brand-secondary-hover">
            <Zap className="w-4 h-4" />
            <span className="text-sm">{feedback}</span>
          </div>
        </Card>
      )}

      {/* Final Feedback */}
      {submitted && showFeedback && feedback && (
        <Card className={cn(
          "p-4",
          isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          <p className={cn(
            "text-sm",
            isCorrect ? "text-green-800" : "text-red-800"
          )}>
            {feedback}
          </p>
          {question.explanation && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Magyarázat:</strong> {question.explanation}
            </p>
          )}
        </Card>
      )}

      {/* Hotspot Legend */}
      {submitted && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Helyes területek:</h4>
          <div className="space-y-2">
            {question.hotspots
              .filter(h => h.isCorrect)
              .map(hotspot => (
                <div key={hotspot.id} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded" />
                  <span>{hotspot.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {hotspot.points} pont
                  </Badge>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}