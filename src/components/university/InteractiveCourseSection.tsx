'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, BookOpen, ChevronDown } from 'lucide-react'

interface PublicCourse {
  id: string
  title: string
  slug?: string
  thumbnailUrl?: string | null
  description?: string
  instructor?: {
    name?: string // New format: single name field
    firstName?: string // Legacy format
    lastName?: string // Legacy format
    title?: string
  }
  rating?: number
  enrollmentCount?: number
  duration?: number
  difficulty?: string
  category?: string
}

interface InteractiveCourseSectionProps {
  courses: PublicCourse[]
  universityName: string
}

function CourseCardSmall({ course }: { course: PublicCourse }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="bg-white rounded-lg shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group"
    >
      <div className="relative h-40 bg-gray-200 rounded-t-lg overflow-hidden">
        {course.thumbnailUrl ? (
          <Image 
            src={course.thumbnailUrl} 
            alt={course.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-2xl">
            {course.title.charAt(0).toUpperCase()}
          </div>
        )}
        {course.difficulty && (
          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
            {course.difficulty}
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold line-clamp-2 flex-1 mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        
        {course.instructor && (
          <p className="text-xs text-gray-600 mb-2">
            {course.instructor.name || `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim()}
            {course.instructor.title && ` - ${course.instructor.title}`}
          </p>
        )}
        
        {course.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.description}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          {course.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
          {course.enrollmentCount && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{course.enrollmentCount}</span>
            </div>
          )}
          {course.duration && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{course.duration}h</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function CourseSkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-card flex flex-col animate-pulse">
      <div className="h-40 bg-gray-200 rounded-t-lg"></div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
        <div className="flex items-center justify-between mt-auto">
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  )
}

export function InteractiveCourseSection({ courses, universityName }: InteractiveCourseSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Extract unique categories with course counts
  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = {}
    courses.forEach(course => {
      if (course.category) {
        const categoryName = typeof course.category === 'string' ? course.category : (course.category as any)?.name
        if (categoryName) {
          stats[categoryName] = (stats[categoryName] || 0) + 1
        }
      }
    })
    return stats
  }, [courses])

  const categories = Object.keys(categoryStats).sort()

  // Filter courses based on selected category
  const filteredCourses = useMemo(() => {
    if (!selectedCategory) return courses
    return courses.filter(course => {
      const categoryName = typeof course.category === 'string' ? course.category : (course.category as any)?.name
      return categoryName === selectedCategory
    })
  }, [courses, selectedCategory])

  const featuredCourses = filteredCourses.slice(0, 4)

  const handleCategoryChange = async (category: string) => {
    setIsLoading(true)
    setSelectedCategory(category)
    // Simulate loading for smooth UX
    await new Promise(resolve => setTimeout(resolve, 300))
    setIsLoading(false)
  }

  return (
    <div className="space-y-10">
      {/* Course Filter */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Kurzusok böngészése</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCategoryChange('')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === '' 
                    ? 'bg-primary text-white shadow-lg scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <span>Összes kurzus</span>
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {courses.length}
                </span>
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category 
                      ? 'bg-primary text-white shadow-lg scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <span>{category}</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {categoryStats[category]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="bg-gray-50 py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">
              {selectedCategory ? `Kiemelt ${selectedCategory} kurzusok` : 'Kiemelt kurzusok'}
            </h2>
            {isLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="min-w-[280px]">
                    <CourseSkeletonCard />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {featuredCourses.map((course) => (
                  <div key={course.id} className="min-w-[280px]">
                    <CourseCardSmall course={course} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Courses Grid */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-semibold mb-4 md:mb-0">
            {selectedCategory ? `${selectedCategory} kurzusok` : 'Az összes kurzus'}
            <span className="text-gray-500 text-lg ml-2">
              ({filteredCourses.length})
            </span>
          </h2>
        </div>
        
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <p className="text-gray-600 text-lg mb-2">
              {selectedCategory 
                ? `Nincsenek elérhető kurzusok a "${selectedCategory}" kategóriában.`
                : 'Még nincsenek elérhető kurzusok.'
              }
            </p>
            {selectedCategory && (
              <button
                onClick={() => handleCategoryChange('')}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Összes kurzus megtekintése
              </button>
            )}
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <CourseSkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCardSmall key={course.id} course={course} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}