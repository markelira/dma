'use client'

import React from 'react'
import Link from 'next/link'
import { Star, Users, Clock } from 'lucide-react'
import { useRecommendedCourses } from '@/hooks/useRecommendedCourses'

/**
 * Recommended Courses Component
 *
 * Displays personalized course recommendations
 * Fetches real data from Firestore based on popularity
 * Excludes courses the user is already enrolled in
 */
export function RecommendedCourses() {
  const { data: courses = [], isLoading, error } = useRecommendedCourses(3)
  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="h-6 w-40 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
          Ajánlott kurzusok
        </h2>
        <Link
          href="/courses"
          className="text-sm font-medium text-brand-secondary hover:text-brand-secondary-light"
        >
          Összes →
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 p-4 text-sm text-red-400">
          Hiba történt a kurzusok betöltése közben. {error instanceof Error ? error.message : 'Ismeretlen hiba'}
        </div>
      )}

      <div className="space-y-3">
        {courses.length === 0 && !error ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Jelenleg nincs elérhető kurzus ajánlat.
            {error && <p className="mt-2 text-xs">{error instanceof Error ? error.message : ''}</p>}
          </div>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="block rounded-lg border border-gray-800 p-4 transition-all hover:border-gray-700 hover:bg-gray-800/50"
            >
              {/* Course Title */}
              <h3 className="font-bold text-white text-sm mb-2 line-clamp-2">
                {course.title}
              </h3>

              {/* Instructor */}
              <p className="text-xs text-gray-400 mb-3">{course.instructor}</p>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-white">{course.rating}</span>
                </div>

                {/* Enrolled Count */}
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{course.enrolledCount.toLocaleString('hu-HU')}</span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{course.duration}</span>
                </div>
              </div>

              {/* Category Badge */}
              {course.category && (
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-brand-secondary-hover/30 text-brand-secondary rounded">
                    {course.category}
                  </span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* CTA Button */}
      <Link
        href="/courses"
        className="mt-4 block w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-center text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      >
        További kurzusok felfedezése
      </Link>
    </div>
  )
}
