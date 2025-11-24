"use client"

import React from 'react'
import { CourseCard } from '@/components/course/CourseCard'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCourseList } from '@/hooks/useCourseQueries'

interface RelatedCoursesSectionProps {
  currentCourseId: string
  currentCourseCategory?: string
  currentCourseInstructorId?: string
}

export function RelatedCoursesSection({ 
  currentCourseId, 
  currentCourseCategory, 
  currentCourseInstructorId 
}: RelatedCoursesSectionProps) {
  // Fetch related courses using the same API as /courses page
  const { data: relatedCoursesData, isLoading } = useCourseList({
    limit: 4,
    status: 'PUBLISHED',
    categoryId: currentCourseCategory ? undefined : undefined, // We'll filter by category if available
    sort: 'popular',
    order: 'desc'
  })

  const relatedCourses = relatedCoursesData?.courses || []

  // Filter out the current course from related courses
  const filteredRelatedCourses = relatedCourses.filter(course => course.id !== currentCourseId)

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Kapcsolódó tartalmak
            </h2>
            <p className="text-gray-600">
              Folytassa a tanulást hasonló tartalmakkal
            </p>
          </div>
          <Link 
            href="/courses"
            className="flex items-center gap-2 text-[#0f766e] hover:text-[#0f766e]/80 transition-colors font-medium"
          >
            <span>Összes tartalom</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && filteredRelatedCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRelatedCourses.map((course) => (
              <div key={course.id} className="fade-in">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}

        {/* Mobile Horizontal Scroll Fallback */}
        {!isLoading && filteredRelatedCourses.length > 0 && (
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {filteredRelatedCourses.map((course) => (
                <div key={course.id} className="flex-shrink-0 w-80">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRelatedCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nincs elérhető kapcsolódó tartalom</p>
          </div>
        )}
      </div>
    </section>
  )
} 