'use client'

import { BrowseCoursesSection } from '@/components/dashboard/BrowseCoursesSection'
import { BookOpen } from 'lucide-react'

/**
 * Browse Courses Dashboard
 *
 * Simplified course discovery interface with course catalog
 */

export default function BrowseCoursesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Kurzusok Böngészése
            </h1>
          </div>
          <p className="text-gray-600">
            Fedezze fel az összes elérhető kurzust
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <BrowseCoursesSection />
      </div>
    </div>
  )
}