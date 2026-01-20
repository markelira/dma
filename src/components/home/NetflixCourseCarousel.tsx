'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions as fbFunctions } from '@/lib/firebase'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { shuffleArray } from '@/lib/utils'

interface Course {
  id: string
  title: string
  description?: string
  instructorId?: string
  instructorIds?: string[]
  instructorName?: string
  category?: string
  categoryId?: string
  categoryIds?: string[]
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price?: number
  thumbnailUrl?: string
  lessons?: number
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
  contentCreatedAt?: string
  createdAt?: any
  tags?: string[]
}

export function NetflixCourseCarousel() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryObjects, setCategoryObjects] = useState<Array<{ id: string; name: string }>>([])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const visibilityRef = useRef<HTMLDivElement>(null)

  const { data: instructors = [] } = useInstructors()

  // Lazy loading: only fetch and render when carousel is near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    if (visibilityRef.current) {
      observer.observe(visibilityRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Fetch categories - only when visible
  useEffect(() => {
    if (!isVisible) return

    const fetchCategories = async () => {
      try {
        const getCategories = httpsCallable(fbFunctions, 'getCategories')
        const result: any = await getCategories()

        if (result.data?.success && result.data?.categories) {
          setCategoryObjects(result.data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategoryObjects([])
      }
    }

    fetchCategories()
  }, [isVisible])

  // Fetch latest courses - only when visible
  useEffect(() => {
    if (!isVisible) return

    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('createdAt', 'desc'),
      limit(12)
    )

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[]

      setCourses(shuffleArray(coursesData))
      setLoading(false)
    }, (error) => {
      console.error('Error fetching courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isVisible])

  // Scroll navigation
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 340
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  // Update scroll button states
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', handleScroll)
      handleScroll()
      return () => el.removeEventListener('scroll', handleScroll)
    }
  }, [courses])

  if (!loading && courses.length === 0) {
    return null
  }

  // Show placeholder until carousel scrolls into view
  if (!isVisible) {
    return (
      <section ref={visibilityRef} className="w-full bg-[rgb(249,250,251)] py-10 sm:py-12 md:py-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Tartalmaink
            </h2>
          </div>
          <div className="h-[420px] flex items-center justify-center bg-gray-100 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={visibilityRef} className="w-full bg-[rgb(249,250,251)] py-10 sm:py-12 md:py-14">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Tartalmaink
          </h2>
          <Link
            href="/courses"
            className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            Összes megtekintése →
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group/nav">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10
                w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full
                opacity-0 group-hover/nav:opacity-100 transition-all duration-300
                hidden md:flex items-center justify-center
                hover:bg-black/90 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          )}

          {/* Scrollable Track */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto overflow-y-visible py-6 scrollbar-hide scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              // Loading skeletons
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px] h-[360px]" style={{ scrollSnapAlign: 'start' }}>
                  <div className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
                  <div className="h-5 bg-gray-800 rounded mt-4 w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded mt-2 w-1/2 animate-pulse" />
                </div>
              ))
            ) : (
              courses.map((course, index) => (
                <div key={course.id} className="flex-shrink-0 w-[280px] md:w-[320px] h-[360px]" style={{ scrollSnapAlign: 'start' }}>
                  <PremiumCourseCard
                    course={course}
                    index={index}
                    categories={categoryObjects}
                    instructors={instructors}
                    priority={index < 4} // Prioritize first 4 images for LCP
                  />
                </div>
              ))
            )}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10
                w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full
                opacity-0 group-hover/nav:opacity-100 transition-all duration-300
                hidden md:flex items-center justify-center
                hover:bg-black/90 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          )}
        </div>

        {/* Mobile View All Link */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white rounded-xl font-medium hover:bg-brand-secondary-hover transition-colors"
          >
            Összes megtekintése
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-secondary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-brand-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Hamarosan érkeznek új tartalmak
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Kövess minket, hogy értesülj az új kurzusokról!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
