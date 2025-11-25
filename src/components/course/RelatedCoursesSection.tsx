'use client';

import React from 'react';
import { motion } from "motion/react";
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard';
import { ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string;
  instructorIds?: string[];
  instructorName?: string;
  category?: string;
  categoryId?: string;
  categoryIds?: string[];
  level: string;
  duration: string;
  rating?: number;
  students?: number;
  enrollmentCount?: number;
  price?: number;
  thumbnailUrl?: string;
  lessons?: number;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS';
}

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface RelatedCoursesSectionProps {
  courses: Course[];
  categories?: Array<{ id: string; name: string }>;
  instructors?: Instructor[];
  title?: string;
}

export function RelatedCoursesSection({
  courses,
  categories,
  instructors,
  title = "Kapcsolódó tartalmak"
}: RelatedCoursesSectionProps) {
  if (!courses || courses.length === 0) return null;

  return (
    <motion.section
      className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 lg:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>
        <button
          className="flex items-center gap-2 text-brand-secondary hover:text-brand-secondary-hover font-bold text-sm transition-colors"
          onClick={() => window.location.href = '/courses'}
        >
          Összes tartalom
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal scrolling carousel */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-6 min-w-min">
          {courses.slice(0, 6).map((course, index) => (
            <div key={course.id} className="flex-shrink-0 w-80">
              <PremiumCourseCard
                course={course}
                index={index}
                categories={categories}
                instructors={instructors}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
