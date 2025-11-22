import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  /**
   * Icon component to display
   */
  icon: LucideIcon
  /**
   * Label text (e.g., "Összes kurzus")
   */
  label: string
  /**
   * Main value to display
   */
  value: string | number
  /**
   * Trend percentage (e.g., 16.6, -4.8)
   * Positive = up trend (green), Negative = down trend (red)
   */
  trend?: number
  /**
   * Optional: Override trend direction interpretation
   * Some metrics are better when decreasing (e.g., time to complete)
   */
  invertTrendColor?: boolean
  /**
   * Loading state
   */
  isLoading?: boolean
  /**
   * Optional suffix (e.g., "h" for hours)
   */
  suffix?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  invertTrendColor = false,
  isLoading = false,
  suffix,
}: StatCardProps) {
  // Determine if trend is positive (green) or negative (red)
  const isTrendPositive = invertTrendColor
    ? (trend ?? 0) < 0
    : (trend ?? 0) > 0

  const trendColor = isTrendPositive
    ? 'text-green-400'
    : 'text-red-400'

  const TrendIcon = isTrendPositive ? TrendingUp : TrendingDown

  if (isLoading) {
    return (
      <div className="relative rounded-xl bg-[#1a1a1a] p-6 border border-gray-800 animate-pulse overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gray-700" />
          <div className="h-4 w-24 bg-gray-700 rounded" />
        </div>
        <div className="h-9 w-20 bg-gray-700 rounded mb-2" />
        <div className="h-3 w-16 bg-gray-700 rounded" />
      </div>
    )
  }

  return (
    <div className="relative rounded-xl bg-[#1a1a1a] p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group">
      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />

      {/* Icon and Label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-colors duration-300">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>

      {/* Value and Trend */}
      <div className="flex items-baseline gap-3 mb-2">
        <p className="text-4xl font-bold text-white tracking-tight">
          {value}{suffix && <span className="text-2xl text-gray-400 ml-1">{suffix}</span>}
        </p>

        {trend !== undefined && trend !== 0 && (
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-bold">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Optional: Comparison text */}
      {trend !== undefined && (
        <p className="text-xs font-medium text-gray-500">
          vs előző 30 nap
        </p>
      )}
    </div>
  )
}
