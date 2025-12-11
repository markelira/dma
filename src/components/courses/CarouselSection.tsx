'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Video, BookOpen, GraduationCap, Mic } from 'lucide-react'
import { PremiumCourseCard } from './PremiumCourseCard'
import type { Course } from '@/types'

interface Instructor {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Enrollment {
  courseId: string
  progress: number
}

interface CarouselSectionProps {
  title: string
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST' | 'ALL'
  courses: Course[]
  categories: Category[]
  instructors: Instructor[]
  enrollments?: Enrollment[]
  viewAllLink?: string
  backgroundColor?: 'light' | 'dark'
}

const TYPE_CONFIG = {
  WEBINAR: {
    icon: Video,
    gradient: 'from-purple-500 to-purple-600',
    color: 'purple-500',
  },
  ACADEMIA: {
    icon: BookOpen,
    gradient: 'from-blue-500 to-blue-600',
    color: 'blue-500',
  },
  MASTERCLASS: {
    icon: GraduationCap,
    gradient: 'from-amber-500 to-amber-600',
    color: 'amber-500',
  },
  PODCAST: {
    icon: Mic,
    gradient: 'from-green-500 to-green-600',
    color: 'green-500',
  },
  ALL: {
    icon: BookOpen,
    gradient: 'from-brand-secondary to-purple-600',
    color: 'brand-secondary',
  },
}

export function CarouselSection({
  title,
  courseType = 'ALL',
  courses,
  categories,
  instructors,
  enrollments = [],
  viewAllLink,
  backgroundColor = 'light',
}: CarouselSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const config = TYPE_CONFIG[courseType]
  const Icon = config.icon
  const isDark = backgroundColor === 'dark'

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [courses])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (!courses || courses.length === 0) return null

  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
          </div>
        </div>
        {viewAllLink && (
          <a
            href={viewAllLink}
            className={`hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-xl border text-sm font-medium hover:shadow-md transition-all duration-200 ${
              isDark
                ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                : 'bg-white/60 border-white/20 text-gray-700 hover:bg-white/80'
            }`}
          >
            Összes megtekintése
            <ChevronRight className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Carousel */}
      <div
        className="relative px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full shadow-xl border flex items-center justify-center transition-opacity duration-200 ml-4 sm:ml-5 md:ml-6 lg:ml-12 xl:ml-20 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            } ${
              isDark
                ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                : 'bg-white/90 border-white/20 text-gray-700 hover:bg-white'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full shadow-xl border flex items-center justify-center transition-opacity duration-200 mr-4 sm:mr-5 md:mr-6 lg:mr-12 xl:mr-20 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            } ${
              isDark
                ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                : 'bg-white/90 border-white/20 text-gray-700 hover:bg-white'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map((course, index) => (
            <div key={course.id} className="flex-shrink-0 w-[300px] md:w-[340px]">
              <PremiumCourseCard
                course={course}
                index={index}
                categories={categories}
                instructors={instructors}
              />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        {viewAllLink && (
          <div className="md:hidden mt-6 text-center">
            <a
              href={viewAllLink}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-xl border text-sm font-medium hover:shadow-md transition-all duration-200 ${
                isDark
                  ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                  : 'bg-white/60 border-white/20 text-gray-700 hover:bg-white/80'
              }`}
            >
              Összes {title}
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
