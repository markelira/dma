'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard';

interface Course {
  id: string;
  title: string;
  description: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  thumbnailUrl?: string;
  categoryId?: string;
  categoryIds?: string[];
  instructorId?: string;
  instructorIds?: string[];
  lessons?: any[];
  modules?: any[];
  [key: string]: any;
}

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
    userId?: string;
  }>;
  courses?: Course[]; // NEW: Full course objects for PremiumCourseCard
  categories?: Array<{ id: string; name: string }>;
  instructors?: Array<{ id: string; name: string; title?: string; bio?: string; profilePictureUrl?: string }>;
  userId?: string; // NEW: User ID for enrollment detection
}

export function EnrolledCourseCarousel({
  title,
  icon,
  enrollments,
  courses = [],
  categories = [],
  instructors = [],
  userId,
}: EnrolledCourseCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy loading: only render cards when carousel is near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only need to load once
        }
      },
      { rootMargin: '300px' } // Load 300px before visible
    );

    if (visibilityRef.current) {
      observer.observe(visibilityRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (!isVisible) return; // Don't set up scroll listeners until visible
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
  }, [enrollments, isVisible]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!enrollments || enrollments.length === 0) {
    return null;
  }

  // Show placeholder until carousel scrolls into view
  if (!isVisible) {
    return (
      <section ref={visibilityRef} className="mb-8 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">({enrollments.length})</span>
        </div>
        <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  return (
    <section ref={visibilityRef} className="mb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">({enrollments.length})</span>
      </div>

      {/* Carousel */}
      <div className="relative group/carousel">
        {/* Left Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Navigation Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100"
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
          {enrollments.map((enrollment, index) => {
            // Find the full course object for this enrollment
            const fullCourse = courses.find(c => c.id === enrollment.courseId);

            // If no course found, skip this enrollment
            if (!fullCourse) {
              console.warn(`[EnrolledCourseCarousel] Course not found for enrollment: ${enrollment.courseId}`);
              return null;
            }

            return (
              <div
                key={enrollment.id}
                className="flex-shrink-0 w-[280px] md:w-[300px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <PremiumCourseCard
                  course={fullCourse}
                  enrollment={enrollment}
                  showProgress={true}
                  categories={categories}
                  instructors={instructors}
                  userId={userId || enrollment.userId}
                  index={index}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
