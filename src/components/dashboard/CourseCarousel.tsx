'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarouselCourseCard } from './CarouselCourseCard';
import { useCoursesCatalog } from '@/hooks/useCoursesCatalog';

interface CourseCarouselProps {
  courseType: 'webinar' | 'akademia' | 'masterclass' | 'podcast';
  title: string;
}

export function CourseCarousel({ courseType, title }: CourseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useCoursesCatalog({
    limit: 12,
  });

  const allCourses = data?.courses || [];
  const courses = allCourses.filter((course: any) => course.courseType === courseType);

  const cardsPerView = 4;
  const maxIndex = Math.max(0, courses.length - cardsPerView);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - cardsPerView));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + cardsPerView));
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-md border border-gray-100 p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>

          {courses.length > cardsPerView && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentIndex === 0
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentIndex >= maxIndex
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 overflow-hidden">
        <div className="relative">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            animate={{ x: -currentIndex * (100 / cardsPerView) + '%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {courses.map((course: any) => (
              <div key={course.id} className="min-w-0">
                <CarouselCourseCard
                  id={course.id}
                  title={course.title}
                  instructor={
                    course.instructor
                      ? `${course.instructor.firstName} ${course.instructor.lastName}`
                      : 'Ismeretlen oktato'
                  }
                  thumbnailUrl={course.thumbnailUrl}
                  courseType={courseType}
                  duration={course.duration}
                  enrolled={course.isEnrolled}
                  enrollmentCount={course.enrollmentCount}
                  progress={course.progress}
                  contentCreatedAt={course.contentCreatedAt}
                />
              </div>
            ))}
          </motion.div>
        </div>

        {courses.length > cardsPerView && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(courses.length / cardsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * cardsPerView)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  Math.floor(currentIndex / cardsPerView) === index
                    ? 'w-8 bg-brand-secondary'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
