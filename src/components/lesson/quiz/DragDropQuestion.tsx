"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Drag & Drop Question Types
type DragDropType = 'match' | 'order' | 'categorize' | 'fill_gaps'

interface DragItem {
  id: string
  content: string
  category?: string
  order?: number
  correctDropZone?: string
}

interface DropZone {
  id: string
  label: string
  category?: string
  acceptsCategory?: string
  maxItems?: number
  order?: number
}

interface DragDropQuestionData {
  id: string
  type: DragDropType
  questionText: string
  instruction: string
  dragItems: DragItem[]
  dropZones: DropZone[]
  correctMapping: Record<string, string[]> // dropZoneId -> dragItemIds
  partialCredit: boolean
  showFeedback: boolean
  feedbackText?: string
  explanation?: string
}

interface Props {
  question: DragDropQuestionData
  onAnswer: (answer: Record<string, string[]>, isCorrect: boolean, score: number) => void
  showFeedback?: boolean
  disabled?: boolean
  className?: string
}

interface DragState {
  isDragging: boolean
  draggedItem: DragItem | null
  dragOffset: { x: number; y: number }
  dragPreview: { x: number; y: number } | null
}

export const DragDropQuestion: React.FC<Props> = ({
  question,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className
}) => {
  const [currentMapping, setCurrentMapping] = useState<Record<string, string[]>>({})
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOffset: { x: 0, y: 0 },
    dragPreview: null
  })
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const dragPreviewRef = useRef<HTMLDivElement>(null)

  // Initialize drop zones
  useEffect(() => {
    const initialMapping: Record<string, string[]> = {}
    question.dropZones.forEach(zone => {
      initialMapping[zone.id] = []
    })
    setCurrentMapping(initialMapping)
  }, [question])

  // Handle drag start (both mouse and touch)
  const handleDragStart = useCallback((item: DragItem, clientX: number, clientY: number) => {
    if (disabled) return

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOffset: {
        x: clientX - containerRect.left,
        y: clientY - containerRect.top
      },
      dragPreview: {
        x: clientX - containerRect.left,
        y: clientY - containerRect.top
      }
    })
  }, [disabled])

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    setDragState(prev => ({
      ...prev,
      dragPreview: {
        x: clientX - containerRect.left,
        y: clientY - containerRect.top
      }
    }))
  }, [dragState.isDragging])

  // Handle drag end
  const handleDragEnd = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging || !dragState.draggedItem || !containerRef.current) {
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOffset: { x: 0, y: 0 },
        dragPreview: null
      })
      return
    }

    // Find drop zone under cursor
    const dropZoneElements = containerRef.current.querySelectorAll('[data-drop-zone]')
    let targetDropZone: string | null = null

    dropZoneElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const containerRect = containerRef.current!.getBoundingClientRect()
      
      const relativeX = clientX - containerRect.left
      const relativeY = clientY - containerRect.top
      const elementX = rect.left - containerRect.left
      const elementY = rect.top - containerRect.top

      if (
        relativeX >= elementX &&
        relativeX <= elementX + rect.width &&
        relativeY >= elementY &&
        relativeY <= elementY + rect.height
      ) {
        targetDropZone = element.getAttribute('data-drop-zone')
      }
    })

    if (targetDropZone) {
      handleDrop(dragState.draggedItem, targetDropZone)
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOffset: { x: 0, y: 0 },
      dragPreview: null
    })
  }, [dragState])

  // Handle item drop
  const handleDrop = useCallback((item: DragItem, dropZoneId: string) => {
    if (disabled) return

    const dropZone = question.dropZones.find(z => z.id === dropZoneId)
    if (!dropZone) return

    // Check if drop zone accepts this item
    if (dropZone.acceptsCategory && item.category && dropZone.acceptsCategory !== item.category) {
      return
    }

    // Check if drop zone is full
    if (dropZone.maxItems && currentMapping[dropZoneId].length >= dropZone.maxItems) {
      return
    }

    setCurrentMapping(prev => {
      const newMapping = { ...prev }
      
      // Remove item from all zones first
      Object.keys(newMapping).forEach(zoneId => {
        newMapping[zoneId] = newMapping[zoneId].filter(id => id !== item.id)
      })
      
      // Add to target zone
      newMapping[dropZoneId] = [...newMapping[dropZoneId], item.id]
      
      return newMapping
    })
  }, [disabled, question.dropZones, currentMapping])

  // Remove item from drop zone
  const removeItem = useCallback((itemId: string, dropZoneId: string) => {
    if (disabled) return

    setCurrentMapping(prev => ({
      ...prev,
      [dropZoneId]: prev[dropZoneId].filter(id => id !== itemId)
    }))
  }, [disabled])

  // Reset all items
  const resetItems = useCallback(() => {
    if (disabled) return

    const initialMapping: Record<string, string[]> = {}
    question.dropZones.forEach(zone => {
      initialMapping[zone.id] = []
    })
    setCurrentMapping(initialMapping)
    setSubmitted(false)
    setScore(0)
    setIsCorrect(false)
    setFeedback('')
  }, [disabled, question.dropZones])

  // Calculate score and correctness
  const calculateScore = useCallback(() => {
    let correctPlacements = 0
    let totalPlacements = 0

    Object.entries(question.correctMapping).forEach(([dropZoneId, correctItems]) => {
      const userItems = currentMapping[dropZoneId] || []
      
      if (question.type === 'order') {
        // For ordering questions, check exact sequence
        const isExactMatch = correctItems.length === userItems.length &&
          correctItems.every((item, index) => userItems[index] === item)
        if (isExactMatch) {
          correctPlacements += correctItems.length
        }
        totalPlacements += correctItems.length
      } else {
        // For matching/categorizing, check individual items
        correctItems.forEach(correctItem => {
          totalPlacements++
          if (userItems.includes(correctItem)) {
            correctPlacements++
          }
        })
      }
    })

    const scorePercentage = totalPlacements > 0 ? (correctPlacements / totalPlacements) * 100 : 0
    const isFullyCorrect = scorePercentage === 100

    return { scorePercentage, isFullyCorrect }
  }, [question, currentMapping])

  // Submit answer
  const handleSubmit = useCallback(() => {
    const { scorePercentage, isFullyCorrect } = calculateScore()
    
    setScore(scorePercentage)
    setIsCorrect(isFullyCorrect)
    setSubmitted(true)

    // Generate feedback
    if (question.showFeedback) {
      if (isFullyCorrect) {
        setFeedback(question.feedbackText || 'Helyes! Minden elemet a megfelelő helyre helyezett.')
      } else if (question.partialCredit && scorePercentage > 0) {
        setFeedback(`Részben helyes! ${Math.round(scorePercentage)}% pontot ért el.`)
      } else {
        setFeedback('Nem helyes. Próbálja újra!')
      }
    }

    onAnswer(currentMapping, isFullyCorrect, scorePercentage)
  }, [calculateScore, question, currentMapping, onAnswer])

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent, item: DragItem) => {
    e.preventDefault()
    handleDragStart(item, e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault()
    if (dragState.isDragging) {
      handleDragMove(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragEnd(e.clientX, e.clientY)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent, item: DragItem) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleDragStart(item, touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (dragState.isDragging && e.touches[0]) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.changedTouches[0]) {
      handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    }
  }

  // Get available items (not placed in any drop zone)
  const availableItems = question.dragItems.filter(item => 
    !Object.values(currentMapping).some(items => items.includes(item.id))
  )

  // Get item by ID
  const getItemById = (id: string) => question.dragItems.find(item => item.id === id)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Question Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{question.questionText}</h3>
        {question.instruction && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            {question.instruction}
          </p>
        )}
      </div>

      {/* Drag and Drop Container */}
      <div
        ref={containerRef}
        className="relative select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Available Items Pool */}
        {availableItems.length > 0 && (
          <Card className="p-4 mb-6">
            <h4 className="text-sm font-medium mb-3">Húzza az elemeket a megfelelő helyre:</h4>
            <div className="flex flex-wrap gap-2">
              {availableItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    "px-3 py-2 bg-blue-100 text-blue-800 rounded-lg cursor-grab border-2 border-transparent",
                    "hover:bg-blue-200 transition-colors",
                    "active:cursor-grabbing active:scale-105",
                    dragState.draggedItem?.id === item.id && "opacity-50"
                  )}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  onTouchStart={(e) => handleTouchStart(e, item)}
                >
                  {item.content}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Drop Zones */}
        <div className="grid gap-4">
          {question.dropZones.map(zone => {
            const zoneItems = currentMapping[zone.id] || []
            const isFull = zone.maxItems && zoneItems.length >= zone.maxItems
            
            return (
              <Card
                key={zone.id}
                data-drop-zone={zone.id}
                className={cn(
                  "p-4 min-h-[80px] border-2 border-dashed transition-colors",
                  zoneItems.length > 0 ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50",
                  dragState.isDragging && !isFull && "border-blue-400 bg-blue-50",
                  isFull && "border-orange-300 bg-orange-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">{zone.label}</h4>
                  {zone.maxItems && (
                    <Badge variant="outline" className="text-xs">
                      {zoneItems.length}/{zone.maxItems}
                    </Badge>
                  )}
                </div>
                
                <div className="min-h-[40px] flex flex-wrap gap-2">
                  {zoneItems.map((itemId, index) => {
                    const item = getItemById(itemId)
                    if (!item) return null
                    
                    return (
                      <div
                        key={itemId}
                        className={cn(
                          "px-3 py-2 bg-green-100 text-green-800 rounded-lg border",
                          "flex items-center gap-2 group",
                          submitted && question.correctMapping[zone.id]?.includes(itemId) 
                            ? "border-green-400" 
                            : submitted 
                            ? "border-red-400 bg-red-100 text-red-800" 
                            : "border-green-300"
                        )}
                      >
                        <span>{item.content}</span>
                        {!disabled && !submitted && (
                          <button
                            onClick={() => removeItem(itemId, zone.id)}
                            className="ml-1 text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        )}
                        {submitted && (
                          question.correctMapping[zone.id]?.includes(itemId) 
                            ? <CheckCircle className="w-4 h-4 text-green-600" />
                            : <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    )
                  })}
                  
                  {zoneItems.length === 0 && (
                    <div className="text-gray-400 text-sm italic flex items-center justify-center w-full h-10">
                      Húzza ide az elemeket
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Drag Preview */}
        {dragState.isDragging && dragState.draggedItem && dragState.dragPreview && (
          <div
            ref={dragPreviewRef}
            className="absolute pointer-events-none z-50 px-3 py-2 bg-blue-200 text-blue-800 rounded-lg border-2 border-blue-400 shadow-lg transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: dragState.dragPreview.x,
              top: dragState.dragPreview.y
            }}
          >
            {dragState.draggedItem.content}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {!submitted && (
            <Button
              onClick={handleSubmit}
              disabled={disabled || Object.values(currentMapping).every(items => items.length === 0)}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Ellenőrzés
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={resetItems}
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

      {/* Feedback */}
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
    </div>
  )
}