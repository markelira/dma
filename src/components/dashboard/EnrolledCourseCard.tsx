'use client';

import Link from 'next/link';
import { Play, Clock, CheckCircle } from 'lucide-react';

interface EnrolledCourseCardProps {
  enrollment: {
    courseId: string;
    courseName: string;
    courseInstructor?: string;
    progress: number;
    status: string;
    thumbnailUrl?: string;
    courseType?: string;
    duration?: string;
    currentLessonId?: string;
    firstLessonId?: string;
  };
  index?: number;
}

export function EnrolledCourseCard({ enrollment, index = 0 }: EnrolledCourseCardProps) {
  const isCompleted = enrollment.status === 'completed' || enrollment.progress === 100;
  const isInProgress = enrollment.progress > 0 && enrollment.progress < 100;

  // Determine target lesson: resume from last watched, or start from first lesson
  const targetLessonId = enrollment.currentLessonId || enrollment.firstLessonId;
  const href = targetLessonId
    ? `/courses/${enrollment.courseId}/player/${targetLessonId}`
    : `/courses/${enrollment.courseId}`;

  return (
    <Link
      href={href}
      className="group block"
    >
      <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          {enrollment.thumbnailUrl ? (
            <img
              src={enrollment.thumbnailUrl}
              alt={enrollment.courseName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
              <Play className="w-6 h-6 text-gray-900 ml-1 fill-current" />
            </div>
          </div>

          {/* Progress bar */}
          {isInProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
              <div
                className="h-full bg-brand-secondary transition-all"
                style={{ width: `${enrollment.progress}%` }}
              />
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Befejezve
            </div>
          )}

          {/* Course type badge */}
          {enrollment.courseType && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
              {enrollment.courseType === 'MASTERCLASS' && 'Masterclass'}
              {enrollment.courseType === 'WEBINAR' && 'Webinár'}
              {enrollment.courseType === 'ACADEMIA' && 'Akadémia'}
              {enrollment.courseType === 'PODCAST' && 'Podcast'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-brand-secondary transition-colors">
            {enrollment.courseName}
          </h3>

          {enrollment.courseInstructor && (
            <p className="text-sm text-gray-500 mb-2">
              {enrollment.courseInstructor}
            </p>
          )}

          {/* Progress info */}
          <div className="flex items-center justify-between text-sm">
            {isInProgress && (
              <span className="text-brand-secondary font-medium">
                {enrollment.progress}% befejezve
              </span>
            )}
            {isCompleted && (
              <span className="text-green-600 font-medium">
                Befejezve
              </span>
            )}
            {!isInProgress && !isCompleted && (
              <span className="text-gray-400">
                Még nem kezdted el
              </span>
            )}

            {enrollment.duration && (
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {enrollment.duration}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
