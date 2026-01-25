'use client';

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import type { Instructor } from '@/types';

interface PreviewInstructorProps {
  /** Single instructor or array of instructors */
  instructors: Instructor[];
  /** Role label to display (overrides instructor role) */
  roleLabel?: string;
  /** Course type for determining default role label */
  courseType?: 'ACADEMIA' | 'WEBINAR' | 'MASTERCLASS' | 'PODCAST';
  /** Dark mode styling */
  darkMode?: boolean;
}

/**
 * Get display role based on course type or instructor role
 */
function getRoleLabel(instructor: Instructor, courseType?: string): string {
  // Podcast uses "Szereplő", all others use "Mentor"
  if (courseType === 'PODCAST' || instructor.role === 'SZEREPLŐ') {
    return 'Szereplő';
  }
  return 'Mentor';
}

/**
 * Truncate bio to a maximum length with ellipsis
 */
function truncateBio(bio: string | undefined, maxLength: number = 150): string {
  if (!bio) return '';
  if (bio.length <= maxLength) return bio;
  return bio.slice(0, maxLength).trim() + '...';
}

/**
 * Single instructor card
 */
function InstructorCard({
  instructor,
  courseType,
  roleLabel,
  darkMode,
}: {
  instructor: Instructor;
  courseType?: string;
  roleLabel?: string;
  darkMode?: boolean;
}) {
  const displayRole = roleLabel || getRoleLabel(instructor, courseType);

  return (
    <div className="flex gap-4 items-start">
      {/* Profile picture */}
      <div className={`w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        {instructor.profilePictureUrl ? (
          <Image
            src={instructor.profilePictureUrl}
            alt={instructor.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            darkMode ? 'bg-brand-secondary/20' : 'bg-blue-100'
          }`}>
            <User className={`w-8 h-8 ${darkMode ? 'text-brand-secondary' : 'text-blue-600'}`} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium uppercase tracking-wide mb-0.5 ${
          darkMode ? 'text-brand-secondary' : 'text-blue-600'
        }`}>
          {displayRole}
        </div>
        <h4 className={`font-semibold line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {instructor.name}
        </h4>
        {(instructor.title || instructor.company) && (
          <p className={`text-sm line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {instructor.company && instructor.title
              ? `${instructor.company}, ${instructor.title}`
              : instructor.title || instructor.company}
          </p>
        )}
        {instructor.bio && (
          <p className={`text-sm mt-2 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {truncateBio(instructor.bio)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * PreviewInstructor - Display instructor(s) in the course preview modal
 */
export function PreviewInstructor({
  instructors,
  roleLabel,
  courseType,
  darkMode = false,
}: PreviewInstructorProps) {
  if (!instructors || instructors.length === 0) {
    return null;
  }

  // Single instructor
  if (instructors.length === 1) {
    return (
      <InstructorCard
        instructor={instructors[0]}
        courseType={courseType}
        roleLabel={roleLabel}
        darkMode={darkMode}
      />
    );
  }

  // Multiple instructors - grid layout
  return (
    <div className="space-y-4">
      {instructors.map((instructor) => (
        <InstructorCard
          key={instructor.id}
          instructor={instructor}
          courseType={courseType}
          roleLabel={roleLabel}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
}
