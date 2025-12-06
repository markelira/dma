'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from "motion/react"
import { BookOpen, Video, GraduationCap, Mic, ChevronLeft, ChevronRight } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'
import { CoursesHeroSection } from '@/components/courses/CoursesHeroSection'
import { useInstructors } from '@/hooks/useInstructorQueries'

const COURSE_TYPE_ICONS: Record<string, any> = {
  ACADEMIA: GraduationCap,
  WEBINAR: Video,
  MASTERCLASS: BookOpen,
  PODCAST: Mic,
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
}

const COURSE_TYPE_DESCRIPTIONS: Record<string, string> = {
  ACADEMIA: 'Hosszú, több leckéből álló képzés videókkal',
  WEBINAR: 'Egyszeri, 1 videós alkalom erőforrásokkal',
  MASTERCLASS: 'Átfogó, több modulból álló mestertartalom',
  PODCAST: 'Egyszeri podcast epizód audio- vagy videótartalommal',
}

const COURSE_TYPE_GRADIENTS: Record<string, string> = {
  ACADEMIA: 'from-brand-secondary/50 to-brand-secondary',
  WEBINAR: 'from-purple-500 to-purple-600',
  MASTERCLASS: 'from-teal-500 to-teal-600',
  PODCAST: 'from-green-500 to-green-600',
}

interface Course {
  id: string
  title: string
  description: string
  instructorId?: string
  instructorIds?: string[]
  instructorName?: string
  categoryId?: string
  categoryIds?: string[]
  category?: string
  targetAudienceIds?: string[]
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price?: number
  thumbnailUrl?: string
  lessons?: number
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
  createdAt?: any
  tags?: string[]
}

interface CourseCarouselSectionProps {
  title: string
  description: string
  courses: Course[]
  courseType: string
  categories: any[]
  instructors: any[]
  viewAllLink: string
}

function CourseCarouselSection({
  title,
  description,
  courses,
  courseType,
  categories,
  instructors,
  viewAllLink,
}: CourseCarouselSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const Icon = COURSE_TYPE_ICONS[courseType]
  const gradient = COURSE_TYPE_GRADIENTS[courseType]

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
      <div className="flex items-center justify-between mb-6 px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm font-normal text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <a
          href={viewAllLink}
          className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/20 text-gray-700 text-sm font-medium hover:bg-white/80 hover:shadow-md transition-all duration-200"
        >
          Összes megtekintése
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Carousel */}
      <div className="relative group px-6 lg:px-12">
        {/* Navigation Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-xl shadow-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white ml-6 lg:ml-12"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-xl shadow-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white mr-6 lg:mr-12"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
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
        <div className="md:hidden mt-6 text-center">
          <a
            href={viewAllLink}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/20 text-gray-700 text-sm font-medium hover:bg-white/80 hover:shadow-md transition-all duration-200"
          >
            Összes {title}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [targetAudiences, setTargetAudiences] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTargetAudience, setSelectedTargetAudience] = useState('')
  const { data: instructors = [] } = useInstructors()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const getCategories = httpsCallable(fbFunctions, 'getCategories')
        const result: any = await getCategories()
        if (result.data?.success && result.data?.categories) {
          // Fix sorrend: Ügyvezetés, HR, Marketing, Értékesítés, Működés
          const CATEGORY_ORDER = ['Ügyvezetés', 'HR', 'Marketing', 'Értékesítés', 'Működés'];
          const sorted = [...result.data.categories].sort((a: any, b: any) => {
            const indexA = CATEGORY_ORDER.indexOf(a.name);
            const indexB = CATEGORY_ORDER.indexOf(b.name);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          setCategories(sorted)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch target audiences
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'targetAudiences'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name as string
        }))
        setTargetAudiences(data)
      },
      (error) => {
        console.error('Error fetching target audiences:', error)
      }
    )
    return () => unsubscribe()
  }, [])

  // Fetch all courses (no status filter - just like webinar page)
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[]

      console.log('✅ Fetched courses:', coursesData.length)
      console.log('📊 Courses by type:', {
        ACADEMIA: coursesData.filter(c => c.courseType === 'ACADEMIA').length,
        WEBINAR: coursesData.filter(c => c.courseType === 'WEBINAR').length,
        MASTERCLASS: coursesData.filter(c => c.courseType === 'MASTERCLASS').length,
        PODCAST: coursesData.filter(c => c.courseType === 'PODCAST').length,
      })

      setCourses(coursesData)
      setLoading(false)
    }, (error) => {
      console.error('❌ Error fetching courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Apply filters and organize courses by type
  const filteredCoursesByType = useMemo(() => {
    let filtered = courses

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(c => {
        // Check categoryIds array
        if (c.categoryIds?.includes(selectedCategory)) return true
        // Check categoryId field
        if (c.categoryId === selectedCategory) return true
        return false
      })
    }

    // Apply target audience filter
    if (selectedTargetAudience) {
      filtered = filtered.filter(c =>
        c.targetAudienceIds?.includes(selectedTargetAudience)
      )
    }

    return {
      ACADEMIA: filtered.filter(c => c.courseType === 'ACADEMIA'),
      WEBINAR: filtered.filter(c => c.courseType === 'WEBINAR'),
      MASTERCLASS: filtered.filter(c => c.courseType === 'MASTERCLASS'),
      PODCAST: filtered.filter(c => c.courseType === 'PODCAST'),
    }
  }, [courses, selectedCategory, selectedTargetAudience])

  // Check if all filtered sections are empty
  const hasFilteredResults = useMemo(() => {
    return (
      filteredCoursesByType.ACADEMIA.length > 0 ||
      filteredCoursesByType.WEBINAR.length > 0 ||
      filteredCoursesByType.MASTERCLASS.length > 0 ||
      filteredCoursesByType.PODCAST.length > 0
    )
  }, [filteredCoursesByType])

  const hasActiveFilters = selectedCategory || selectedTargetAudience

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)
    const categoryCount = new Set(courses.map(c => c.categoryId || c.category)).size
    return {
      totalCourses: courses.length,
      totalStudents,
      categoryCount,
    }
  }, [courses])

  if (loading) {
    return (
      <>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-[rgb(249,250,251)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-200 border-t-brand-secondary" />
            <p className="text-base font-normal text-gray-600">Tartalmak betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </>
    )
  }

  return (
    <>
      <FramerNavbarWrapper />

      <div className="w-full min-h-screen bg-[rgb(249,250,251)] overflow-x-hidden">
        {/* Hero Section with Search & Filters */}
        <CoursesHeroSection
          courses={courses}
          categories={categories}
          targetAudiences={targetAudiences}
          selectedCategory={selectedCategory}
          selectedTargetAudience={selectedTargetAudience}
          onCategoryChange={setSelectedCategory}
          onTargetAudienceChange={setSelectedTargetAudience}
          onClearFilters={() => {
            setSelectedCategory('')
            setSelectedTargetAudience('')
          }}
        />

        {/* Course Carousels */}
        <div className="py-12">
          {/* Show carousels only if there are filtered results */}
          {hasFilteredResults ? (
            <>
              {/* Academia Carousel */}
              <CourseCarouselSection
                title={COURSE_TYPE_LABELS.ACADEMIA}
                description={COURSE_TYPE_DESCRIPTIONS.ACADEMIA}
                courses={filteredCoursesByType.ACADEMIA}
                courseType="ACADEMIA"
                categories={categories}
                instructors={instructors}
                viewAllLink="/akadémia"
              />

              {/* Webinar Carousel */}
              <CourseCarouselSection
                title={COURSE_TYPE_LABELS.WEBINAR}
                description={COURSE_TYPE_DESCRIPTIONS.WEBINAR}
                courses={filteredCoursesByType.WEBINAR}
                courseType="WEBINAR"
                categories={categories}
                instructors={instructors}
                viewAllLink="/webinar"
              />

              {/* Masterclass Carousel */}
              <CourseCarouselSection
                title={COURSE_TYPE_LABELS.MASTERCLASS}
                description={COURSE_TYPE_DESCRIPTIONS.MASTERCLASS}
                courses={filteredCoursesByType.MASTERCLASS}
                courseType="MASTERCLASS"
                categories={categories}
                instructors={instructors}
                viewAllLink="/masterclass"
              />

              {/* Podcast Carousel */}
              <CourseCarouselSection
                title={COURSE_TYPE_LABELS.PODCAST}
                description={COURSE_TYPE_DESCRIPTIONS.PODCAST}
                courses={filteredCoursesByType.PODCAST}
                courseType="PODCAST"
                categories={categories}
                instructors={instructors}
                viewAllLink="/podcast"
              />
            </>
          ) : (
            /* Empty State for Filters */
            <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-12">
              <motion.div
                className="flex flex-col items-center justify-center py-16 px-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {hasActiveFilters
                    ? 'Nem található tartalom a kiválasztott szűrőkkel'
                    : 'Nincsenek elérhető tartalmak'}
                </h3>
                <p className="text-sm font-normal text-gray-600 text-center mb-4">
                  {hasActiveFilters
                    ? 'Próbálj más szűrőket választani'
                    : 'Jelenleg nincsenek közzétett tartalmak'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setSelectedTargetAudience('')
                    }}
                    className="px-6 py-2 text-sm font-medium text-brand-secondary hover:text-brand-secondary-hover bg-brand-secondary/10 hover:bg-brand-secondary/20 rounded-lg transition-all"
                  >
                    Szűrők törlése
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </div>

      </div>

      <Footer border={true} />
    </>
  )
}
