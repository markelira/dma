"use client"

import React from 'react'
import { playerColors, getProgressColor } from '@/lib/course-player-design-system'

interface ProgressRingProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  strokeWidth?: number
  className?: string
}

const sizeConfig = {
  sm: { diameter: 48, fontSize: 'text-xs', strokeWidth: 3 },
  md: { diameter: 64, fontSize: 'text-sm', strokeWidth: 4 },
  lg: { diameter: 80, fontSize: 'text-base', strokeWidth: 5 },
  xl: { diameter: 120, fontSize: 'text-2xl', strokeWidth: 6 }
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 'md',
  showLabel = true,
  strokeWidth: customStrokeWidth,
  className = ''
}) => {
  const config = sizeConfig[size]
  const strokeWidth = customStrokeWidth || config.strokeWidth
  const radius = (config.diameter - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const progressColor = getProgressColor(percentage)

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: config.diameter, height: config.diameter }}
    >
      <svg
        width={config.diameter}
        height={config.diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke={playerColors.neutral}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {showLabel && (
        <div className={`absolute inset-0 flex items-center justify-center ${config.fontSize} font-semibold`}>
          <span style={{ color: progressColor }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Small variant without label for compact spaces
export const ProgressRingCompact: React.FC<{ percentage: number; className?: string }> = ({
  percentage,
  className
}) => {
  return (
    <ProgressRing
      percentage={percentage}
      size="sm"
      showLabel={false}
      className={className}
    />
  )
}
