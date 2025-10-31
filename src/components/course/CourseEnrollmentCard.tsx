'use client';

import React from 'react';
import { Play, Star, Clock, Award, Infinity, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourseEnrollmentCardProps {
  price: number;
  duration: string;
  lessons: number;
  rating: number;
  students: number;
  certificateIncluded: boolean;
  lifetimeAccess: boolean;
  onEnroll: () => void;
  onPreview?: () => void;
  isEnrolled: boolean;
}

export function CourseEnrollmentCard({
  price,
  duration,
  lessons,
  rating,
  students,
  certificateIncluded,
  lifetimeAccess,
  onEnroll,
  onPreview,
  isEnrolled
}: CourseEnrollmentCardProps) {
  const isFree = price === 0;

  return (
    <div className="sticky top-24">
      <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
        {/* Price Header */}
        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white">
          <div className="flex items-baseline gap-2 mb-2">
            {isFree ? (
              <span className="text-4xl font-bold">Ingyenes</span>
            ) : (
              <>
                <span className="text-4xl font-bold">
                  {price.toLocaleString('hu-HU')} Ft
                </span>
              </>
            )}
          </div>
          <p className="text-white/80 text-sm">
            {isFree ? 'Korlátlan hozzáférés' : 'Egyszeri fizetés'}
          </p>
        </div>

        {/* Course Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>{duration} tartalom</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Play className="w-5 h-5 text-blue-600" />
              <span>{lessons} lecke</span>
            </div>
            {certificateIncluded && (
              <div className="flex items-center gap-3 text-gray-700">
                <Award className="w-5 h-5 text-blue-600" />
                <span>Tanúsítvány</span>
              </div>
            )}
            {lifetimeAccess && (
              <div className="flex items-center gap-3 text-gray-700">
                <Infinity className="w-5 h-5 text-blue-600" />
                <span>Élethosszig tartó hozzáférés</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-600">
                {students.toLocaleString('hu-HU')} hallgató
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={onEnroll}
              className="w-full bg-gradient-to-t from-blue-600 to-blue-500 hover:shadow-md text-white font-semibold py-6 text-lg transition-all"
              disabled={isEnrolled}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Beiratkozva
                </>
              ) : isFree ? (
                'Ingyenes beiratkozás'
              ) : (
                'Beiratkozás most'
              )}
            </Button>

            {onPreview && !isEnrolled && (
              <Button
                onClick={onPreview}
                variant="outline"
                className="w-full"
              >
                Ingyenes előnézet
              </Button>
            )}
          </div>

          {/* Guarantee */}
          {!isFree && (
            <div className="pt-4 text-center">
              <p className="text-sm text-gray-600">
                30 napos pénzvisszafizetési garancia
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
