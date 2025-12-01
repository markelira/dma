'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { db, functions as fbFunctions } from '@/lib/firebase';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard';
import { useInstructors } from '@/hooks/useInstructorQueries';

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string;
  instructorName?: string;
  categoryId?: string;
  category?: string;
  level: string;
  duration: string;
  rating?: number;
  students?: number;
  enrollmentCount?: number;
  price?: number;
  thumbnailUrl?: string;
  lessons?: number;
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  createdAt?: any;
  tags?: string[];
}

type CourseType = 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';

interface CourseCarouselProps {
  courses: Course[];
  categories: Array<{ id: string; name: string }>;
  instructors: any[];
  courseType: CourseType;
  title: string;
}

function CourseCarousel({ courses, categories, instructors, courseType, title }: CourseCarouselProps) {
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

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 md:mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h3>
        <Link
          href={`/courses?type=${courseType.toLowerCase()}`}
          className="hidden md:inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          Összes megtekintése
          <span>→</span>
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Navigation Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 hover:scale-105"
            aria-label="Scroll left"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 hover:scale-105"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map((course, index) => (
            <div key={course.id} className="flex-shrink-0 w-[280px] md:w-[300px]">
              <PremiumCourseCard
                course={course}
                index={index}
                categories={categories}
                instructors={instructors}
              />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="md:hidden mt-4 text-center">
          <Link
            href={`/courses?type=${courseType.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            Összes megtekintése
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AllCoursesShowcase() {
  const [coursesByType, setCoursesByType] = useState<Record<CourseType, Course[]>>({
    MASTERCLASS: [],
    WEBINAR: [],
    ACADEMIA: [],
    PODCAST: [],
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const { data: instructors = [] } = useInstructors();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const getCategories = httpsCallable(fbFunctions, 'getCategories');
        const result: any = await getCategories();
        if (result.data?.success && result.data?.categories) {
          setCategories(result.data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch courses for each type
  useEffect(() => {
    const courseTypes: CourseType[] = ['MASTERCLASS', 'WEBINAR', 'ACADEMIA', 'PODCAST'];
    const unsubscribes: (() => void)[] = [];

    courseTypes.forEach((courseType) => {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('courseType', '==', courseType),
        orderBy('createdAt', 'desc'),
        limit(8)
      );

      const unsubscribe = onSnapshot(
        coursesQuery,
        (snapshot) => {
          const coursesData: Course[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Course[];

          setCoursesByType((prev) => ({
            ...prev,
            [courseType]: coursesData,
          }));
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching ${courseType} courses:`, error);
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-[rgb(249,250,251)] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#E72B36]" />
          </div>
        </div>
      </section>
    );
  }

  const hasAnyCourses = Object.values(coursesByType).some((courses) => courses.length > 0);

  if (!hasAnyCourses) {
    return null;
  }

  return (
    <section className="w-full bg-[rgb(249,250,251)] pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-[-0.01em]">
            Tartalmaink
          </h2>
          <Link
            href="/courses"
            className="hidden md:inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Összes megtekintése
            <span className="text-lg">→</span>
          </Link>
        </div>

        {/* Course Type Carousels */}
        <CourseCarousel
          courses={coursesByType.MASTERCLASS}
          categories={categories}
          instructors={instructors}
          courseType="MASTERCLASS"
          title="Masterclass-ok"
        />

        <CourseCarousel
          courses={coursesByType.WEBINAR}
          categories={categories}
          instructors={instructors}
          courseType="WEBINAR"
          title="Webinárok"
        />

        <CourseCarousel
          courses={coursesByType.ACADEMIA}
          categories={categories}
          instructors={instructors}
          courseType="ACADEMIA"
          title="Akadémiák"
        />

        <CourseCarousel
          courses={coursesByType.PODCAST}
          categories={categories}
          instructors={instructors}
          courseType="PODCAST"
          title="Podcastok"
        />
      </div>
    </section>
  );
}
