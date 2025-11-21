'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Users, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface CarouselCourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnailUrl?: string;
  courseType: 'webinar' | 'akademia' | 'masterclass';
  duration?: number;
  enrolled?: boolean;
  enrollmentCount?: number;
  progress?: number;
}

const courseTypeLabels: Record<string, string> = {
  webinar: 'Webinar',
  akademia: 'Akademia',
  masterclass: 'Masterclass',
};

const courseTypeColors: Record<string, string> = {
  webinar: 'bg-purple-100 text-purple-700 border-purple-200',
  akademia: 'bg-blue-100 text-blue-700 border-blue-200',
  masterclass: 'bg-amber-100 text-amber-700 border-amber-200',
};

export function CarouselCourseCard({
  id,
  title,
  instructor,
  thumbnailUrl,
  courseType,
  duration,
  enrolled = false,
  enrollmentCount,
  progress,
}: CarouselCourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <div className="group relative rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-full flex flex-col">
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="secondary"
            className={`${courseTypeColors[courseType]} font-semibold text-xs px-3 py-1 border shadow-sm`}
          >
            {courseTypeLabels[courseType]}
          </Badge>
        </div>

        <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {enrolled && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-green-600 text-white font-semibold text-xs px-3 py-1 shadow-md">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Beiratkozva
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
            {title}
          </h3>

          <p className="text-sm font-medium text-gray-600 mb-4">
            {instructor}
          </p>

          <div className="mt-auto flex items-center gap-4 text-xs font-medium text-gray-500">
            {duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{duration}h</span>
              </div>
            )}
            {enrollmentCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{enrollmentCount}</span>
              </div>
            )}
          </div>

          {enrolled && progress !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-gray-600">Haladas</span>
                <span className="font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
