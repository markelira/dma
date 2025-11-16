"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import {
  playerComponents,
  playerColors,
  calculateModuleProgress
} from '@/lib/course-player-design-system'
import { ProgressRingCompact } from './ProgressRing'
import { LessonIcon } from './LessonIcon'
import { CompletionBadge } from './CompletionBadge'
import { useTranslation } from '@/hooks/useTranslation'

interface Lesson {
  id: string
  title: string
  type: string
  duration?: number
  progress?: {
    completed?: boolean
    watchPercentage?: number
  }
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  description?: string
}

interface ModuleAccordionProps {
  module: Module
  moduleIndex: number
  currentLessonId: string
  onLessonClick: (lessonId: string) => void
  defaultExpanded?: boolean
  className?: string
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({
  module,
  moduleIndex,
  currentLessonId,
  onLessonClick,
  defaultExpanded = false,
  className = ''
}) => {
  const { t, formatDuration } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const moduleProgress = calculateModuleProgress(module.lessons)
  const hasCurrentLesson = module.lessons.some(l => l.id === currentLessonId)

  // Calculate total module duration
  const totalDuration = module.lessons.reduce((acc, lesson) => {
    return acc + (parseInt(String(lesson.duration || 0)) || 0)
  }, 0)

  const completedLessons = module.lessons.filter(
    l => l.progress?.completed || (l.progress?.watchPercentage ?? 0) >= 90
  ).length

  return (
    <div className={`${className}`}>
      {/* Module Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-left ${playerComponents.moduleHeader} group`}
        aria-expanded={isExpanded}
        aria-controls={`module-${module.id}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown size={20} style={{ color: playerColors.textSecondary }} />
            ) : (
              <ChevronRight size={20} style={{ color: playerColors.textSecondary }} />
            )}
          </div>

          {/* Module Number Badge */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
            style={{
              backgroundColor: hasCurrentLesson
                ? playerColors.primary
                : moduleProgress === 100
                ? playerColors.success
                : playerColors.neutral,
              color: hasCurrentLesson || moduleProgress === 100
                ? '#FFFFFF'
                : playerColors.textSecondary
            }}
          >
            {moduleIndex + 1}
          </div>

          {/* Module Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0066CC] transition-colors">
              {module.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              <span>
                {t('progress.lessonCount', { completed: completedLessons, total: module.lessons.length })}
              </span>
              {totalDuration > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDuration(totalDuration)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {moduleProgress > 0 && (
            <div className="flex-shrink-0">
              <ProgressRingCompact percentage={moduleProgress} />
            </div>
          )}
        </div>
      </button>

      {/* Module Lessons (Expanded State) */}
      {isExpanded && (
        <div
          id={`module-${module.id}`}
          className="ml-2 pl-6 border-l-2"
          style={{ borderColor: playerColors.neutralDark }}
        >
          <div className="py-2 space-y-1">
            {module.lessons.map((lesson, lessonIndex) => {
              const isCurrentLesson = lesson.id === currentLessonId
              const isCompleted = lesson.progress?.completed || (lesson.progress?.watchPercentage ?? 0) >= 90

              return (
                <button
                  key={lesson.id}
                  onClick={() => onLessonClick(lesson.id)}
                  className={`w-full text-left ${playerComponents.lessonItem} ${
                    isCurrentLesson
                      ? playerComponents.lessonItemActive
                      : isCompleted
                      ? playerComponents.lessonItemCompleted
                      : playerComponents.lessonItemHover
                  }`}
                  aria-current={isCurrentLesson ? 'page' : undefined}
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Completion/Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <CompletionBadge
                        isCompleted={isCompleted}
                        isActive={isCurrentLesson}
                        size={18}
                      />
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900 leading-tight">
                          {lesson.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Lesson Type Icon */}
                        <LessonIcon type={lesson.type} size={14} />

                        {/* Duration */}
                        {lesson.duration && (
                          <span className="text-xs text-gray-600">
                            {formatDuration(parseInt(String(lesson.duration)))}
                          </span>
                        )}

                        {/* Progress Percentage */}
                        {lesson.progress && lesson.progress.watchPercentage && lesson.progress.watchPercentage > 0 && lesson.progress.watchPercentage < 90 && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs" style={{ color: playerColors.primary }}>
                              {Math.round(lesson.progress.watchPercentage)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for smaller spaces
export const ModuleAccordionCompact: React.FC<ModuleAccordionProps> = (props) => {
  return <ModuleAccordion {...props} className="text-xs" />
}
