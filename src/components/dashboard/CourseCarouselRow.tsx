'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard';

// Course type that's compatible with both the global Course type and PremiumCourseCard
// Using a permissive type to accept any course-like object
interface CourseCarouselRowProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  courses: any[];
  categories?: Array<{ id: string; name: string }>;
  instructors?: Array<{ id: string; name: string; title?: string; profilePictureUrl?: string }>;
  viewAllLink?: string;
  emptyMessage?: string;
}

export function CourseCarouselRow({
  title,
  courses,
  categories = [],
  instructors = [],
  viewAllLink,
  emptyMessage = 'Nincs megjeleníthető tartalom'
}: CourseCarouselRowProps) {
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
  }, [courses]);

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

  return (
    <section className="mb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-sm font-medium text-brand-secondary hover:text-brand-secondary/80 flex items-center gap-1 transition-colors"
          >
            Összes
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
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
          {courses.map((course, index) => (
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
                }}
                index={index}
                categories={categories}
                instructors={instructors}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
