'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Star, Users, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface Hero3Props {
  title: string;
  description: string;
  categories?: string[];
  level: string;
  rating: number;
  students: number;
  lessons: number;
  recommendationPercent?: number;
  imageUrl?: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructors?: Instructor[];
  onEnroll?: () => void;
  onPreview?: () => void;
}

export function Hero3CleanEfficient({
  title,
  description,
  categories = [],
  level,
  rating,
  students,
  lessons,
  recommendationPercent = 96,
  imageUrl,
  courseType,
  instructors = [],
  onEnroll,
  onPreview
}: Hero3Props) {

  const getCourseTypeLabel = (type?: string) => {
    switch (type) {
      case 'ACADEMIA': return 'Akadémia';
      case 'WEBINAR': return 'Webinár';
      case 'MASTERCLASS': return 'Masterclass';
      case 'PODCAST': return 'Podcast';
      default: return null;
    }
  };

  const getCourseTypeColor = (type?: string) => {
    switch (type) {
      case 'ACADEMIA': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'WEBINAR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MASTERCLASS': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'PODCAST': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const instructor = instructors[0];

  // Truncate description to 2 lines max (~160 chars)
  const shortDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return (
    <div className="bg-gray-50 min-h-[600px] flex items-center">
      <div className="container mx-auto px-6 lg:px-12 py-16">

        {/* Breadcrumb - Small and Muted */}
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <a href="/" className="hover:text-gray-700">Főoldal</a>
            <span>/</span>
            <a href="/courses" className="hover:text-gray-700">Tartalmak</a>
            {categories[0] && (
              <>
                <span>/</span>
                <span className="text-gray-700">{categories[0]}</span>
              </>
            )}
          </div>
        </nav>

        {/* Main Grid - Asymmetric 2:1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column - Content (66%) */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >

            {/* Inline Badges - Small and Muted */}
            <div className="flex items-center gap-2 flex-wrap">
              {getCourseTypeLabel(courseType) && (
                <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getCourseTypeColor(courseType)}`}>
                  {getCourseTypeLabel(courseType)}
                </span>
              )}
              {categories[0] && (
                <span className="px-2 py-1 text-xs font-medium rounded-md border bg-gray-100 text-gray-700 border-gray-200">
                  {categories[0]}
                </span>
              )}
              <span className="px-2 py-1 text-xs font-medium rounded-md border bg-gray-100 text-gray-700 border-gray-200">
                {level}
              </span>
            </div>

            {/* Title - Large and Bold */}
            <h1 className="text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              {title}
            </h1>

            {/* Description - 2 lines max */}
            <p className="text-xl text-gray-600 leading-relaxed">
              {shortDescription}
            </p>

            {/* Social Proof Row - Inline */}
            <div className="flex items-center gap-5 flex-wrap text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                <span className="text-gray-600">({Math.floor(students * 0.3)} értékelés)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900">{students.toLocaleString('hu-HU')}</span>
                <span className="text-gray-600">hallgató</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900">{recommendationPercent}%</span>
                <span className="text-gray-600">ajánlja</span>
              </div>
            </div>

            {/* Instructor Inline - Minimal */}
            {instructor && (
              <div className="flex items-center gap-3">
                {instructor.profilePictureUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={instructor.profilePictureUrl}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {instructor.name.charAt(0)}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{instructor.name}</span>
                  <span className="text-gray-600"> · Oktató</span>
                </div>
              </div>
            )}

            {/* Metadata Chips - Inline */}
            <div className="flex items-center gap-3 flex-wrap text-sm text-gray-700">
              <div className="flex items-center gap-1.5">
                <span>🕐</span>
                <span>12 óra</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1.5">
                <span>📚</span>
                <span>{lessons} lecke</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1.5">
                <span>🌐</span>
                <span>Magyar</span>
              </div>
            </div>

            {/* CTA Row - Inline Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={onEnroll}
                className="bg-gradient-to-t from-blue-600 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Beiratkozás
              </Button>
              {onPreview && (
                <Button
                  onClick={onPreview}
                  variant="ghost"
                  className="text-gray-700 hover:bg-gray-100 px-6 py-3"
                >
                  Előnézet
                </Button>
              )}
            </div>
          </motion.div>

          {/* Right Column - Image (33%) */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {imageUrl ? (
              <div className="relative aspect-video rounded-xl shadow-lg ring-1 ring-gray-900/5 overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl shadow-lg ring-1 ring-gray-900/5 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
