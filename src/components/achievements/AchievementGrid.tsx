'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Filter, Lock, CheckCircle } from 'lucide-react';
import { AchievementBadge } from './AchievementBadge';
import type { UserAchievement } from '@/types';

interface AchievementGridProps {
  achievements: UserAchievement[];
  isLoading?: boolean;
  onBadgeClick?: (achievement: UserAchievement) => void;
}

type FilterType = 'all' | 'unlocked' | 'locked';

export function AchievementGrid({ achievements, isLoading, onBadgeClick }: AchievementGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Separate unlocked and locked achievements
  const unlockedCount = achievements.filter(a => a.earnedAt).length;
  const lockedCount = achievements.length - unlockedCount;

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.earnedAt;
    if (filter === 'locked') return !achievement.earnedAt;
    return true;
  });

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-700 animate-pulse rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Award className="w-5 h-5 text-yellow-500" />
            Eredmények
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {unlockedCount} / {achievements.length} jelvény feloldva
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-brand-secondary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Mind ({achievements.length})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'unlocked'
                ? 'bg-brand-secondary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Feloldva ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'locked'
                ? 'bg-brand-secondary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            Zárolva ({lockedCount})
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-white">Összes haladás</span>
          <span className="text-gray-400">
            {((unlockedCount / achievements.length) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <AchievementBadge
                achievement={achievement}
                isLocked={!achievement.earnedAt}
                onClick={() => onBadgeClick?.(achievement)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="font-medium text-gray-400 mb-1">
            {filter === 'unlocked' && 'Még nincs feloldott jelvény'}
            {filter === 'locked' && 'Minden jelvény feloldva!'}
            {filter === 'all' && 'Nincsenek jelvények'}
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'unlocked' && 'Kezdj el tanulni és szerezz jelvényeket'}
            {filter === 'locked' && 'Gratulálunk, mindent elértél!'}
          </p>
        </div>
      )}
    </div>
  );
}
