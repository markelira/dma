'use client';

import React from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface CourseInstructorCardProps {
  name: string;
  title?: string;
  bio: string;
  imageUrl?: string;
  stats: {
    students: number;
    courses: number;
    rating: number;
    reviews: number;
  };
  expertise: string[];
}

export function CourseInstructorCard({
  name,
  title,
  bio,
  imageUrl,
  stats,
  expertise
}: CourseInstructorCardProps) {
  return (
    <motion.section
      className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Oktatód
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          {title && <p className="text-gray-600 mb-3">{title}</p>}

          <p className="text-gray-700 mb-4">{bio}</p>

          {expertise && expertise.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {expertise.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
