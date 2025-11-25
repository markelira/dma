'use client';

import React from 'react';
import { Clock, Globe, Award, Users, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface CourseMetadataBarProps {
  level?: string;
  duration?: string;
  language?: string;
  certificateEnabled?: boolean;
  enrollmentCount?: number;
  publishDate?: string | Date;
  darkMode?: boolean;
}

export function CourseMetadataBar({
  level,
  duration,
  language,
  certificateEnabled,
  enrollmentCount,
  publishDate,
  darkMode = true
}: CourseMetadataBarProps) {
  // Get difficulty badge color
  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return null;
    const lower = difficulty.toLowerCase();
    if (lower.includes('kezd') || lower === 'beginner') {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (lower.includes('közép') || lower === 'intermediate') {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    if (lower.includes('halad') || lower === 'advanced') {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Get difficulty label in Hungarian
  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return null;
    const lower = difficulty.toLowerCase();
    if (lower.includes('kezd') || lower === 'beginner') return 'Kezdő';
    if (lower.includes('közép') || lower === 'intermediate') return 'Középhaladó';
    if (lower.includes('halad') || lower === 'advanced') return 'Haladó';
    return difficulty;
  };

  // Format enrollment count
  const formatCount = (count?: number) => {
    if (!count) return null;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Get year from publish date
  const getYear = (date?: string | Date) => {
    if (!date) return null;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.getFullYear();
    } catch {
      return null;
    }
  };

  const difficultyColor = getDifficultyColor(level);
  const difficultyLabel = getDifficultyLabel(level);
  const formattedCount = formatCount(enrollmentCount);
  const year = getYear(publishDate);

  // Check if we have any metadata to display
  const hasMetadata = difficultyLabel || duration || language || certificateEnabled || formattedCount || year;

  if (!hasMetadata) return null;

  const containerClass = darkMode
    ? 'py-4 border-b border-gray-800'
    : 'py-4 border-b border-gray-200';

  const textClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const valueClass = darkMode ? 'text-white' : 'text-gray-900';
  const iconClass = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {/* Difficulty Badge */}
        {difficultyLabel && difficultyColor && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyColor}`}>
            {difficultyLabel}
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${iconClass}`} />
            <span className={`text-sm ${valueClass}`}>{duration}</span>
          </div>
        )}

        {/* Language */}
        {language && (
          <div className="flex items-center gap-2">
            <Globe className={`w-4 h-4 ${iconClass}`} />
            <span className={`text-sm ${valueClass}`}>{language}</span>
          </div>
        )}

        {/* Certificate */}
        {certificateEnabled && (
          <div className="flex items-center gap-2">
            <Award className={`w-4 h-4 text-amber-500`} />
            <span className={`text-sm ${valueClass}`}>Tanúsítvány</span>
          </div>
        )}

        {/* Enrollment Count */}
        {formattedCount && (
          <div className="flex items-center gap-2">
            <Users className={`w-4 h-4 ${iconClass}`} />
            <span className={`text-sm ${valueClass}`}>{formattedCount} tanuló</span>
          </div>
        )}

        {/* Publish Year */}
        {year && (
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${iconClass}`} />
            <span className={`text-sm ${textClass}`}>{year}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
