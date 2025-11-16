"use client"

import React, { useMemo } from 'react'
import { X, BookOpen } from 'lucide-react'
import {
  playerComponents,
  playerColors,
  playerTypography
} from '@/lib/course-player-design-system'
import { ProgressRing } from './ui/ProgressRing'
import { ModuleAccordion } from './ui/ModuleAccordion'
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

interface Course {
  id: string
  title: string
  instructor?: {
    name?: string
  }
  thumbnailUrl?: string
  modules: Module[]
}

interface CourseNavigationSidebarProps {
  course: Course
  currentLessonId: string
  onLessonClick: (lessonId: string) => void
  onClose?: () => void
  className?: string
}

export const CourseNavigationSidebar: React.FC<CourseNavigationSidebarProps> = ({
  course,
  currentLessonId,
  onLessonClick,
  onClose,
  className = ''
}) => {
  const { t, formatDuration } = useTranslation()

  // Calculate overall course progress
  const courseStats = useMemo(() => {
    const allLessons = course.modules.flatMap(m => m.lessons)
    const totalLessons = allLessons.length
    const completedLessons = allLessons.filter(
      l => l.progress?.completed || (l.progress?.watchPercentage ?? 0) >= 90
    ).length
    const totalDuration = allLessons.reduce(
      (acc, lesson) => acc + (parseInt(String(lesson.duration || 0)) || 0),
      0
    )
    const overallProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    return {
      totalLessons,
      completedLessons,
      totalDuration,
      overallProgress
    }
  }, [course.modules])

  // Find which module contains the current lesson (for auto-expand)
  const currentModuleIndex = useMemo(() => {
    return course.modules.findIndex(m =>
      m.lessons.some(l => l.id === currentLessonId)
    )
  }, [course.modules, currentLessonId])

  return (
    <aside
      className={`${playerComponents.sidebar} flex flex-col h-full ${className}`}
      style={{ width: '320px' }}
      aria-label={t('sidebar.courseNavigation')}
    >
      {/* Sidebar Header */}
      <div className={playerComponents.sidebarHeader}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} style={{ color: playerColors.primary }} />
              <span className={`${playerTypography.label} text-gray-600`}>
                {t('sidebar.course')}
              </span>
            </div>
            <h2 className={`${playerTypography.h3} text-gray-900 leading-tight`}>
              {course.title}
            </h2>
            {course.instructor?.name && (
              <p className={`${playerTypography.caption} mt-1`}>
                {t('sidebar.by')} {course.instructor.name}
              </p>
            )}
          </div>

          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={t('navigation.closeSidebar')}
            >
              <X size={20} style={{ color: playerColors.textSecondary }} />
            </button>
          )}
        </div>

        {/* Overall Progress */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className={playerTypography.bodySmall} style={{ color: playerColors.textSecondary }}>
                {t('sidebar.overallProgress')}
              </span>
              <span className={`${playerTypography.labelSmall} font-semibold`} style={{ color: playerColors.primary }}>
                {courseStats.overallProgress}%
              </span>
            </div>
            <div
              className={playerComponents.progressBar}
              role="progressbar"
              aria-valuenow={courseStats.overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={playerComponents.progressBarFill}
                style={{ width: `${courseStats.overallProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={playerTypography.bodySmall} style={{ color: playerColors.textSecondary }}>
                {t('sidebar.lessonsCompleted', { completed: courseStats.completedLessons, total: courseStats.totalLessons })}
              </span>
              {courseStats.totalDuration > 0 && (
                <span className={playerTypography.bodySmall} style={{ color: playerColors.textSecondary }}>
                  {formatDuration(courseStats.totalDuration)}
                </span>
              )}
            </div>
          </div>

          <div className="ml-4">
            <ProgressRing
              percentage={courseStats.overallProgress}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className={playerComponents.divider} />

      {/* Course Modules */}
      <div className="flex-1 overflow-y-auto">
        <div className={playerComponents.sidebarContent}>
          <h3
            className={`${playerTypography.overline} mb-3`}
            style={{ color: playerColors.textSecondary }}
          >
            {t('sidebar.courseContent')}
          </h3>

          <div className="space-y-2">
            {course.modules.map((module, index) => (
              <ModuleAccordion
                key={module.id}
                module={module}
                moduleIndex={index}
                currentLessonId={currentLessonId}
                onLessonClick={onLessonClick}
                defaultExpanded={index === currentModuleIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
