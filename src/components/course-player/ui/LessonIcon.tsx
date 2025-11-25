"use client"

import React from 'react'
import {
  Play,
  FileText,
  BookOpen,
  HelpCircle,
  FileQuestion,
  Headphones,
  FileDown,
  Video
} from 'lucide-react'
import { getLessonTypeColor } from '@/lib/course-player-design-system'
import { useTranslation } from '@/hooks/useTranslation'

interface LessonIconProps {
  type: string
  className?: string
  size?: number
}

export const LessonIcon: React.FC<LessonIconProps> = ({
  type,
  className = '',
  size = 20
}) => {
  const iconColor = getLessonTypeColor(type)
  const iconProps = {
    size,
    style: { color: iconColor },
    className
  }

  const iconMap: Record<string, React.ReactElement> = {
    VIDEO: <Play {...iconProps} fill={iconColor} />,
    QUIZ: <HelpCircle {...iconProps} />,
    TEXT: <FileText {...iconProps} />,
    READING: <BookOpen {...iconProps} />,
    PDF: <FileDown {...iconProps} />,
    AUDIO: <Headphones {...iconProps} />,
    ASSIGNMENT: <FileQuestion {...iconProps} />,
    // Fallback
    default: <Video {...iconProps} />
  }

  return iconMap[type] || iconMap.default
}

// Lesson type badge with icon and label
export const LessonTypeBadge: React.FC<{
  type: string
  showLabel?: boolean
  className?: string
}> = ({ type, showLabel = false, className = '' }) => {
  const { t } = useTranslation()

  const badgeColors: Record<string, string> = {
    VIDEO: 'bg-brand-secondary/10 text-brand-secondary-hover',
    QUIZ: 'bg-yellow-100 text-yellow-800',
    TEXT: 'bg-gray-100 text-gray-800',
    READING: 'bg-purple-100 text-purple-800',
    PDF: 'bg-red-100 text-red-800',
    AUDIO: 'bg-cyan-100 text-cyan-800',
    ASSIGNMENT: 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    const typeKey = `lessonTypes.${type}` as any
    return t(typeKey)
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        badgeColors[type] || badgeColors.TEXT
      } ${className}`}
    >
      <LessonIcon type={type} size={12} />
      {showLabel && <span>{getTypeLabel(type)}</span>}
    </span>
  )
}
