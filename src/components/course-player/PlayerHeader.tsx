"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Settings, X } from 'lucide-react'
import {
  playerComponents,
  playerColors,
  playerTypography
} from '@/lib/course-player-design-system'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'

interface PlayerHeaderProps {
  courseTitle: string
  courseId: string
  moduleTitle?: string
  lessonTitle: string
  overallProgress: number
  onSettingsClick?: () => void
  onClose?: () => void
  className?: string
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  courseTitle,
  courseId,
  moduleTitle,
  lessonTitle,
  overallProgress,
  onSettingsClick,
  onClose,
  className = ''
}) => {
  const router = useRouter()
  const { t } = useTranslation()

  const handleBackToCourse = () => {
    router.push(`/courses/${courseId}`)
  }

  return (
    <header
      className={`bg-white border-b border-gray-200 ${className}`}
      role="banner"
    >
      <div className="px-4 md:px-6 py-3">
        {/* Top Row: Breadcrumb and Actions */}
        <div className="flex items-center justify-between mb-3">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCourse}
              className="flex-shrink-0"
            >
              <ChevronLeft size={16} className="mr-1" />
              <span className="hidden sm:inline">{t('navigation.backToCourse')}</span>
            </Button>

            <ChevronRight
              size={16}
              className="flex-shrink-0"
              style={{ color: playerColors.textTertiary }}
            />

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className={`${playerTypography.body} truncate`}
                style={{ color: playerColors.textSecondary }}
                title={courseTitle}
              >
                {courseTitle}
              </span>

              {moduleTitle && (
                <>
                  <ChevronRight
                    size={14}
                    className="flex-shrink-0 hidden md:block"
                    style={{ color: playerColors.textTertiary }}
                  />
                  <span
                    className={`${playerTypography.bodySmall} truncate hidden md:block`}
                    style={{ color: playerColors.textTertiary }}
                    title={moduleTitle}
                  >
                    {moduleTitle}
                  </span>
                </>
              )}
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                aria-label={t('header.settings')}
              >
                <Settings size={18} />
              </Button>
            )}

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label={t('header.closePlayer')}
              >
                <X size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Current Lesson Title */}
        <h1
          className={`${playerTypography.h3} text-gray-900 truncate mb-3`}
          title={lessonTitle}
        >
          {lessonTitle}
        </h1>

        {/* Overall Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div
              className={playerComponents.progressBar}
              role="progressbar"
              aria-label={t('header.overallProgress')}
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={playerComponents.progressBarFill}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <span
            className={`${playerTypography.labelSmall} font-semibold flex-shrink-0`}
            style={{ color: playerColors.primary }}
          >
            {t('header.complete', { progress: overallProgress })}
          </span>
        </div>
      </div>
    </header>
  )
}

// Compact version for mobile
export const PlayerHeaderCompact: React.FC<PlayerHeaderProps> = (props) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {}}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className={`${playerTypography.bodySmall} truncate flex-1 text-center px-2`}>
          {props.lessonTitle}
        </span>
        <Button variant="ghost" size="sm">
          <Settings size={16} />
        </Button>
      </div>
      <div
        className={playerComponents.progressBar}
        role="progressbar"
        aria-valuenow={props.overallProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={playerComponents.progressBarFill}
          style={{ width: `${props.overallProgress}%` }}
        />
      </div>
    </header>
  )
}
