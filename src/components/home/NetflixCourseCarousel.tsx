'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, Play, Plus, Info, BookOpen } from 'lucide-react'
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

const typeColors: Record<string, { bg: string; text: string }> = {
  WEBINAR: { bg: 'bg-purple-600', text: 'text-purple-400' },
  ACADEMIA: { bg: 'bg-blue-600', text: 'text-blue-400' },
  MASTERCLASS: { bg: 'bg-amber-600', text: 'text-amber-400' },
  PODCAST: { bg: 'bg-green-600', text: 'text-green-400' },
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
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Scroll navigation - scroll by visible width
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const containerWidth = scrollRef.current.clientWidth
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -containerWidth : containerWidth,
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

  // Handle hover with delay (Netflix style)
  const handleMouseEnter = (id: string) => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(id)
    }, 500) // 500ms delay before expand
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredId(null)
  }

  if (!loading && courses.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-[#141414] py-8 md:py-12">
      {/* Row Header - Netflix style */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-[4%] mb-2">
        <Link
          href="/courses"
          className="group inline-flex items-center gap-1"
        >
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-[#e5e5e5] group-hover:text-white transition-colors">
            Legújabb tartalmak
          </h2>
          <span className="text-[#54b9c5] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            Összes megtekintése
          </span>
          <ChevronRight className="w-4 h-4 text-[#54b9c5] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Carousel Container - Netflix edge-to-edge */}
      <div className="relative group/row">
        {/* Left Arrow - Netflix tall edge arrow */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-0 z-20 w-[4%] min-w-[40px]
            bg-gradient-to-r from-[#141414]/80 to-transparent
            flex items-center justify-center
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-300
            ${!canScrollLeft ? 'invisible' : ''}
            hover:from-[#141414]`}
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-[4%]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-1 md:gap-2 py-6">
            {loading ? (
              // Loading skeletons - Netflix shimmer style
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[calc(100%/2-4px)] sm:w-[calc(100%/3-6px)] md:w-[calc(100%/4-6px)] lg:w-[calc(100%/5-6px)] xl:w-[calc(100%/6-6px)]">
                  <div className="aspect-video bg-[#2f2f2f] rounded-sm animate-pulse" />
                </div>
              ))
            ) : (
              courses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex-shrink-0 w-[calc(100%/2-4px)] sm:w-[calc(100%/3-6px)] md:w-[calc(100%/4-6px)] lg:w-[calc(100%/5-6px)] xl:w-[calc(100%/6-6px)] relative"
                  onMouseEnter={() => handleMouseEnter(course.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={`/courses/${course.id}`}
                    className="block relative"
                  >
                    {/* Base Card */}
                    <motion.div
                      className="relative aspect-video rounded-sm overflow-hidden bg-[#2f2f2f]"
                      animate={{
                        scale: hoveredId === course.id ? 1.3 : 1,
                        zIndex: hoveredId === course.id ? 30 : 1,
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        transformOrigin: index === 0 ? 'left center' : index === courses.length - 1 ? 'right center' : 'center center'
                      }}
                    >
                      {/* Thumbnail */}
                      {course.thumbnailUrl ? (
                        <Image
                          src={course.thumbnailUrl}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a] flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-600" />
                        </div>
                      )}

                      {/* Netflix Logo/Badge - top left */}
                      {course.courseType && (
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${typeColors[course.courseType]?.bg || 'bg-gray-600'}`}>
                          {typeLabels[course.courseType]?.[0] || 'C'}
                        </div>
                      )}

                      {/* Expanded Content - Netflix style info card */}
                      <AnimatePresence>
                        {hoveredId === course.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-x-0 -bottom-[100px] bg-[#181818] rounded-b-md shadow-2xl p-3"
                          >
                            {/* Action Buttons Row */}
                            <div className="flex items-center gap-2 mb-2">
                              {/* Play Button */}
                              <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors">
                                <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                              </button>
                              {/* Add to List */}
                              <button className="w-8 h-8 rounded-full border-2 border-[#8c8c8c] flex items-center justify-center hover:border-white transition-colors">
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                              {/* More Info - pushed right */}
                              <button className="w-8 h-8 rounded-full border-2 border-[#8c8c8c] flex items-center justify-center hover:border-white transition-colors ml-auto">
                                <Info className="w-4 h-4 text-white" />
                              </button>
                            </div>

                            {/* Title */}
                            <h3 className="text-white font-bold text-sm line-clamp-1 mb-1">
                              {course.title}
                            </h3>

                            {/* Meta Info */}
                            <div className="flex items-center gap-2 text-xs">
                              {/* Course Type Tag */}
                              <span className={typeColors[course.courseType || '']?.text || 'text-gray-400'}>
                                {typeLabels[course.courseType || ''] || 'Tartalom'}
                              </span>
                              {/* Duration */}
                              {course.duration && (
                                <>
                                  <span className="text-[#8c8c8c]">•</span>
                                  <span className="text-[#bcbcbc]">{course.duration}</span>
                                </>
                              )}
                            </div>

                            {/* Instructor */}
                            {getInstructorName(course) && (
                              <p className="text-[#8c8c8c] text-xs mt-1 line-clamp-1">
                                {getInstructorName(course)}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Arrow - Netflix tall edge arrow */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-0 z-20 w-[4%] min-w-[40px]
            bg-gradient-to-l from-[#141414]/80 to-transparent
            flex items-center justify-center
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-300
            ${!canScrollRight ? 'invisible' : ''}
            hover:from-[#141414]`}
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </section>
  )
}
