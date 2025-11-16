"use client"

import React from 'react'
import {
  CheckCircle,
  Clock,
  Download,
  Flag,
  Target,
  TrendingUp,
  PartyPopper
} from 'lucide-react'
import {
  playerComponents,
  playerColors,
  playerTypography
} from '@/lib/course-player-design-system'
import { ProgressRing } from './ui/ProgressRing'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'

interface Lesson {
  id: string
  title: string
  type: string
  duration?: number
  progress?: {
    completed?: boolean
    watchPercentage?: number
    timeSpent?: number
  }
}

interface LearningCompanionPanelProps {
  lesson: Lesson
  courseProgress: number
  totalLessons: number
  completedLessons: number
  learningOutcomes?: string[]
  onMarkComplete?: () => void
  onDownloadResources?: () => void
  onReportIssue?: () => void
  className?: string
}

export const LearningCompanionPanel: React.FC<LearningCompanionPanelProps> = ({
  lesson,
  courseProgress,
  totalLessons,
  completedLessons,
  learningOutcomes = [],
  onMarkComplete,
  onDownloadResources,
  onReportIssue,
  className = ''
}) => {
  const { t, formatDuration } = useTranslation()
  const lessonProgress = lesson.progress?.watchPercentage || 0
  const isCompleted = lesson.progress?.completed || lessonProgress >= 90
  const timeSpent = lesson.progress?.timeSpent || 0
  const duration = parseInt(String(lesson.duration || 0))
  const timeRemaining = duration > timeSpent ? duration - timeSpent : 0

  return (
    <aside
      className={`bg-gray-50 border-l border-gray-200 overflow-y-auto ${className}`}
      style={{ width: '280px' }}
      aria-label={t('companion.aria')}
    >
      <div className="p-4 space-y-4">
        {/* Lesson Progress Card */}
        <div className={playerComponents.card}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={playerTypography.h4}>{t('companion.lessonProgress')}</h3>
              <ProgressRing percentage={lessonProgress} size="sm" />
            </div>

            <div className="space-y-3">
              {/* Time Watched */}
              {duration > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: playerColors.textSecondary }}>
                    {t('companion.timeWatched')}
                  </span>
                  <span className="font-medium" style={{ color: playerColors.textPrimary }}>
                    {formatDuration(timeSpent)} / {formatDuration(duration)}
                  </span>
                </div>
              )}

              {/* Completion Status */}
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: playerColors.textSecondary }}>
                  {t('companion.status')}
                </span>
                <span
                  className="font-medium"
                  style={{
                    color: isCompleted
                      ? playerColors.success
                      : playerColors.primary
                  }}
                >
                  {isCompleted ? t('companion.completed') : t('companion.inProgress')}
                </span>
              </div>

              {/* Time Remaining */}
              {!isCompleted && timeRemaining > 0 && (
                <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ backgroundColor: playerColors.primaryLight }}>
                  <Clock size={14} style={{ color: playerColors.primary }} />
                  <span style={{ color: playerColors.primary }}>
                    {t('companion.remaining', { duration: formatDuration(timeRemaining) })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Outcomes Checklist */}
        {learningOutcomes.length > 0 && (
          <div className={playerComponents.card}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} style={{ color: playerColors.primary }} />
                <h3 className={playerTypography.h4}>{t('companion.learningOutcomes')}</h3>
              </div>
              <ul className="space-y-2">
                {learningOutcomes.map((outcome, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <CheckCircle
                      size={16}
                      className="flex-shrink-0 mt-0.5"
                      style={{
                        color: isCompleted
                          ? playerColors.success
                          : playerColors.textTertiary
                      }}
                    />
                    <span style={{ color: playerColors.textSecondary }}>
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={playerComponents.card}>
          <div className="p-4 space-y-2">
            <h3 className={`${playerTypography.h4} mb-3`}>{t('companion.quickActions')}</h3>

            {/* Mark as Complete */}
            {!isCompleted && onMarkComplete && (
              <Button
                onClick={onMarkComplete}
                className="w-full justify-start"
                variant="default"
              >
                <CheckCircle size={16} className="mr-2" />
                {t('companion.markComplete')}
              </Button>
            )}

            {/* Download Resources */}
            {onDownloadResources && (
              <Button
                onClick={onDownloadResources}
                className="w-full justify-start"
                variant="outline"
              >
                <Download size={16} className="mr-2" />
                {t('companion.downloadResources')}
              </Button>
            )}

            {/* Report Issue */}
            {onReportIssue && (
              <Button
                onClick={onReportIssue}
                className="w-full justify-start"
                variant="ghost"
              >
                <Flag size={16} className="mr-2" />
                {t('companion.reportIssue')}
              </Button>
            )}
          </div>
        </div>

        {/* Course Progress Summary */}
        <div className={playerComponents.card}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} style={{ color: playerColors.success }} />
              <h3 className={playerTypography.h4}>{t('companion.courseProgress')}</h3>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div
                  className={playerComponents.progressBar}
                  role="progressbar"
                  aria-valuenow={courseProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={playerComponents.progressBarFill}
                    style={{
                      width: `${courseProgress}%`,
                      backgroundColor: playerColors.success
                    }}
                  />
                </div>
              </div>
              <span className="ml-3 text-sm font-semibold" style={{ color: playerColors.success }}>
                {courseProgress}%
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: playerColors.textSecondary }}>
                  {t('companion.completedLessons')}
                </span>
                <span className="font-medium" style={{ color: playerColors.textPrimary }}>
                  {completedLessons} / {totalLessons}
                </span>
              </div>

              {courseProgress > 0 && courseProgress < 100 && (
                <div className="flex items-center justify-between">
                  <span style={{ color: playerColors.textSecondary }}>
                    {t('companion.remainingLessons', { count: totalLessons - completedLessons })}
                  </span>
                  <span className="font-medium" style={{ color: playerColors.textPrimary }}>
                    {totalLessons - completedLessons}
                  </span>
                </div>
              )}
            </div>

            {/* Completion Message */}
            {courseProgress === 100 && (
              <div
                className="mt-3 p-3 rounded-lg text-center"
                style={{ backgroundColor: playerColors.successLight }}
              >
                <PartyPopper
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: playerColors.success }}
                />
                <p className="text-sm font-medium" style={{ color: playerColors.success }}>
                  {t('companion.courseComplete')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
