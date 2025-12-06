'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Star, BookOpen, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface Hero2Props {
  title: string;
  description: string;
  transformationStatement?: string;
  categories?: string[];
  level: string;
  rating: number;
  students: number;
  lessons: number;
  imageUrl?: string;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructors?: Instructor[];
  onEnroll?: () => void;
}

export function Hero2ImmersiveStorytelling({
  title,
  description,
  transformationStatement,
  courseType,
  rating,
  students,
  lessons,
  imageUrl,
  instructors = [],
  onEnroll
}: Hero2Props) {

  const getCourseTypeLabel = (type?: string) => {
    switch (type) {
      case 'ACADEMIA': return 'Akadémia';
      case 'WEBINAR': return 'Webinár';
      case 'MASTERCLASS': return 'Masterclass';
      case 'PODCAST': return 'Podcast';
      default: return 'Tartalom';
    }
  };

  const getCourseTypeColor = (type?: string) => {
    switch (type) {
      case 'ACADEMIA': return 'bg-brand-secondary/10/20 border-brand-secondary/30/30 text-brand-secondary-light';
      case 'WEBINAR': return 'bg-purple-100/20 border-purple-300/30 text-purple-100';
      case 'MASTERCLASS': return 'bg-teal-100/20 border-teal-300/30 text-teal-100';
      case 'PODCAST': return 'bg-green-100/20 border-green-300/30 text-green-100';
      default: return 'bg-white/10 border-white/20 text-white';
    }
  };

  const defaultTransformation = transformationStatement ||
    `Válj ${courseType === 'MASTERCLASS' ? 'szakértővé' : 'profivá'} ${lessons > 20 ? '12' : '8'} hét alatt`;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-width Background Image with Parallax */}
      <div className="absolute inset-0 z-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-brand-secondary-hover to-purple-900"></div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/70"></div>

        {/* Animated Blur Shapes */}
        <motion.div
          className="pointer-events-none absolute top-20 right-20 w-96 h-96 bg-brand-secondary/50/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-20 left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Centered Glassmorphic Floating Card */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-10 lg:p-14 space-y-8">

            {/* Course Type Badge - Centered */}
            {getCourseTypeLabel(courseType) && (
              <div className="flex justify-center">
                <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getCourseTypeColor(courseType)}`}>
                  {getCourseTypeLabel(courseType)}
                </div>
              </div>
            )}

            {/* Title - Large and Centered */}
            <h1 className="text-6xl lg:text-8xl font-bold text-white text-center leading-[1.1] tracking-tight">
              {title}
            </h1>

            {/* Transformation Statement */}
            <p className="text-2xl lg:text-3xl text-white/90 text-center font-light leading-relaxed">
              {defaultTransformation}
            </p>

            {/* Instructors Section - Centered */}
            {instructors.length > 0 && (
              <div className="flex flex-wrap justify-center gap-8 py-6">
                {instructors.map((instructor, idx) => (
                  <div key={instructor.id || idx} className="flex flex-col items-center gap-4">
                    {instructor.profilePictureUrl ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/20">
                        <Image
                          src={instructor.profilePictureUrl}
                          alt={instructor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-secondary/50 to-purple-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/20">
                        {instructor.name.charAt(0)}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{instructor.name}</p>
                      {instructor.title && (
                        <p className="text-sm text-white/80 mt-1">{instructor.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compact Stats Row - Centered and Inline */}
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm lg:text-base text-white/90 font-medium">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>

              <div className="w-1 h-1 bg-white/40 rounded-full"></div>

              <div className="flex items-center gap-1.5">
                <Users className="w-5 h-5" />
                <span>{students.toLocaleString('hu-HU')} hallgató</span>
              </div>

              <div className="w-1 h-1 bg-white/40 rounded-full"></div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-5 h-5" />
                <span>12 óra</span>
              </div>

              <div className="w-1 h-1 bg-white/40 rounded-full"></div>

              <div className="flex items-center gap-1.5">
                <BookOpen className="w-5 h-5" />
                <span>{lessons} lecke</span>
              </div>
            </div>

            {/* CTA - Large and Centered */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                onClick={onEnroll}
                className="bg-white text-gray-900 hover:bg-gray-50 font-bold text-lg px-10 py-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
                size="lg"
              >
                Kezdd el most
              </Button>
              <p className="text-sm text-white/70">7 napos ingyenes próba</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </motion.div>
      </div>
    </div>
  );
}
