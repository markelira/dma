'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  CheckCircle, Clock, Play, Eye, Infinity, Shield, ChevronDown, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface Lesson {
  id: string;
  title: string;
  type?: 'VIDEO' | 'TEXT' | 'QUIZ' | 'READING';
  duration?: number; // in minutes
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Hero1Props {
  title: string;
  description: string;
  categories?: string[];
  imageUrl?: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructors?: Instructor[];
  keyOutcomes?: string[];
  price?: number;
  isSubscriptionIncluded?: boolean;
  modules?: Module[]; // For calculating real duration
  onEnroll?: () => void;
  onPreview?: () => void;
}

export function Hero1ConversionFocused({
  title,
  description,
  categories = [],
  imageUrl,
  courseType,
  instructors = [],
  keyOutcomes = [],
  price,
  isSubscriptionIncluded = true,
  modules = [],
  onEnroll,
  onPreview
}: Hero1Props) {

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
      case 'ACADEMIA': return 'bg-brand-secondary/10 border-brand-secondary/30 text-brand-secondary-hover';
      case 'WEBINAR': return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'MASTERCLASS': return 'bg-teal-100 border-teal-300 text-teal-700';
      case 'PODCAST': return 'bg-green-100 border-green-300 text-green-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  // Calculate total duration from video lessons
  const totalDuration = useMemo(() => {
    if (!modules || modules.length === 0) return null;

    let totalMinutes = 0;
    modules.forEach(module => {
      module.lessons.forEach(lesson => {
        if (lesson.type === 'VIDEO' && lesson.duration) {
          totalMinutes += lesson.duration;
        }
      });
    });

    if (totalMinutes === 0) return null;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} óra ${minutes} perc`;
    } else if (hours > 0) {
      return `${hours} óra`;
    } else {
      return `${minutes} perc`;
    }
  }, [modules]);

  // Truncate description to 2 lines (~140 characters for 2 lines at text-lg)
  const shouldShowMore = description.length > 140;
  const displayDescription = !isDescriptionExpanded && shouldShowMore
    ? description.substring(0, 140).trim() + '...'
    : description;

  const defaultOutcomes = keyOutcomes.length > 0 ? keyOutcomes : [
    'Gyakorlati projektek valós környezetben',
    'Szakmai tanúsítvány megszerzése',
    'Életre szóló tudás és készségek'
  ];

  return (
    <div className="bg-white">
      {/* Main Hero Section */}
      <div className="container mx-auto px-6 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Left Column - Content (55%) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Course Type Badge */}
            {getCourseTypeLabel(courseType) && (
              <div className="inline-block">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getCourseTypeColor(courseType)}`}>
                  {getCourseTypeLabel(courseType)}
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-gray-900 tracking-tight">
              {title}
            </h1>

            {/* Description - Collapsible */}
            <div className="space-y-2">
              <p className="text-base text-gray-700 leading-relaxed">
                {displayDescription}
              </p>
              {shouldShowMore && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-1 text-sm font-medium text-brand-secondary hover:text-brand-secondary-hover transition-colors"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Kevesebb
                      <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
                    </>
                  ) : (
                    <>
                      Több
                      <ChevronDown className="w-4 h-4 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Key Outcomes */}
            {defaultOutcomes.length > 0 && (
              <div className="space-y-3">
                {defaultOutcomes.slice(0, 3).map((outcome, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{outcome}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Instructor Mini Cards */}
            {instructors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {instructors.map((instructor, idx) => (
                  <div key={instructor.id || idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {instructor.profilePictureUrl ? (
                      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={instructor.profilePictureUrl}
                          alt={instructor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-secondary to-brand-secondary/50 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {instructor.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600">{instructors.length > 1 ? 'Mentor' : 'Mentor'}</p>
                      <p className="font-bold text-gray-900">{instructor.name}</p>
                      {instructor.title && (
                        <p className="text-sm text-gray-600 truncate">{instructor.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata Row - Duration + Course Type */}
            <div className="flex items-center gap-6 flex-wrap text-sm text-gray-700">
              {totalDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span>{totalDuration} videó tartalom</span>
                </div>
              )}
              {getCourseTypeLabel(courseType) && (
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${getCourseTypeColor(courseType)}`}>
                    {getCourseTypeLabel(courseType)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sticky Card (45%) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Course Image/Video */}
                {imageUrl ? (
                  <div className="relative aspect-video bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    <button className="absolute inset-0 flex items-center justify-center group">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-brand-secondary ml-1" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="relative aspect-video bg-gradient-to-br from-brand-secondary/10 to-purple-100 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-brand-secondary opacity-40" />
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  {/* Price */}
                  {isSubscriptionIncluded ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Előfizetésed része</p>
                      <p className="text-3xl font-bold text-gray-900">Korlátlan hozzáférés</p>
                    </div>
                  ) : price ? (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{price.toLocaleString('hu-HU')} Ft</p>
                      <p className="text-sm text-gray-600">Egyszeri díj</p>
                    </div>
                  ) : null}

                  {/* Primary CTA */}
                  <Button
                    onClick={onEnroll}
                    className="w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 hover:shadow-xl text-white font-bold py-4 text-lg rounded-lg transition-all hover:scale-[1.02]"
                  >
                    <Infinity className="w-5 h-5 mr-2" />
                    Beiratkozás most
                  </Button>

                  {/* Secondary CTA */}
                  {onPreview && (
                    <Button
                      onClick={onPreview}
                      variant="outline"
                      className="w-full border-2 border-gray-300 py-3"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Előnézet megtekintése
                    </Button>
                  )}

                  {/* Trust Indicators */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span>30 napos pénzvisszafizetési garancia</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Infinity className="w-5 h-5 text-brand-secondary" />
                      <span>Élethosszig tartó hozzáférés</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
