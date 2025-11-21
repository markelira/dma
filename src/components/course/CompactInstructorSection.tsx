'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface CompactInstructorSectionProps {
  instructors: Instructor[];
}

export function CompactInstructorSection({ instructors }: CompactInstructorSectionProps) {
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  if (!instructors || instructors.length === 0) return null;

  const toggleBio = (instructorId: string) => {
    const newExpanded = new Set(expandedBios);
    if (expandedBios.has(instructorId)) {
      newExpanded.delete(instructorId);
    } else {
      newExpanded.add(instructorId);
    }
    setExpandedBios(newExpanded);
  };

  const truncateBio = (bio: string, isExpanded: boolean) => {
    if (!bio) return '';
    if (isExpanded || bio.length <= 120) return bio;
    return bio.substring(0, 120) + '...';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-base font-bold text-gray-900">
          {instructors.length > 1 ? 'Oktatók' : 'Oktató'}
        </span>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instructors.map((instructor) => {
          const isExpanded = expandedBios.has(instructor.id);
          const hasBio = instructor.bio && instructor.bio.length > 0;
          const shouldTruncate = hasBio && instructor.bio!.length > 120;

          return (
            <div
              key={instructor.id}
              className="flex gap-3 items-start p-4 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md transition-all duration-200 border border-gray-200/50"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {instructor.profilePictureUrl ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                    <Image
                      src={instructor.profilePictureUrl}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm mb-0.5 truncate">
                  {instructor.name}
                </h4>
                {instructor.title && (
                  <p className="text-xs text-gray-600 mb-1.5 font-medium">{instructor.title}</p>
                )}
                {hasBio && (
                  <div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {truncateBio(instructor.bio!, isExpanded)}
                    </p>
                    {shouldTruncate && (
                      <button
                        onClick={() => toggleBio(instructor.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-1.5"
                      >
                        {isExpanded ? 'Kevesebb' : 'Több'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
