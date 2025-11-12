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
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Icon and Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>

      {/* Value and Trend */}
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-bold text-gray-900">{value}</p>

        {trend !== undefined && trend !== 0 && (
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Optional: Comparison text */}
      {trend !== undefined && (
        <p className="mt-2 text-xs text-gray-500">
          vs előző 30 nap
        </p>
      )}
    </div>
  )
}
