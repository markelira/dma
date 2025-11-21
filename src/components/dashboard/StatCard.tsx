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
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  invertTrendColor = false,
  isLoading = false,
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
      <div className="relative rounded-xl bg-white p-6 shadow-md border border-gray-100 animate-pulse overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
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
    <div className="relative rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden group">
      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />

      {/* Icon and Label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors duration-300">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      </div>

      {/* Value and Trend */}
      <div className="flex items-baseline gap-3 mb-2">
        <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>

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
