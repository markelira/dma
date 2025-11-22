'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserAchievement } from '@/types';
import confetti from 'canvas-confetti';

interface AchievementUnlockModalProps {
  achievement: UserAchievement | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 to-blue-600',
};

export function AchievementUnlockModal({
  achievement,
  isOpen,
  onClose,
}: AchievementUnlockModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!achievement) return null;

  const tier = achievement.tier || 'bronze';
  const tierColor = TIER_COLORS[tier];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-gray-900 shadow-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Card */}
              <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                {/* Header with Gradient */}
                <div className={`relative bg-gradient-to-br ${tierColor} p-8`}>
                  {/* Sparkles Animation */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute top-4 right-4 opacity-30"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -180, -360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: 1.5,
                    }}
                    className="absolute bottom-4 left-4 opacity-30"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Trophy Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                    className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Trophy className="w-12 h-12 text-white" />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white text-center"
                  >
                    Jelvény feloldva!
                  </motion.h2>

                  {/* Tier Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 px-4 py-1 bg-white/30 backdrop-blur-sm rounded-full text-white font-bold text-sm uppercase mx-auto w-fit"
                  >
                    {tier}
                  </motion.div>
                </div>

                {/* Body */}
                <div className="p-8">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-bold text-center mb-3 text-white"
                  >
                    {achievement.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-400 text-center mb-6"
                  >
                    {achievement.description}
                  </motion.p>

                  {/* Achievement Metadata */}
                  {achievement.metadata && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gray-800 rounded-lg p-4 mb-6"
                    >
                      {achievement.metadata.courseName && (
                        <div className="text-sm">
                          <span className="text-gray-400">Kurzus: </span>
                          <span className="font-medium text-white">{achievement.metadata.courseName}</span>
                        </div>
                      )}
                      {achievement.metadata.streakDays && (
                        <div className="text-sm">
                          <span className="text-gray-400">Sorozat: </span>
                          <span className="font-medium text-white">{achievement.metadata.streakDays} nap</span>
                        </div>
                      )}
                      {achievement.metadata.quizScore && (
                        <div className="text-sm">
                          <span className="text-gray-400">Pontszám: </span>
                          <span className="font-medium text-white">{achievement.metadata.quizScore}%</span>
                        </div>
                      )}
                      {achievement.metadata.points && (
                        <div className="text-sm">
                          <span className="text-gray-400">Pont: </span>
                          <span className="font-medium text-white">+{achievement.metadata.points} XP</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <button
                      onClick={onClose}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
                    >
                      Nagyszerű!
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
