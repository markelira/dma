"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  RotateCcw, 
  Clock,
  BookOpen,
  FileText,
  Award,
  Volume2,
  X,
  ArrowRight
} from 'lucide-react'

interface ResumePoint {
  type: 'video' | 'text' | 'quiz' | 'audio' | 'pdf'
  position: number // seconds for video/audio, percentage for text/pdf, question number for quiz
  timestamp: Date
  context?: string // additional context like chapter name, section, etc.
  metadata?: {
    totalDuration?: number
    totalQuestions?: number
    chapterTitle?: string
    sectionTitle?: string
  }
}

interface ResumePromptProps {
  lessonTitle: string
  lessonType: 'VIDEO' | 'TEXT' | 'QUIZ' | 'READING' | 'PDF' | 'AUDIO'
  resumePoint: ResumePoint
  progress: number // 0-100
  onResume: (resumeFromPoint: boolean) => void
  onStartFromBeginning: () => void
  onDismiss?: () => void
  className?: string
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'VIDEO': return Play
    case 'AUDIO': return Volume2
    case 'TEXT': 
    case 'READING': return BookOpen
    case 'PDF': return FileText
    case 'QUIZ': return Award
    default: return FileText
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'VIDEO': return 'text-red-600 bg-red-50 border-red-200'
    case 'AUDIO': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
    case 'TEXT': 
    case 'READING': return 'text-green-600 bg-green-50 border-green-200'
    case 'PDF': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'QUIZ': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const formatResumePosition = (resumePoint: ResumePoint): string => {
  switch (resumePoint.type) {
    case 'video':
    case 'audio':
      const minutes = Math.floor(resumePoint.position / 60)
      const seconds = resumePoint.position % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    case 'text':
    case 'pdf':
      return `${Math.round(resumePoint.position)}%`
    
    case 'quiz':
      const totalQuestions = resumePoint.metadata?.totalQuestions || 1
      return `${resumePoint.position}/${totalQuestions} kérdés`
    
    default:
      return `${Math.round(resumePoint.position)}%`
  }
}

const getResumeDescription = (resumePoint: ResumePoint, lessonType: string): string => {
  switch (resumePoint.type) {
    case 'video':
      return resumePoint.context 
        ? `Folytatás innen: ${resumePoint.context}`
        : 'Folytatás az utoljára megtekintett pozícióról'
    
    case 'audio':
      return resumePoint.context 
        ? `Folytatás: ${resumePoint.context}`
        : 'Folytatás az utoljára hallgatott pozícióról'
    
    case 'text':
    case 'pdf':
      return resumePoint.context 
        ? `Folytatás: ${resumePoint.context}`
        : 'Folytatás az utoljára olvasott pozícióról'
    
    case 'quiz':
      return `Folytatás a ${resumePoint.position}. kérdéstől`
    
    default:
      return 'Folytatás az utoljára mentett pozícióról'
  }
}

const getTimeSinceLastAccess = (timestamp: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 60) {
    return `${diffMinutes} perce`
  } else if (diffHours < 24) {
    return `${diffHours} órája`
  } else if (diffDays < 7) {
    return `${diffDays} napja`
  } else {
    return timestamp.toLocaleDateString('hu-HU')
  }
}

export const ResumePrompt: React.FC<ResumePromptProps> = ({
  lessonTitle,
  lessonType,
  resumePoint,
  progress,
  onResume,
  onStartFromBeginning,
  onDismiss,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const TypeIcon = getTypeIcon(lessonType)
  const typeColor = getTypeColor(lessonType)
  
  const handleResume = () => {
    setIsAnimating(true)
    setTimeout(() => onResume(true), 300)
  }

  const handleStartFromBeginning = () => {
    setIsAnimating(true)
    setTimeout(() => onStartFromBeginning(), 300)
  }

  return (
    <Card className={`border-2 shadow-lg transition-all duration-300 ${typeColor} ${
      isAnimating ? 'scale-95 opacity-75' : 'scale-100 opacity-100'
    } ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${typeColor.replace('border-', 'bg-').replace('-200', '-100')}`}>
              <TypeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Folytatás ahol abbahagyta</h3>
              <p className="text-sm opacity-80">{lessonTitle}</p>
            </div>
          </div>
          
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Haladás</span>
            <Badge variant="secondary" className="font-bold">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Resume Point Info */}
        <div className="bg-white/50 rounded-lg p-4 mb-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 opacity-60" />
              <span className="text-sm font-medium">Utolsó pozíció</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {formatResumePosition(resumePoint)}
            </Badge>
          </div>
          
          <p className="text-sm opacity-80 mb-2">
            {getResumeDescription(resumePoint, lessonType)}
          </p>
          
          <div className="text-xs opacity-60">
            Utoljára megtekintve: {getTimeSinceLastAccess(resumePoint.timestamp)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleResume}
            className="flex-1"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Folytatás
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleStartFromBeginning}
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Újrakezdés
          </Button>
        </div>

        {/* Additional Context */}
        {resumePoint.context && (
          <div className="mt-3 p-2 bg-white/30 rounded text-xs opacity-80">
            <strong>Kontextus:</strong> {resumePoint.context}
          </div>
        )}
      </div>
    </Card>
  )
}