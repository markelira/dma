'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  title: string
  description: string
  category: string | { name: string }
  imageUrl?: string
}

interface CoursesHeroSectionProps {
  searchInput: string
  onSearchChange: (value: string) => void
  totalCourses: number
  courses: Course[]
}

/**
 * CoursesHeroSection component
 * Hero section for the courses listing page with search and autocomplete
 */
export function CoursesHeroSection({
  searchInput,
  onSearchChange,
  totalCourses,
  courses
}: CoursesHeroSectionProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [matchingCourses, setMatchingCourses] = useState<Course[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Filter courses based on search input
  useEffect(() => {
    if (searchInput.trim().length > 0) {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchInput.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchInput.toLowerCase())
      ).slice(0, 5) // Show max 5 suggestions

      setMatchingCourses(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setMatchingCourses([])
      setShowSuggestions(false)
    }
  }, [searchInput, courses])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCourseClick = (courseId: string) => {
    setShowSuggestions(false)
    router.push(`/courses/${courseId}`)
  }

  const handleClearSearch = () => {
    onSearchChange('')
    setShowSuggestions(false)
  }

  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Fedezd fel a tartalmainkat
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {totalCourses} professzionális tartalom közül választhatsz
          </p>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="max-w-2xl mx-auto" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Keress tartalmakat..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => matchingCourses.length > 0 && setShowSuggestions(true)}
              className="form-input w-full pl-12 pr-12 py-4 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Autocomplete Suggestions */}
            {showSuggestions && matchingCourses.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden z-20">
                {matchingCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="w-full px-4 py-3 text-left hover:bg-brand-secondary/5/50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                  >
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-16 h-10 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {typeof course.category === 'string' ? course.category : course.category?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
