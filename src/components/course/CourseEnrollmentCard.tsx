'use client';

import React from 'react';
import { Play, Clock, Infinity, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CourseType } from '@/types';

interface CourseEnrollmentCardProps {
  price: number;
  originalPrice?: number;
  duration: string;
  lessons: number;
  rating?: number;
  students?: number;
  lifetimeAccess: boolean;
  onEnroll: () => void;
  isEnrolled: boolean;
  thumbnailUrl?: string;
  courseTitle?: string;
  courseType?: CourseType;
  darkMode?: boolean;
}

export function CourseEnrollmentCard({
  price,
  originalPrice,
  duration,
  lessons,
  rating,
  students,
  lifetimeAccess,
  onEnroll,
  isEnrolled,
  thumbnailUrl,
  courseTitle,
  courseType,
  darkMode = false
}: CourseEnrollmentCardProps) {
  const isFree = price === 0;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;

  // Get dynamic CTA button text based on course type
  const getCtaText = () => {
    switch (courseType) {
      case 'WEBINAR':
        return 'Webinár indítása';
      case 'ACADEMIA':
        return 'Akadémia indítása';
      case 'MASTERCLASS':
        return 'Masterclass indítása';
      case 'PODCAST':
        return 'Podcast indítása';
      default:
        return 'Tartalom indítása';
    }
  };

  // Dark mode styles
  const containerClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl overflow-hidden'
    : 'bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden';

  const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const placeholderBg = darkMode
    ? 'bg-gradient-to-br from-gray-800 to-gray-700'
    : 'bg-gradient-to-br from-brand-secondary/10/50 to-purple-100/30';

  return (
    <div className="sticky top-24">
      <div className={containerClass}>
        {/* Course Thumbnail */}
        {thumbnailUrl && (
          <div className="relative aspect-video bg-gray-800 overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={courseTitle || 'Course thumbnail'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
        {!thumbnailUrl && (
          <div className={`relative aspect-video ${placeholderBg} flex items-center justify-center`}>
            <BookOpen className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-brand-secondary'} opacity-40`} />
          </div>
        )}

        {/* Subscription Header */}
        <div className="p-6 bg-gradient-to-br from-brand-secondary to-brand-secondary/80 text-white">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">Hozzáférés előfizetéssel</span>
            {hasDiscount && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                -{discountPercent}%
              </span>
            )}
          </div>
          {hasDiscount && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white/60 line-through text-sm">
                {originalPrice.toLocaleString('hu-HU')} Ft
              </span>
              <span className="text-white font-bold">
                {price.toLocaleString('hu-HU')} Ft
              </span>
            </div>
          )}
          <p className="text-white/90 text-sm">
            Korlátlan tanulás, mindenhez hozzáférés
          </p>
        </div>

        {/* Course Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {duration && (
              <div className={`flex items-center gap-3 ${textClass}`}>
                <Clock className="w-5 h-5 text-brand-secondary" />
                <span>{duration} tartalom</span>
              </div>
            )}
            {lessons > 0 && (
              <div className={`flex items-center gap-3 ${textClass}`}>
                <Play className="w-5 h-5 text-brand-secondary" />
                <span>{lessons} lecke</span>
              </div>
            )}
            <div className={`flex items-center gap-3 ${textClass}`}>
              <Infinity className="w-5 h-5 text-brand-secondary" />
              <span>Korlátlan hozzáférés</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={onEnroll}
              className="w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/80 hover:shadow-xl text-white font-bold py-7 text-lg rounded-xl transition-all hover:scale-[1.02]"
              disabled={isEnrolled}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Beiratkozva
                </>
              ) : (
                getCtaText()
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
