'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import { Play, Clock, BookOpen, ChevronRight } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'

/**
 * Continue Course Preview Component
 *
 * Displays the user's most recently accessed in-progress course
 * with a preview and call-to-action to continue learning
 */
export function ContinueCoursePreview() {
  const { data: enrollments = [], isLoading } = useEnrollments('in_progress')

  // Get the most recently accessed course
  const currentCourse = enrollments[0]

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-20 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  // If no in-progress courses, show empty state
  if (!currentCourse) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Tanulás folytatása
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mb-2 text-sm font-medium text-gray-900">
            Nincs folyamatban lévő kurzusod
          </p>
          <p className="mb-4 text-sm text-gray-500">
            Kezdj el egy új kurzust vagy folytasd, ahol abbahagytad
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Kurzusok böngészése
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Tanulás folytatása
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Összes →
          </Link>
        </div>
      </div>

      {/* Course Preview */}
      <div className="p-6">
        <div className="flex flex-col gap-6">
          {/* Course Image/Thumbnail */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            {currentCourse.courseId ? (
              <Image
                src={`/images/courses/${currentCourse.courseId}.jpg`}
                alt={currentCourse.courseName}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to placeholder on error
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            ) : null}
            {/* Fallback content when image fails or doesn't exist */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
              <BookOpen className="h-16 w-16 text-white/80" />
            </div>

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                <Play className="h-8 w-8 text-blue-600 fill-blue-600" />
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {currentCourse.courseName}
              </h3>
              <p className="text-sm text-gray-600">
                {currentCourse.courseInstructor}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Haladás</span>
                <span className="font-semibold text-gray-900">
                  {currentCourse.progress}% befejezve
                </span>
              </div>
              <Progress value={currentCourse.progress} className="h-2.5" />
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {currentCourse.lastAccessedAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    Legutóbb: {currentCourse.lastAccessedAt.toLocaleDateString('hu-HU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <Link
              href={`/courses/${currentCourse.courseId}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors w-full"
            >
              <Play className="h-4 w-4" />
              Tanulás folytatása
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
