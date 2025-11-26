'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Play, BookOpen } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { useInstructors } from '@/hooks/useInstructorQueries'

interface Course {
  id: string
  title: string
  description?: string
  instructorId?: string
  instructorIds?: string[]
  duration?: string
  thumbnailUrl?: string
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
  createdAt?: any
}

const typeColors: Record<string, string> = {
  WEBINAR: 'bg-purple-500/90 text-white',
  ACADEMIA: 'bg-blue-500/90 text-white',
  MASTERCLASS: 'bg-amber-500/90 text-white',
  PODCAST: 'bg-green-500/90 text-white',
}

const typeLabels: Record<string, string> = {
  WEBINAR: 'Webinár',
  ACADEMIA: 'Akadémia',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
}

export function NetflixCourseCarousel() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: instructors = [] } = useInstructors()

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

  // Get instructor name
  const getInstructorName = (course: Course): string => {
    const instructorId = course.instructorIds?.[0] || course.instructorId
    if (!instructorId) return ''
    const instructor = instructors.find(i => i.id === instructorId)
    return instructor?.name || ''
  }

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
    <section className="w-full bg-gray-950 py-12 md:py-16">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Legújabb tartalmak
          </h2>
          <Link
            href="/courses"
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Összes megtekintése →
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10
              w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full
              opacity-0 group-hover:opacity-100 transition-all duration-300
              hidden md:flex items-center justify-center
              hover:bg-black/90 hover:scale-110
              ${!canScrollLeft ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Scrollable Track */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4 pb-4">
              {loading ? (
                // Loading skeletons
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px]">
                    <div className="aspect-video bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-5 bg-gray-800 rounded mt-3 w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-800 rounded mt-2 w-1/2 animate-pulse" />
                  </div>
                ))
              ) : (
                courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-shrink-0 w-[280px] md:w-[320px] group/card block"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-gray-600" />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Course Type Badge */}
                        {course.courseType && (
                          <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded ${typeColors[course.courseType] || 'bg-gray-500/90 text-white'}`}>
                            {typeLabels[course.courseType] || course.courseType}
                          </span>
                        )}

                        {/* Duration */}
                        {course.duration && (
                          <span className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-black/70 text-white rounded">
                            {course.duration}
                          </span>
                        )}

                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-gray-900 fill-current ml-1" />
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-white font-semibold line-clamp-2 group-hover/card:text-brand-secondary transition-colors duration-200">
                        {course.title}
                      </h3>

                      {/* Instructor */}
                      {getInstructorName(course) && (
                        <p className="text-gray-400 text-sm mt-1">
                          {getInstructorName(course)}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10
              w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full
              opacity-0 group-hover:opacity-100 transition-all duration-300
              hidden md:flex items-center justify-center
              hover:bg-black/90 hover:scale-110
              ${!canScrollRight ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </section>
  )
}
