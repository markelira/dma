'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Award, Target, Zap, Lock } from 'lucide-react';
import type { UserAchievement } from '@/types';

interface AchievementBadgeProps {
  achievement: UserAchievement;
  isLocked?: boolean;
  showProgress?: boolean;
  progress?: number;
  onClick?: () => void;
}

const ICON_MAP: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  award: Award,
  target: Target,
  zap: Zap,
};

const TIER_COLORS = {
  bronze: {
    bg: 'from-amber-700 to-amber-900',
    glow: 'shadow-amber-500/50',
    text: 'text-amber-600',
    border: 'border-amber-600',
  },
  silver: {
    bg: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-400/50',
    text: 'text-gray-600',
    border: 'border-gray-600',
  },
  gold: {
    bg: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/50',
    text: 'text-yellow-600',
    border: 'border-yellow-600',
  },
  platinum: {
    bg: 'from-cyan-400 to-blue-600',
    glow: 'shadow-cyan-500/50',
    text: 'text-cyan-600',
    border: 'border-cyan-600',
  },
};

export function AchievementBadge({
  achievement,
  isLocked = false,
  showProgress = false,
  progress = 0,
  onClick,
}: AchievementBadgeProps) {
  const tier = achievement.tier || 'bronze';
  const colors = TIER_COLORS[tier];
  const IconComponent = achievement.iconName ? ICON_MAP[achievement.iconName] || Trophy : Trophy;

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.05, y: isLocked ? 0 : -2 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      className={`relative cursor-pointer ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
    >
      <div
        className={`
          relative p-4 rounded-lg border-2 transition-all
          ${isLocked ? 'bg-gray-900 border-gray-700' : `bg-gradient-to-br ${colors.bg} ${colors.border}`}
          ${!isLocked && `shadow-lg ${colors.glow}`}
        `}
      >
        {/* Badge Icon */}
        <div className="relative flex items-center justify-center mb-3">
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isLocked ? 'bg-gray-800' : 'bg-white/20 backdrop-blur-sm'}
            `}
          >
            {isLocked ? (
              <Lock className="w-8 h-8 text-gray-500" />
            ) : (
              <IconComponent className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Tier Badge */}
          {!isLocked && tier && (
            <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-gray-900 rounded-full text-xs font-bold uppercase shadow-md">
              <span className={colors.text}>{tier}</span>
            </div>
          )}
        </div>

        {/* Achievement Title */}
        <h4
          className={`
            text-sm font-semibold text-center mb-1
            ${isLocked ? 'text-gray-400' : 'text-white'}
          `}
        >
          {isLocked ? '???' : achievement.title}
        </h4>

        {/* Achievement Description */}
        <p
          className={`
            text-xs text-center line-clamp-2
            ${isLocked ? 'text-gray-500' : 'text-white/80'}
          `}
        >
          {isLocked ? 'Oldja fel ezt a jelvényt' : achievement.description}
        </p>

        {/* Earned Date */}
        {!isLocked && achievement.earnedAt && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs text-white/60 text-center">
              Megszerzve: {new Date(achievement.earnedAt).toLocaleDateString('hu-HU')}
            </p>
          </div>
        )}

        {/* Progress Bar for Locked Achievements */}
        {isLocked && showProgress && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">{progress}% kész</p>
          </div>
        )}
      </div>

      {/* Sparkle Effect for Unlocked Badges */}
      {!isLocked && !achievement.celebrated && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          className="absolute -top-2 -right-2 w-6 h-6"
        >
          <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
        </motion.div>
      )}
    </motion.div>
  );
}
