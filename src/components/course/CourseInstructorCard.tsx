'use client';

import React from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { CourseType } from '@/types';

interface CourseInstructorCardProps {
  name: string;
  title?: string;
  bio: string;
  imageUrl?: string;
  stats?: {
    students: number;
    courses: number;
    rating: number;
    reviews: number;
  };
  expertise?: string[];
  /** Role label based on course type (e.g., "Mentor", "Vendég") */
  roleLabel?: string;
  /** Instructor's role from the instructors collection */
  instructorRole?: 'MENTOR' | 'SZEREPLŐ';
  /** Dark mode styling */
  darkMode?: boolean;
}

export function CourseInstructorCard({
  name,
  title,
  bio,
  imageUrl,
  roleLabel = 'Oktató',
  instructorRole,
  darkMode = false
}: CourseInstructorCardProps) {
  // Use instructor's actual role if available, otherwise use the passed roleLabel
  const displayRole = instructorRole
    ? (instructorRole === 'SZEREPLŐ' ? 'Vendég' : 'Mentor')
    : roleLabel;

  // Dark mode styles
  const containerClass = darkMode
    ? 'py-6 border-b border-gray-800'
    : 'bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8';

  const headingClass = darkMode ? 'text-white' : 'text-gray-900';
  const titleClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const bioClass = darkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <motion.section
      className={containerClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className={`text-2xl font-bold ${headingClass} mb-6`}>
        {displayRole}
      </h2>

      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-secondary to-brand-secondary/50 flex items-center justify-center text-white text-2xl font-bold">
              {name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className={`text-xl font-bold ${headingClass}`}>{name}</h3>
          {title && <p className={`${titleClass} mb-3`}>{title}</p>}

          <p className={`${bioClass}`}>{bio}</p>
        </div>
      </div>
    </motion.section>
  );
}
