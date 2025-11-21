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
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-sm mb-1">{payload[0].payload.label}</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm">
              {payload[0].value} óra ({(payload[0].value * 60).toFixed(0)} perc)
            </span>
          </div>
          {goalHours && (
            <p className="text-xs text-muted-foreground mt-1">
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
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Tanulási aktivitás
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {timeRange === 'week' && 'Heti tanulási órák'}
            {timeRange === 'month' && 'Havi tanulási órák'}
            {timeRange === 'year' && 'Éves tanulási órák'}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('week')}
          >
            Hét
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('month')}
          >
            Hónap
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('year')}
          >
            Év
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Összesen</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {totalHours}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.totalMinutes} perc
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">Átlag</span>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {avgHours}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">naponta</p>
        </div>

        {goalHours && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Heti cél</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {goalHours}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Órák', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
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

    </Card>
  );
}
