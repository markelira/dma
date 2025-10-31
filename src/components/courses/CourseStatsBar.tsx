'use client'

import { motion } from 'motion/react'
import { BookOpen, Folders, TrendingUp } from 'lucide-react'

interface CourseStatsBarProps {
  totalCourses: number
  categoriesCount: number
  filteredCount: number
}

/**
 * CourseStatsBar component
 * Displays statistics about available courses
 */
export function CourseStatsBar({
  totalCourses,
  categoriesCount,
  filteredCount
}: CourseStatsBarProps) {
  return (
    <div className="relative py-6 border-b border-gray-200/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl">
            {/* Total Courses */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Összes kurzus</p>
                <p className="text-2xl font-semibold text-gray-900">{totalCourses}</p>
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Folders className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Kategóriák</p>
                <p className="text-2xl font-semibold text-gray-900">{categoriesCount}</p>
              </div>
            </motion.div>

            {/* Filtered Results */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Találatok</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredCount}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
