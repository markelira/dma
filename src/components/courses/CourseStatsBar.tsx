'use client'

import { BookOpen, DollarSign, TrendingUp } from 'lucide-react'

interface CourseStatsBarProps {
  totalCourses: number
  freeCourses: number
  filteredCount: number
}

/**
 * CourseStatsBar component
 * Displays statistics about available courses
 */
export function CourseStatsBar({
  totalCourses,
  freeCourses,
  filteredCount
}: CourseStatsBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Courses */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Összes kurzus</p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
            </div>
          </div>

          {/* Free Courses */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingyenes</p>
              <p className="text-2xl font-bold text-gray-900">{freeCourses}</p>
            </div>
          </div>

          {/* Filtered Results */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Találatok</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
