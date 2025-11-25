'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

interface HeroCourseShowcaseProps {
  maxCourses?: number;
}

export function HeroCourseShowcase({ maxCourses = 8 }: HeroCourseShowcaseProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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

  // Fetch featured courses
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('createdAt', 'desc'),
      limit(maxCourses)
    );

    const unsubscribe = onSnapshot(
      coursesQuery,
      (snapshot) => {
        const coursesData: Course[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[];

        setCourses(coursesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching courses:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [maxCourses]);

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
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-8">
        <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
          <div className="h-[500px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-secondary" />
          </div>
        </div>
      </div>
    );
  }

  // Show a message if no courses (instead of returning null)
  if (courses.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-8">
        <div className="bg-gradient-to-br from-brand-secondary/5/60 via-purple-50/40 to-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-secondary/50 to-purple-600 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Kiemelt tartalmak
            </h3>
            <p className="text-base text-gray-600">
              Jelenleg nincsenek elérhető kurzusok. <br />
              Kérjük, adjon hozzá kurzusokat a Firestore adatbázisban.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-white/60 via-white/40 to-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/20 bg-gradient-to-r from-brand-secondary/5/50 to-purple-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Kiemelt tartalmak
              </h2>
              <p className="text-sm font-normal text-gray-600 mt-0.5">
                Fedezd fel a legújabb tananyagokat
              </p>
            </div>
            <a
              href="/courses"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/30 text-gray-700 font-medium hover:bg-white/80 hover:shadow-md transition-all duration-200 text-sm"
            >
              Összes megtekintése
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative group px-6 md:px-8 py-6">
          {/* Navigation Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur-xl shadow-xl border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white hover:scale-105"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur-xl shadow-xl border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white hover:scale-105"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {courses.map((course, index) => (
              <div key={course.id} className="flex-shrink-0 w-[280px] md:w-[320px]">
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
            <a
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/30 text-gray-700 font-medium hover:bg-white/80 hover:shadow-md transition-all duration-200"
            >
              Összes tartalom
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
