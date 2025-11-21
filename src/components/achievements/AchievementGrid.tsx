'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Filter, Lock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Eredmények
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {unlockedCount} / {achievements.length} jelvény feloldva
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Mind ({achievements.length})
          </Button>
          <Button
            variant={filter === 'unlocked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unlocked')}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Feloldva ({unlockedCount})
          </Button>
          <Button
            variant={filter === 'locked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('locked')}
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            Zárolva ({lockedCount})
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Összes haladás</span>
          <span className="text-muted-foreground">
            {((unlockedCount / achievements.length) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
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
          <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="font-medium text-muted-foreground mb-1">
            {filter === 'unlocked' && 'Még nincs feloldott jelvény'}
            {filter === 'locked' && 'Minden jelvény feloldva!'}
            {filter === 'all' && 'Nincsenek jelvények'}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === 'unlocked' && 'Kezdj el tanulni és szerezz jelvényeket'}
            {filter === 'locked' && 'Gratulálunk, mindent elértél!'}
          </p>
        </div>
      )}
    </Card>
  );
}
