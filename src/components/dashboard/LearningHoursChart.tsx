'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Calendar } from 'lucide-react';
import type { LearningHoursChartData } from '@/types';

interface LearningHoursChartProps {
  data: LearningHoursChartData;
  onTimeRangeChange?: (range: 'week' | 'month' | 'year') => void;
  isLoading?: boolean;
}

export function LearningHoursChart({ data, onTimeRangeChange, isLoading }: LearningHoursChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>(data.timeRange);

  const handleTimeRangeChange = (range: 'week' | 'month' | 'year') => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  // Convert minutes to hours for display
  const chartData = data.data.map(item => ({
    ...item,
    hours: Number((item.minutes / 60).toFixed(1)),
  }));

  const goalHours = data.goal ? Number((data.goal / 60).toFixed(1)) : null;
  const totalHours = Number((data.totalMinutes / 60).toFixed(1));
  const avgHours = Number((data.averagePerDay / 60).toFixed(1));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-medium text-sm mb-1 text-white">{payload[0].payload.label}</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">
              {payload[0].value} óra ({(payload[0].value * 60).toFixed(0)} perc)
            </span>
          </div>
          {goalHours && (
            <p className="text-xs text-gray-500 mt-1">
              Cél: {goalHours} óra
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-700 animate-pulse rounded" />
          </div>
          <div className="h-10 w-64 bg-gray-700 animate-pulse rounded" />
        </div>
        <div className="h-64 bg-gray-800 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Tanulási aktivitás
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {timeRange === 'week' && 'Heti tanulási órák'}
            {timeRange === 'month' && 'Havi tanulási órák'}
            {timeRange === 'year' && 'Éves tanulási órák'}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Hét
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Hónap
          </button>
          <button
            onClick={() => handleTimeRangeChange('year')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              timeRange === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Év
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Összesen</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {totalHours}h
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {data.totalMinutes} perc
          </p>
        </div>

        <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Átlag</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {avgHours}h
          </div>
          <p className="text-xs text-gray-500 mt-1">naponta</p>
        </div>

        {goalHours && (
          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">Heti cél</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {goalHours}h
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalHours / goalHours) * 100).toFixed(0)}% teljesítve
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              label={{ value: 'Órák', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Bar
              dataKey="hours"
              fill="url(#colorHours)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            {goalHours && (
              <Line
                type="monotone"
                dataKey={() => goalHours}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Cél"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
