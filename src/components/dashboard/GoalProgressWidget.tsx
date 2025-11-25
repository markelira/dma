'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Edit2, Plus, Check, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { LearningGoal } from '@/types';

interface GoalProgressWidgetProps {
  goal: LearningGoal | null;
  currentProgress: number; // Current week's learning minutes
  onEditGoal?: () => void;
  onCreateGoal?: () => void;
  isLoading?: boolean;
}

export function GoalProgressWidget({
  goal,
  currentProgress,
  onEditGoal,
  onCreateGoal,
  isLoading,
}: GoalProgressWidgetProps) {
  const [isHovering, setIsHovering] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-700 animate-pulse rounded" />
          <div className="w-32 h-32 mx-auto bg-gray-800 animate-pulse rounded-full" />
          <div className="h-4 w-full bg-gray-700 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // No goal set
  if (!goal) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-brand-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-brand-secondary" />
          </div>
          <h3 className="font-bold mb-2 text-white">Állíts be tanulási célt</h3>
          <p className="text-sm text-gray-400 mb-4">
            Tűzz ki heti tanulási időt és kövesd a haladásod
          </p>
          <button onClick={onCreateGoal} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-secondary text-white rounded-lg text-sm font-medium hover:bg-brand-secondary-hover transition-colors">
            <Plus className="w-4 h-4" />
            Cél létrehozása
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress
  const target = goal.target;
  const progress = Math.min(currentProgress, target);
  const progressPercentage = (progress / target) * 100;
  const isCompleted = progress >= target;
  const remaining = Math.max(0, target - progress);

  // Convert minutes to hours
  const progressHours = (progress / 60).toFixed(1);
  const targetHours = (target / 60).toFixed(1);
  const remainingHours = (remaining / 60).toFixed(1);

  // Motivational messages
  const getMessage = () => {
    if (isCompleted) return '🎉 Cél teljesítve!';
    if (progressPercentage >= 75) return '🔥 Már majdnem!';
    if (progressPercentage >= 50) return '💪 Jó ütemben haladsz!';
    if (progressPercentage >= 25) return '⭐ Rendben haladsz!';
    return '🚀 Kezdd el még ma!';
  };

  // Calculate circle properties for SVG
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div
      className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800 relative overflow-hidden transition-all hover:border-gray-700"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-secondary/50/10 to-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-secondary" />
          <h3 className="font-bold text-white">{goal.title}</h3>
        </div>
        {onEditGoal && (
          <button
            onClick={onEditGoal}
            className={`p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all ${isHovering ? 'opacity-100' : 'opacity-0'}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Circular Progress */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isCompleted ? '#10b981' : '#3b82f6'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={progressPercentage}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-brand-secondary">
              {progressPercentage.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {progressHours}h / {targetHours}h
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`text-center mb-4 font-medium ${
          isCompleted ? 'text-green-400' : 'text-brand-secondary'
        }`}
      >
        {getMessage()}
      </div>

      {/* Progress Details */}
      <div className="space-y-3">
        {!isCompleted && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Hátralevő:</span>
            <span className="font-medium text-white">{remainingHours} óra</span>
          </div>
        )}

        {goal.deadline && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Határidő:</span>
            <span className="font-medium text-white">
              {new Date(goal.deadline).toLocaleDateString('hu-HU')}
            </span>
          </div>
        )}

        {/* Progress Bar (alternative visualization) */}
        <div className="pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Heti előrehaladás</span>
            <span>{progress} / {target} perc</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-brand-secondary/50'}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion Confetti Effect */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: 2 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Check className="w-24 h-24 text-green-500 opacity-20" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
