'use client';

import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/CoursePlayerIcons';

interface NewLessonNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

/**
 * NewLessonNavigation Component
 * Displays previous/next lesson navigation buttons
 * Matches the screenshot design exactly
 */
export function NewLessonNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLoading = false,
}: NewLessonNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Previous Button */}
      {hasPrevious ? (
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <ArrowLeftIcon size={20} />
          <span>Előző</span>
        </button>
      ) : (
        <div />
      )}

      {/* Next Button */}
      {hasNext ? (
        <button
          onClick={onNext}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Következő lecke</span>
          <ArrowRightIcon size={20} />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}

