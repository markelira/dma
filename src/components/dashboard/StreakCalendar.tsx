'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Award, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { LearningStreak } from '@/types';

interface StreakCalendarProps {
  streak: LearningStreak;
  isLoading?: boolean;
}

export function StreakCalendar({ streak, isLoading }: StreakCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-700 animate-pulse rounded" />
          <div className="h-24 bg-gray-800 animate-pulse rounded" />
          <div className="h-32 bg-gray-800 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Generate last 12 weeks of calendar data
  const today = new Date();
  const weeks = 12;
  const days = weeks * 7;

  const calendarData: Array<{ date: string; minutes: number; dayOfWeek: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const minutes = streak.activityCalendar?.[dateStr] || 0;

    calendarData.push({
      date: dateStr,
      minutes,
      dayOfWeek: date.getDay(),
    });
  }

  // Group by weeks
  const weeklyData: Array<Array<typeof calendarData[0]>> = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeklyData.push(calendarData.slice(i, i + 7));
  }

  // Determine color intensity based on minutes - using blue colors
  const getIntensity = (minutes: number): string => {
    if (minutes === 0) return 'bg-gray-800';
    if (minutes < 30) return 'bg-brand-secondary-hover/50';
    if (minutes < 60) return 'bg-blue-800/70';
    if (minutes < 90) return 'bg-brand-secondary-hover';
    if (minutes < 120) return 'bg-brand-secondary';
    return 'bg-brand-secondary/50';
  };

  const hoveredData = hoveredDay ? streak.activityCalendar?.[hoveredDay] || 0 : 0;

  return (
    <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Flame className="w-5 h-5 text-orange-500" />
            Tanulási sorozat
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Napi tanulási aktivitás az elmúlt 12 hétben
          </p>
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-orange-900/20 border border-orange-800/50 rounded-lg">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-orange-400">
            {streak.currentStreak}
          </div>
          <div className="text-xs text-gray-500">Jelenlegi</div>
        </div>

        <div className="text-center p-3 bg-purple-900/20 border border-purple-800/50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-purple-400">
            {streak.longestStreak}
          </div>
          <div className="text-xs text-gray-500">Leghosszabb</div>
        </div>

        <div className="text-center p-3 bg-brand-secondary-hover/20 border border-blue-800/50 rounded-lg">
          <Award className="w-5 h-5 text-brand-secondary mx-auto mb-1" />
          <div className="text-2xl font-bold text-brand-secondary">
            {streak.totalActiveDays}
          </div>
          <div className="text-xs text-gray-500">Aktív napok</div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="space-y-2">
        {/* Day labels */}
        <div className="flex gap-1 mb-2 pl-8">
          {['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Sz'].map((day, i) => (
            <div
              key={i}
              className="text-xs text-gray-500 w-3 text-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1 overflow-x-auto">
          {weeklyData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getIntensity(
                    day.minutes
                  )}`}
                  onMouseEnter={() => setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${new Date(day.date).toLocaleDateString('hu-HU')}: ${
                    day.minutes
                  } perc`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Hover Tooltip */}
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white">
                {new Date(hoveredDay).toLocaleDateString('hu-HU', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-brand-secondary font-bold">
                {hoveredData} perc
                {hoveredData > 0 && ` (${(hoveredData / 60).toFixed(1)} óra)`}
              </span>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
          <span className="text-xs text-gray-500">Kevesebb</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-brand-secondary-hover/50" />
            <div className="w-3 h-3 rounded-sm bg-blue-800/70" />
            <div className="w-3 h-3 rounded-sm bg-brand-secondary-hover" />
            <div className="w-3 h-3 rounded-sm bg-brand-secondary" />
            <div className="w-3 h-3 rounded-sm bg-brand-secondary/50" />
          </div>
          <span className="text-xs text-gray-500">Több</span>
        </div>
      </div>

      {/* Milestones */}
      {streak.milestones && streak.milestones.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-white">
            <Award className="w-4 h-4 text-yellow-500" />
            Mérföldkövek
          </h4>
          <div className="flex flex-wrap gap-2">
            {streak.milestones.map((milestone, index) => (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-3 py-1.5 bg-yellow-900/30 border border-yellow-800/50 rounded-full text-xs font-medium text-yellow-400 flex items-center gap-1"
              >
                {milestone.days} nap
              </motion.div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
