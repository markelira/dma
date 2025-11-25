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
    ? 'text-green-600'
    : 'text-red-600'

  const TrendIcon = isTrendPositive ? TrendingUp : TrendingDown

  if (isLoading) {
    return (
      <div className="relative rounded-xl bg-white p-6 border border-gray-200 animate-pulse overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-secondary/50 to-brand-secondary" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-20 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="relative rounded-xl bg-white p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden group shadow-sm hover:shadow-md">
      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-secondary/50 to-brand-secondary" />

      {/* Icon and Label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-secondary/5 group-hover:bg-brand-secondary/10 transition-colors duration-300">
          <Icon className="h-6 w-6 text-brand-secondary" />
        </div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>

      {/* Value and Trend */}
      <div className="flex items-baseline gap-3 mb-2">
        <p className="text-4xl font-bold text-gray-900 tracking-tight">
          {value}{suffix && <span className="text-2xl text-gray-500 ml-1">{suffix}</span>}
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
        <p className="text-xs font-medium text-gray-400">
          vs előző 30 nap
        </p>
      )}
    </div>
  )
}
