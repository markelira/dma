'use client';

import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/CoursePlayerIcons';

interface NewLessonNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
  courseType?: string;
}

/**
 * NewLessonNavigation Component
 * Displays previous/next lesson navigation buttons
 * Matches the screenshot design exactly
 *
 * Wrapped in React.memo to prevent unnecessary re-renders
 */
export const NewLessonNavigation = React.memo(function NewLessonNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLoading = false,
  courseType,
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
          <span>Előző rész</span>
        </button>
      ) : (
        <div />
      )}

      {/* Next Button */}
      {hasNext ? (
        <button
          onClick={onNext}
          disabled={isLoading}
          className="flex items-center gap-2 bg-brand-secondary/50 hover:bg-brand-secondary text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-brand-secondary/20 hover:shadow-brand-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Következő rész</span>
          <ArrowRightIcon size={20} />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
});

