'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard';

// Enrollment type for progress tracking
interface Enrollment {
  courseId: string;
  progress?: number;
}

// Course type that's compatible with both the global Course type and PremiumCourseCard
// Using a permissive type to accept any course-like object
interface CourseCarouselRowProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  courses: any[];
  categories?: Array<{ id: string; name: string }>;
  instructors?: Array<{ id: string; name: string; title?: string; profilePictureUrl?: string }>;
  enrollments?: Enrollment[];
  viewAllLink?: string;
  emptyMessage?: string;
}

export function CourseCarouselRow({
  title,
  courses,
  categories = [],
  instructors = [],
  enrollments = [],
  viewAllLink,
  emptyMessage = 'Nincs megjeleníthető tartalom'
}: CourseCarouselRowProps) {
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
  }, [courses, isVisible]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!courses || courses.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </section>
    );
  }

  // Show placeholder until carousel scrolls into view
  if (!isVisible) {
    return (
      <section ref={visibilityRef} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  return (
    <section ref={visibilityRef} className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      {/* Carousel */}
      <div className="relative group/nav">
        {/* Left Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Navigation Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-12 -my-12 pl-12"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {courses.map((course, index) => {
            // Find enrollment for this course to get progress
            const enrollment = enrollments.find(e => e.courseId === course.id);
            const progress = enrollment?.progress;

            return (
              <div
                key={course.id}
                className="flex-shrink-0 w-[280px] md:w-[320px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <PremiumCourseCard
                  course={{
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    instructorId: course.instructorId,
                    instructorIds: course.instructorIds,
                    instructorName: course.instructorName,
                    category: course.category,
                    categoryId: course.categoryId,
                    categoryIds: course.categoryIds,
                    level: course.level || 'Beginner',
                    duration: course.duration || '',
                    rating: course.rating,
                    students: course.students,
                    enrollmentCount: course.enrollmentCount,
                    price: course.price,
                    thumbnailUrl: course.thumbnailUrl,
                    lessons: course.lessons,
                    courseType: course.courseType,
                    contentCreatedAt: course.contentCreatedAt,
                    progress: progress,
                    // Course-level stats for badges (from migration)
                    totalDuration: course.totalDuration,
                    publishedLessonCount: course.publishedLessonCount,
                  }}
                  index={index}
                  categories={categories}
                  instructors={instructors}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
