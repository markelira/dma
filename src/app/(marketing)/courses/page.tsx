'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from "motion/react"
import { BookOpen, Video, GraduationCap, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { CourseStatsBar } from '@/components/courses/CourseStatsBar'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'
import { useInstructors } from '@/hooks/useInstructorQueries'

const COURSE_TYPE_ICONS: Record<string, any> = {
  ACADEMIA: GraduationCap,
  WEBINAR: Video,
  MASTERCLASS: BookOpen,
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
}

const COURSE_TYPE_DESCRIPTIONS: Record<string, string> = {
  ACADEMIA: 'Hosszú, több leckéből álló képzés videókkal',
  WEBINAR: 'Egyszeri, 1 videós alkalom erőforrásokkal',
  MASTERCLASS: 'Átfogó, több modulból álló mesterkurzus',
}

const COURSE_TYPE_GRADIENTS: Record<string, string> = {
  ACADEMIA: 'from-blue-500 to-blue-600',
  WEBINAR: 'from-purple-500 to-purple-600',
  MASTERCLASS: 'from-teal-500 to-teal-600',
}

interface Course {
  id: string
  title: string
  description: string
  instructorId?: string
  instructorName?: string
  categoryId?: string
  category?: string
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price?: number
  thumbnailUrl?: string
  lessons?: number
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS'
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
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <a
          href={viewAllLink}
          className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/20 text-gray-700 font-semibold hover:bg-white/80 hover:shadow-md transition-all duration-200"
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/20 text-gray-700 font-semibold hover:bg-white/80 hover:shadow-md transition-all duration-200"
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
  const [searchInput, setSearchInput] = useState('')
  const { data: instructors = [] } = useInstructors()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const getCategories = httpsCallable(fbFunctions, 'getCategories')
        const result: any = await getCategories()
        if (result.data?.success && result.data?.categories) {
          setCategories(result.data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
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
      })

      setCourses(coursesData)
      setLoading(false)
    }, (error) => {
      console.error('❌ Error fetching courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Organize courses by type
  const coursesByType = useMemo(() => {
    return {
      ACADEMIA: courses.filter(c => c.courseType === 'ACADEMIA'),
      WEBINAR: courses.filter(c => c.courseType === 'WEBINAR'),
      MASTERCLASS: courses.filter(c => c.courseType === 'MASTERCLASS'),
    }
  }, [courses])

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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/30 to-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-200 border-t-purple-600" />
            <p className="text-lg text-gray-600">Kurzusok betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </>
    )
  }

  return (
    <>
      <FramerNavbarWrapper />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/30 to-gray-50 relative overflow-hidden">
        {/* Background blur shapes */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" aria-hidden="true"></div>
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-blue-100/20 rounded-full blur-2xl" aria-hidden="true"></div>
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/20 rounded-full blur-3xl" aria-hidden="true"></div>

        {/* Hero Section */}
        <div className="relative pt-20 pb-16 px-6 lg:px-12">
          <div className="container mx-auto max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Fedezd fel kurzusainkat
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Akadémiák, webináriumok és mesterkurzusok szakértő oktatóinktól.
                Válaszd ki a számodra legmegfelelőbb tanulási formát.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Keress kurzusok között..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-full border-2 border-white/50 bg-white/60 backdrop-blur-xl shadow-lg focus:outline-none focus:border-purple-500 transition-all text-gray-900 placeholder-gray-500"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Bar */}
        <CourseStatsBar
          totalCourses={stats.totalCourses}
          categoriesCount={stats.categoryCount}
          filteredCount={stats.totalCourses}
          courseType="ALL"
        />

        {/* Course Carousels */}
        <div className="py-12">
          {/* Academia Carousel */}
          <CourseCarouselSection
            title={COURSE_TYPE_LABELS.ACADEMIA}
            description={COURSE_TYPE_DESCRIPTIONS.ACADEMIA}
            courses={coursesByType.ACADEMIA}
            courseType="ACADEMIA"
            categories={categories}
            instructors={instructors}
            viewAllLink="/akadémia"
          />

          {/* Webinar Carousel */}
          <CourseCarouselSection
            title={COURSE_TYPE_LABELS.WEBINAR}
            description={COURSE_TYPE_DESCRIPTIONS.WEBINAR}
            courses={coursesByType.WEBINAR}
            courseType="WEBINAR"
            categories={categories}
            instructors={instructors}
            viewAllLink="/webinar"
          />

          {/* Masterclass Carousel */}
          <CourseCarouselSection
            title={COURSE_TYPE_LABELS.MASTERCLASS}
            description={COURSE_TYPE_DESCRIPTIONS.MASTERCLASS}
            courses={coursesByType.MASTERCLASS}
            courseType="MASTERCLASS"
            categories={categories}
            instructors={instructors}
            viewAllLink="/masterclass"
          />

          {/* Empty State */}
          {courses.length === 0 && (
            <div className="container mx-auto px-6 lg:px-12 py-20">
              <motion.div
                className="flex flex-col items-center justify-center py-20 px-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Nincsenek elérhető kurzusok
                </h3>
                <p className="text-gray-600 text-center">
                  Jelenleg nincsenek közzétett kurzusok
                </p>
              </motion.div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        {courses.length > 0 && (
          <section className="relative py-20 overflow-hidden mt-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600" />
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />

            <div className="container mx-auto px-6 lg:px-12 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto text-center"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Kezdd el még ma a tanulást
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Csatlakozz több ezer diákunkhoz és fejleszd karrieredet világszínvonalú oktatásunkkal
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-white text-gray-900 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  >
                    Ingyenes regisztráció
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 hover:bg-white/20 transition-all duration-200"
                  >
                    Árazás megtekintése
                  </a>
                </div>
              </motion.div>
            </div>
          </section>
        )}
      </div>

      <Footer border={true} />
    </>
  )
}
