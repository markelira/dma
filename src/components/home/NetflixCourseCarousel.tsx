'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions as fbFunctions } from '@/lib/firebase'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'
import { useInstructors } from '@/hooks/useInstructorQueries'

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
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: instructors = [] } = useInstructors()

  // Fetch categories
  useEffect(() => {
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
  }, [])

  // Fetch latest courses
  useEffect(() => {
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

      setCourses(coursesData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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

  return (
    <section className="w-full bg-[rgb(249,250,251)] py-12 md:py-16">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Tartalmaink
          </h2>
          <Link
            href="/courses"
            className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            Összes megtekintése →
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10
                w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full
                opacity-0 group-hover:opacity-100 transition-all duration-300
                hidden md:flex items-center justify-center
                hover:bg-black/90 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          )}

          {/* Scrollable Track */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth -mx-2 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-6 pb-4">
              {loading ? (
                // Loading skeletons
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px]">
                    <div className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
                    <div className="h-5 bg-gray-800 rounded mt-4 w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-800 rounded mt-2 w-1/2 animate-pulse" />
                  </div>
                ))
              ) : (
                courses.map((course, index) => (
                  <div key={course.id} className="flex-shrink-0 w-[280px] md:w-[320px]">
                    <PremiumCourseCard
                      course={course}
                      index={index}
                      categories={categoryObjects}
                      instructors={instructors}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10
                w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full
                opacity-0 group-hover:opacity-100 transition-all duration-300
                hidden md:flex items-center justify-center
                hover:bg-black/90 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          )}
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
