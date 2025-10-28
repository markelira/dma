'use client';

import React from 'react';
import { Star, Users, Clock, BarChart } from 'lucide-react';
import Image from 'next/image';

interface CourseDetailHeroProps {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  rating: number;
  students: number;
  lessons: number;
  imageUrl?: string;
}

export function CourseDetailHero({
  title,
  description,
  category,
  level,
  duration,
  rating,
  students,
  lessons,
  imageUrl
}: CourseDetailHeroProps) {
  return (
    <section className="bg-gradient-to-br from-primary to-primary-hover text-white py-16 lg:py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Course Info */}
          <div>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-4">
              {category}
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {title}
            </h1>

            <p className="text-lg text-white/90 mb-6">
              {description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{students.toLocaleString('hu-HU')} hallgató</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                <span className="capitalize">{level}</span>
              </div>
            </div>
          </div>

          {/* Right: Course Image */}
          {imageUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
