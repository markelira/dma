"use client"

import React from 'react'
import { CheckCircle, Circle, PlayCircle } from 'lucide-react'
import { playerColors } from '@/lib/course-player-design-system'
import { useTranslation } from '@/hooks/useTranslation'

interface CompletionBadgeProps {
  isCompleted: boolean
  isActive?: boolean
  size?: number
  className?: string
  showAnimation?: boolean
}

export const CompletionBadge: React.FC<CompletionBadgeProps> = ({
  isCompleted,
  isActive = false,
  size = 20,
  className = '',
  showAnimation = false
}) => {
  if (isCompleted) {
    return (
      <CheckCircle
        size={size}
        className={`${showAnimation ? 'animate-bounce' : ''} ${className}`}
        style={{ color: playerColors.success }}
        fill={playerColors.successLight}
      />
    )
  }

  if (isActive) {
    return (
      <PlayCircle
        size={size}
        className={className}
        style={{ color: playerColors.primary }}
        fill={playerColors.primaryLight}
      />
    )
  }

  return (
    <Circle
      size={size}
      className={className}
      style={{ color: playerColors.textTertiary }}
    />
  )
}

// Completion status with text label
export const CompletionStatus: React.FC<{
  isCompleted: boolean
  isActive?: boolean
  completedText?: string
  activeText?: string
  pendingText?: string
  className?: string
}> = ({
  isCompleted,
  isActive = false,
  completedText,
  activeText,
  pendingText,
  className = ''
}) => {
  const { t } = useTranslation()

  const defaultCompletedText = completedText || t('companion.completed')
  const defaultActiveText = activeText || t('companion.inProgress')
  const defaultPendingText = pendingText || t('companion.notStarted')
  const getStatusConfig = () => {
    if (isCompleted) {
      return {
        icon: <CheckCircle size={16} style={{ color: playerColors.success }} />,
        text: defaultCompletedText,
        bgColor: playerColors.successLight,
        textColor: playerColors.success
      }
    }
    if (isActive) {
      return {
        icon: <PlayCircle size={16} style={{ color: playerColors.primary }} />,
        text: defaultActiveText,
        bgColor: playerColors.primaryLight,
        textColor: playerColors.primary
      }
    }
    return {
      icon: <Circle size={16} style={{ color: playerColors.textTertiary }} />,
      text: defaultPendingText,
      bgColor: playerColors.neutral,
      textColor: playerColors.textSecondary
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}

// Simple checkmark for minimal display
export const CompletionCheckmark: React.FC<{ isCompleted: boolean; className?: string }> = ({
  isCompleted,
  className = ''
}) => {
  if (!isCompleted) return null

  return (
    <div
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${className}`}
      style={{ backgroundColor: playerColors.success }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 3L4.5 8.5L2 6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
