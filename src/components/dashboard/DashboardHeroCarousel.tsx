'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Info, ChevronLeft, ChevronRight, BookOpen, Video, GraduationCap, Mic, Clock } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructorName?: string;
  instructorImageUrl?: string;
  duration?: string;
  progress?: number; // 0-100, only for enrolled courses
  isEnrolled?: boolean;
  currentLessonId?: string;
  firstLessonId?: string;
}

interface DashboardHeroCarouselProps {
  slides: HeroSlide[];
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

export function DashboardHeroCarousel({ slides }: DashboardHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  if (!slides || slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];
  const config = getCourseTypeConfig(currentSlide.courseType);
  const Icon = config.icon;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleContinue = () => {
    // For enrolled courses, go directly to course player with resume lesson
    if (currentSlide.isEnrolled) {
      const lessonId = currentSlide.currentLessonId || currentSlide.firstLessonId;
      if (lessonId) {
        router.push(`/courses/${currentSlide.id}/player/${lessonId}`);
        return;
      }
    }
    // Fallback to course detail page
    router.push(`/courses/${currentSlide.id}`);
  };

  const handleDetails = () => {
    router.push(`/courses/${currentSlide.id}`);
  };

  return (
    <div className="relative h-[50vh] min-h-[400px] max-h-[500px] rounded-2xl overflow-hidden">
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {currentSlide.thumbnailUrl ? (
            <Image
              src={currentSlide.thumbnailUrl}
              alt={currentSlide.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${config.gradientFallback}`} />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative h-full flex items-end z-10">
        <div className="p-6 md:p-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl"
            >
              {/* Course Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className={`${config.textColor} font-medium text-sm uppercase tracking-wider`}>
                  {config.label}
                </span>
                {currentSlide.isEnrolled && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-green-400 text-sm">Beiratkozva</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight line-clamp-2">
                {currentSlide.title}
              </h1>

              {/* Description */}
              {currentSlide.description && (
                <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-2">
                  {currentSlide.description}
                </p>
              )}

              {/* Instructor & Stats */}
              <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                {currentSlide.instructorName && (
                  <span>{currentSlide.instructorName}</span>
                )}
                {currentSlide.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentSlide.duration}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar (for enrolled courses) */}
              {currentSlide.isEnrolled && currentSlide.progress !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Haladás</span>
                    <span>{currentSlide.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-secondary rounded-full transition-all"
                      style={{ width: `${currentSlide.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {currentSlide.isEnrolled ? 'Folytatás' : config.ctaLabel}
                </button>
                <button
                  onClick={handleDetails}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700/80 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-sm"
                >
                  <Info className="w-4 h-4" />
                  Részletek
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot Indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-6'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
