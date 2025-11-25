'use client'

import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartDataPoint {
  name: string // Month/Week label
  hours: number // Total hours studied
}

interface DashboardChartProps {
  data?: ChartDataPoint[]
  isLoading?: boolean
  period?: 'month' | 'week' | 'year'
  onPeriodChange?: (period: 'month' | 'week' | 'year') => void
}

// Hungarian month names
const HUNGARIAN_MONTHS = [
  'Január',
  'Február',
  'Március',
  'Április',
  'Május',
  'Június',
  'Július',
  'Augusztus',
  'Szeptember',
  'Október',
  'November',
  'December',
]

// Mock data for demonstration
const MOCK_DATA: ChartDataPoint[] = [
  { name: 'Január', hours: 12 },
  { name: 'Február', hours: 18 },
  { name: 'Március', hours: 25 },
  { name: 'Április', hours: 20 },
  { name: 'Május', hours: 30 },
  { name: 'Június', hours: 28 },
  { name: 'Július', hours: 22 },
  { name: 'Augusztus', hours: 15 },
  { name: 'Szeptember', hours: 35 },
  { name: 'Október', hours: 40 },
  { name: 'November', hours: 32 },
  { name: 'December', hours: 28 },
]

/**
 * Dashboard Chart Component
 *
 * Displays learning time statistics as a bar chart
 * Matches the preview design's clean aesthetic
 */
export function DashboardChart({
  data = MOCK_DATA,
  isLoading = false,
  period = 'month',
  onPeriodChange,
}: DashboardChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'week' | 'year'>(period)

  const handlePeriodChange = (newPeriod: 'month' | 'week' | 'year') => {
    setSelectedPeriod(newPeriod)
    onPeriodChange?.(newPeriod)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">Diagram betöltése...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      {/* Header with Period Selector */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Tanulási idő alakulása
        </h2>

        {/* Period Selector */}
        <select
          value={selectedPeriod}
          onChange={(e) => handlePeriodChange(e.target.value as 'month' | 'week' | 'year')}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition-colors"
        >
          <option value="week">Hét</option>
          <option value="month">Hónap</option>
          <option value="year">Év</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
            label={{
              value: 'Órák',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6B7280', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: '#111827', fontWeight: 600 }}
            itemStyle={{ color: '#3B82F6' }}
            formatter={(value: number) => [`${value} óra`, 'Tanulási idő']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={() => 'Tanulási idő'}
          />
          <Bar
            dataKey="hours"
            fill="#3B82F6"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {data.reduce((sum, item) => sum + item.hours, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Összes óra</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(data.reduce((sum, item) => sum + item.hours, 0) / data.length)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Átlag / hónap</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.max(...data.map((item) => item.hours))}
            </p>
            <p className="text-xs text-gray-500 mt-1">Legtöbb óra</p>
          </div>
        </div>
      </div>
    </div>
  )
}
