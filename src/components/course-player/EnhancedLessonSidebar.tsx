'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Play, 
  Lock, 
  Clock, 
  BookOpen, 
  Star,
  ChevronRight,
  Zap,
  Target,
  Award,
  Users
} from 'lucide-react'

interface EnhancedLessonSidebarProps {
  modules: any[]
  currentLessonId: string
  courseId: string
  hasSubscription: boolean
}

export const EnhancedLessonSidebar: React.FC<EnhancedLessonSidebarProps> = ({
  modules,
  currentLessonId,
  courseId,
  hasSubscription
}) => {
  const router = useRouter()

  // Calculate lesson metadata
  const getLessonMetadata = (lesson: any) => {
    const isCompleted = lesson.progress?.completed
    const isActive = lesson.id === currentLessonId
    const isLocked = !hasSubscription && lesson.subscriptionTier === 'PREMIUM'
    const difficulty = lesson.difficulty || 'BEGINNER'
    const estimatedDuration = lesson.duration ? Math.ceil(lesson.duration / 60) : 8
    
    return {
      isCompleted,
      isActive,
      isLocked,
      difficulty,
      estimatedDuration
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-700 border-green-200'
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'ADVANCED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'Kezdő'
      case 'INTERMEDIATE': return 'Haladó'
      case 'ADVANCED': return 'Szakértő'
      default: return 'Alap'
    }
  }

  return (
    <div className="space-y-1">
      {modules.map((module: any, moduleIndex) => {
        const moduleLessons = module.lessons || []
        const completedInModule = moduleLessons.filter((l: any) => l.progress?.completed).length
        const totalInModule = moduleLessons.length
        const moduleProgress = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0
        
        return (
          <div key={module.id} className="border-b border-gray-100 last:border-b-0">
            {/* Module Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-secondary/10 flex items-center justify-center text-xs font-bold text-brand-secondary-hover">
                    {moduleIndex + 1}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{module.title}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {completedInModule}/{totalInModule}
                </Badge>
              </div>
              
              {/* Module Progress Bar */}
              <div className="space-y-1">
                <Progress value={moduleProgress} className="h-2 bg-gray-200" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{moduleProgress}% befejezve</span>
                  <span>~{totalInModule * 8} perc összes</span>
                </div>
              </div>
            </div>

            {/* Module Lessons */}
            <div className="space-y-1">
              {moduleLessons.map((lesson: any, lessonIndex: number) => {
                const metadata = getLessonMetadata(lesson)
                
                return (
                  <div
                    key={lesson.id}
                    className={`group relative transition-all duration-200 ${
                      metadata.isActive 
                        ? 'bg-gradient-to-r from-brand-secondary/5 to-indigo-50 border-r-4 border-brand-secondary' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (!metadata.isLocked) {
                          router.push(`/courses/${courseId}/player/${lesson.id}`)
                        }
                      }}
                      disabled={metadata.isLocked}
                      className="w-full text-left p-4 flex items-start gap-3 transition-all duration-200"
                    >
                      {/* Lesson Status Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {metadata.isLocked ? (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-gray-400" />
                          </div>
                        ) : metadata.isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        ) : metadata.isActive ? (
                          <div className="w-6 h-6 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                            <Play className="w-3 h-3 text-brand-secondary ml-0.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-brand-secondary/10 transition-colors">
                            <Play className="w-3 h-3 text-gray-400 group-hover:text-brand-secondary ml-0.5 transition-colors" />
                          </div>
                        )}
                      </div>

                      {/* Lesson Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Lesson Title */}
                        <div className={`font-medium text-sm leading-tight ${
                          metadata.isActive 
                            ? 'text-brand-secondary-hover' 
                            : metadata.isLocked 
                              ? 'text-gray-400'
                              : 'text-gray-900 group-hover:text-brand-secondary-hover'
                        } transition-colors`}>
                          {lessonIndex + 1}. {lesson.title}
                        </div>

                        {/* Lesson Metadata Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Duration */}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{metadata.estimatedDuration}p</span>
                          </div>

                          {/* Difficulty */}
                          <Badge 
                            variant="outline" 
                            className={`text-xs h-5 ${getDifficultyColor(metadata.difficulty)}`}
                          >
                            {getDifficultyLabel(metadata.difficulty)}
                          </Badge>

                          {/* Premium Badge */}
                          {lesson.subscriptionTier === 'PREMIUM' && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs h-5">
                              <Star className="w-2 h-2 mr-1" />
                              Prémium
                            </Badge>
                          )}

                          {/* Quiz Available */}
                          {lesson.quiz && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs h-5">
                              <Target className="w-2 h-2 mr-1" />
                              Kvíz
                            </Badge>
                          )}
                        </div>

                        {/* Lesson Progress (if started) */}
                        {lesson.progress && lesson.progress.watchPercentage > 0 && !metadata.isCompleted && (
                          <div className="space-y-1">
                            <Progress 
                              value={lesson.progress.watchPercentage} 
                              className="h-1.5 bg-gray-200" 
                            />
                            <div className="text-xs text-gray-500">
                              {Math.round(lesson.progress.watchPercentage)}% megtekintve
                            </div>
                          </div>
                        )}

                        {/* Lesson Description (truncated) */}
                        {lesson.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow indicator for active lesson */}
                      {metadata.isActive && (
                        <div className="flex-shrink-0 self-center">
                          <ChevronRight className="w-4 h-4 text-brand-secondary" />
                        </div>
                      )}
                    </button>

                    {/* Lesson Actions (appear on hover) */}
                    {!metadata.isLocked && !metadata.isActive && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {lesson.resources && lesson.resources.length > 0 && (
                            <Badge variant="outline" className="text-xs h-5 bg-white">
                              <BookOpen className="w-2 h-2 mr-1" />
                              Anyagok
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}