'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EnrolledCourseCard } from './EnrolledCourseCard';

interface EnrolledCourseCarouselProps {
  title: string;
  icon?: ReactNode;
  enrollments: Array<{
    id: string;
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
  }>;
  categories?: Array<{ id: string; name: string }>;
  instructors?: Array<{ id: string; name: string }>;
}

export function EnrolledCourseCarousel({
  title,
  icon,
  enrollments,
  categories = [],
  instructors = [],
}: EnrolledCourseCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [enrollments]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!enrollments || enrollments.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">({enrollments.length})</span>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Navigation Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {enrollments.map((enrollment, index) => (
            <div
              key={enrollment.id}
              className="flex-shrink-0 w-[280px] md:w-[320px]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <EnrolledCourseCard
                enrollment={enrollment}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
