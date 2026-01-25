'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';
import type { Review } from '@/types';

interface PreviewReviewsProps {
  /** Reviews to display */
  reviews: Review[];
  /** Average rating */
  averageRating?: number;
  /** Total review count */
  reviewCount?: number;
  /** Maximum reviews to display */
  maxReviews?: number;
  /** Dark mode styling */
  darkMode?: boolean;
}

/**
 * Render star rating
 */
function StarRating({ rating, size = 'sm', darkMode = false }: { rating: number; size?: 'sm' | 'md'; darkMode?: boolean }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, idx) => (
        <Star
          key={idx}
          className={`${sizeClass} ${
            idx < fullStars
              ? 'text-yellow-400 fill-yellow-400'
              : idx === fullStars && hasHalfStar
              ? 'text-yellow-400 fill-yellow-400/50'
              : darkMode ? 'text-gray-600' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Format date to Hungarian locale
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Single review card
 */
function ReviewCard({ review, darkMode }: { review: Review; darkMode: boolean }) {
  const userName = review.user
    ? `${review.user.firstName} ${review.user.lastName}`
    : 'Anonim';

  return (
    <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
      <div className="flex items-start gap-3">
        {/* Quote icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          darkMode ? 'bg-brand-secondary/20' : 'bg-blue-100'
        }`}>
          <Quote className={`w-4 h-4 ${darkMode ? 'text-brand-secondary' : 'text-blue-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Rating and date */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <StarRating rating={review.rating} darkMode={darkMode} />
            {review.createdAt && (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatDate(review.createdAt)}
              </span>
            )}
          </div>

          {/* Comment */}
          {review.comment && (
            <p className={`text-sm leading-relaxed line-clamp-3 mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              "{review.comment}"
            </p>
          )}

          {/* Author */}
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            — {userName}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * PreviewReviews - Display reviews and ratings in course preview
 */
export function PreviewReviews({
  reviews,
  averageRating,
  reviewCount,
  maxReviews = 3,
  darkMode = false,
}: PreviewReviewsProps) {
  // Calculate average from reviews if not provided
  const calculatedAverage = averageRating ??
    (reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0);

  const totalCount = reviewCount ?? reviews.length;

  // No reviews available
  if ((!reviews || reviews.length === 0) && !averageRating) {
    return (
      <div className={`text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
        <Star className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
        <p className="text-sm">Még nincsenek értékelések</p>
      </div>
    );
  }

  const displayReviews = reviews.slice(0, maxReviews);

  return (
    <div className="space-y-4">
      {/* Average rating header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {calculatedAverage.toFixed(1)}
          </span>
          <div>
            <StarRating rating={calculatedAverage} size="md" darkMode={darkMode} />
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {totalCount} értékelés
            </p>
          </div>
        </div>

        {/* Rating distribution could go here */}
      </div>

      {/* Reviews list */}
      {displayReviews.length > 0 && (
        <div className="space-y-3">
          {displayReviews.map((review) => (
            <ReviewCard key={review.id} review={review} darkMode={darkMode} />
          ))}

          {reviews.length > maxReviews && (
            <p className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              + {reviews.length - maxReviews} további értékelés
            </p>
          )}
        </div>
      )}
    </div>
  );
}
