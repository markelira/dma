'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Play, Info, Clock, BookOpen, Video, GraduationCap, Mic } from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  title?: string;
  profilePictureUrl?: string;
}

interface Lesson {
  id: string;
  title: string;
  type?: 'VIDEO' | 'TEXT' | 'QUIZ' | 'READING';
  duration?: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface NetflixStyleHeroProps {
  title: string;
  description: string;
  categories?: string[];
  imageUrl?: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructors?: Instructor[];
  modules?: Module[];
  onEnroll?: () => void;
  onScrollToDetails?: () => void;
}

const getCourseTypeConfig = (type?: string) => {
  switch (type) {
    case 'ACADEMIA':
      return {
        label: 'Akadémia',
        ctaLabel: 'Akadémia indítása',
        bgColor: 'bg-brand-secondary',
        textColor: 'text-brand-secondary',
        gradientFallback: 'from-brand-secondary to-cyan-600',
        icon: BookOpen,
      };
    case 'WEBINAR':
      return {
        label: 'Webinár',
        ctaLabel: 'Webinár indítása',
        bgColor: 'bg-purple-500',
        textColor: 'text-purple-400',
        gradientFallback: 'from-purple-500 to-purple-700',
        icon: Video,
      };
    case 'MASTERCLASS':
      return {
        label: 'Masterclass',
        ctaLabel: 'Masterclass indítása',
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-400',
        gradientFallback: 'from-amber-500 to-orange-600',
        icon: GraduationCap,
      };
    case 'PODCAST':
      return {
        label: 'Podcast',
        ctaLabel: 'Podcast indítása',
        bgColor: 'bg-green-500',
        textColor: 'text-green-400',
        gradientFallback: 'from-green-500 to-emerald-600',
        icon: Mic,
      };
    default:
      return {
        label: 'Tartalom',
        ctaLabel: 'Tartalom indítása',
        bgColor: 'bg-gray-500',
        textColor: 'text-gray-400',
        gradientFallback: 'from-gray-500 to-gray-700',
        icon: BookOpen,
      };
  }
};

export function NetflixStyleHero({
  title,
  description,
  categories = [],
  imageUrl,
  courseType,
  instructors = [],
  modules = [],
  onEnroll,
  onScrollToDetails,
}: NetflixStyleHeroProps) {
  const config = getCourseTypeConfig(courseType);
  const Icon = config.icon;

  // Calculate total duration and lesson count
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let lessonCount = 0;

    modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lessonCount++;
        if (lesson.duration) {
          totalMinutes += lesson.duration;
        }
      });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let durationText = '';
    if (hours > 0 && minutes > 0) {
      durationText = `${hours} óra ${minutes} perc`;
    } else if (hours > 0) {
      durationText = `${hours} óra`;
    } else if (minutes > 0) {
      durationText = `${minutes} perc`;
    }

    return { durationText, lessonCount, moduleCount: modules.length };
  }, [modules]);

  const instructor = instructors[0];

  return (
    <div className="relative h-[70vh] min-h-[500px] max-h-[700px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${config.gradientFallback}`} />
        )}
        {/* Gradient overlays - Netflix-style heavy darkening */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-gray-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-gray-950/20" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            {/* Course Type Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className={`${config.textColor} font-medium text-sm uppercase tracking-wider`}>
                {config.label}
              </span>
              {categories.length > 0 && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">{categories.join(', ')}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg mb-6 line-clamp-3">
              {description}
            </p>

            {/* Instructor */}
            {instructor && (
              <div className="flex items-center gap-3 mb-4">
                {instructor.profilePictureUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={instructor.profilePictureUrl}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center text-white font-bold`}>
                    {instructor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{instructor.name}</p>
                  {instructor.title && (
                    <p className="text-gray-400 text-sm">{instructor.title}</p>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
              {stats.durationText && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{stats.durationText}</span>
                </div>
              )}
              {stats.lessonCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{stats.lessonCount} lecke</span>
                </div>
              )}
              {stats.moduleCount > 0 && (
                <span>{stats.moduleCount} modul</span>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onEnroll}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                {config.ctaLabel}
              </button>
              <button
                onClick={onScrollToDetails}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                <Info className="w-5 h-5" />
                Részletek
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
