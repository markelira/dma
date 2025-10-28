'use client'

import { Search } from 'lucide-react'

interface CoursesHeroSectionProps {
  searchInput: string
  onSearchChange: (value: string) => void
  totalCourses: number
}

/**
 * CoursesHeroSection component
 * Hero section for the courses listing page with search
 */
export function CoursesHeroSection({
  searchInput,
  onSearchChange,
  totalCourses
}: CoursesHeroSectionProps) {
  return (
    <section
      className="py-20 px-4"
      style={{ background: 'linear-gradient(to bottom, #16222F 0%, #466C95 100%)' }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fedezd fel a kurzusainkat
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {totalCourses} professzionális kurzus közül választhatsz
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Keress kurzusokat..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
