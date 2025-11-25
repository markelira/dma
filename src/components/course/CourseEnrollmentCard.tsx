'use client';

import React from 'react';
import { Play, Clock, Infinity, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface CourseEnrollmentCardProps {
  price: number;
  duration: string;
  lessons: number;
  lifetimeAccess: boolean;
  onEnroll: () => void;
  onPreview?: () => void;
  isEnrolled: boolean;
  thumbnailUrl?: string;
  courseTitle?: string;
}

export function CourseEnrollmentCard({
  price,
  duration,
  lessons,
  lifetimeAccess,
  onEnroll,
  onPreview,
  isEnrolled,
  thumbnailUrl,
  courseTitle
}: CourseEnrollmentCardProps) {
  const isFree = price === 0;

  return (
    <div className="sticky top-24">
      <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
        {/* Course Thumbnail */}
        {thumbnailUrl && (
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
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
          <div className="relative aspect-video bg-gradient-to-br from-brand-secondary/10/50 to-purple-100/30 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-brand-secondary opacity-40" />
          </div>
        )}

        {/* Subscription Header */}
        <div className="p-6 bg-gradient-to-br from-brand-secondary to-brand-secondary/50 text-white">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">Hozzáférés előfizetéssel</span>
          </div>
          <p className="text-white/90 text-sm">
            Korlátlan tanulás, mindenhez hozzáférés
          </p>
        </div>

        {/* Course Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {duration && (
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-brand-secondary" />
                <span>{duration} tartalom</span>
              </div>
            )}
            {lessons > 0 && (
              <div className="flex items-center gap-3 text-gray-700">
                <Play className="w-5 h-5 text-brand-secondary" />
                <span>{lessons} lecke</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-700">
              <Infinity className="w-5 h-5 text-brand-secondary" />
              <span>Korlátlan hozzáférés</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={onEnroll}
              className="w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 hover:shadow-xl text-white font-bold py-7 text-lg rounded-xl transition-all hover:scale-[1.02]"
              disabled={isEnrolled}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Beiratkozva
                </>
              ) : (
                'Feliratkozás most'
              )}
            </Button>

            {onPreview && !isEnrolled && (
              <Button
                onClick={onPreview}
                variant="outline"
                className="w-full border-2"
              >
                Ingyenes előnézet
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
