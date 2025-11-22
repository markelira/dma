'use client';

import React from 'react';
import Image from 'next/image';
import { CompactInstructorSection } from './CompactInstructorSection';

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface CourseDetailHeroProps {
  title: string;
  description: string;
  category?: string; // Single category (legacy)
  categories?: string[]; // Multiple categories (NEW)
  level: string;
  rating: number;
  students: number;
  lessons: number;
  imageUrl?: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructors?: Instructor[]; // NEW: Instructor objects
}

export function CourseDetailHero({
  title,
  description,
  category,
  categories,
  level,
  rating,
  students,
  lessons,
  imageUrl,
  courseType,
  instructors = []
}: CourseDetailHeroProps) {
  // Support both single category and multiple categories
  const categoryList = categories && categories.length > 0 ? categories : (category ? [category] : []);

  // Get course type label
  const getCourseTypeLabel = (type?: string) => {
    switch (type) {
      case 'ACADEMIA':
        return 'Akadémia';
      case 'WEBINAR':
        return 'Webinár';
      case 'MASTERCLASS':
        return 'Masterclass';
      case 'PODCAST':
        return 'Podcast';
      default:
        return null;
    }
  };

  const getCourseTypeColor = (type?: string) => {
    switch (type) {
      case 'ACADEMIA':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'WEBINAR':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'MASTERCLASS':
        return 'bg-teal-100 border-teal-300 text-teal-700';
      case 'PODCAST':
        return 'bg-green-100 border-green-300 text-green-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  // Truncate description to 1-2 sentences (approximately 150 characters)
  const getShortDescription = (desc: string) => {
    if (!desc) return '';
    if (desc.length <= 150) return desc;

    // Try to cut at sentence boundary
    const firstSentence = desc.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 150) {
      return firstSentence + '.';
    }

    // Otherwise cut at word boundary
    return desc.substring(0, 147).trim() + '...';
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-blue-50/30 to-purple-50/20 pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
      {/* Subtle background blur shapes */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" aria-hidden="true"></div>
      <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-purple-200/15 rounded-full blur-2xl" aria-hidden="true"></div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          {/* Left Column: Course Info (60% - 3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Course Type Badge */}
            {getCourseTypeLabel(courseType) && (
              <div className="inline-block">
                <div className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 ${getCourseTypeColor(courseType)}`}>
                  {getCourseTypeLabel(courseType)}
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-gray-900">
              {title}
            </h1>

            {/* Short Description / Tagline */}
            <p className="text-lg lg:text-xl text-gray-600 leading-relaxed font-light">
              {getShortDescription(description)}
            </p>

            {/* Category badges - supports multiple */}
            {categoryList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {categoryList.map((cat, idx) => (
                  <div key={idx} className="inline-block bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-gray-200 shadow-sm">
                    {cat}
                  </div>
                ))}
              </div>
            )}

            {/* Compact Instructor Section */}
            {instructors.length > 0 && (
              <div className="pt-6">
                <CompactInstructorSection instructors={instructors} />
              </div>
            )}
          </div>

          {/* Right Column: Course Image (40% - 2 cols) */}
          <div className="lg:col-span-2">
            {imageUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200/50">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200/50 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <div className="text-6xl mb-2">📚</div>
                  <p className="text-sm font-medium">Kurzus kép</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
