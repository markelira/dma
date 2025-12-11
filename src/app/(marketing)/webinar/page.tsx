'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from "motion/react"
import { Video, Play } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { AuthProvider } from '@/contexts/AuthContext'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { SimpleFilterBar } from '@/components/courses/SimpleFilterBar'
import { CarouselSection } from '@/components/courses/CarouselSection'
import { CrossTypeNavigation } from '@/components/courses/CrossTypeNavigation'
import { useInstructors } from '@/hooks/useInstructorQueries'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string
  instructorName?: string
  category: string
  categoryIds?: string[]
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price: number
  thumbnailUrl?: string
  lessons?: number
  createdAt?: any
  tags?: string[]
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
}

export default function WebinarPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryObjects, setCategoryObjects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fetch instructors using React Query
  const { data: instructors = [] } = useInstructors()

  // Fetch categories from Cloud Function
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

  // Fetch WEBINAR courses only from Firestore
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('courseType', '==', 'WEBINAR'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[]

      setCourses(coursesData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching webinar courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter courses based on category and search
  const filteredCourses = useMemo(() => {
    let filtered = courses

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c =>
        c.categoryIds?.includes(selectedCategory) || c.category === selectedCategory
      )
    }

    if (searchQuery.length >= 2) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [courses, selectedCategory, searchQuery])

  // Get featured (latest) course
  const featuredCourse = courses[0]

  // Popular courses - sorted by enrollment count
  const popularCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0)).slice(0, 12)
  }, [filteredCourses])

  // Newest courses - already sorted by createdAt from query
  const newestCourses = useMemo(() => {
    return filteredCourses.slice(0, 12)
  }, [filteredCourses])


  if (loading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4 border-4 border-gray-700 border-t-purple-500" />
            <p className="text-gray-400">Webinárok betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <FramerNavbarWrapper />

      <div className="w-full min-h-screen bg-gray-950 overflow-x-hidden">
        {/* Featured Hero - Netflix Style */}
        {featuredCourse && (
          <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[350px] sm:min-h-[400px] md:min-h-[500px] max-h-[700px]">
            {/* Background Image */}
            <div className="absolute inset-0">
              {featuredCourse.thumbnailUrl ? (
                <img
                  src={featuredCourse.thumbnailUrl}
                  alt={featuredCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-purple-950" />
              )}
              {/* Gradient overlays - enhanced for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(3,7,18,1)_0%,rgba(3,7,18,0.95)_35%,rgba(3,7,18,0.8)_50%,rgba(3,7,18,0.5)_65%,rgba(3,7,18,0.2)_75%,transparent_85%)]" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-end">
              <div className="w-full mx-auto max-w-[1440px] px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 pb-8 sm:pb-12 md:pb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl"
                >
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span className="text-purple-400 font-medium text-xs sm:text-sm uppercase tracking-wider">
                      Webinár
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 text-xs sm:text-sm">Legújabb</span>
                  </div>

                  {/* Title - Mobile-first: smaller on phones, larger on desktop */}
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                    {featuredCourse.title}
                  </h1>

                  {/* Description - Mobile-first: base size on phones */}
                  <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
                    {featuredCourse.description}
                  </p>

                  {/* CTA Button - Touch-friendly minimum 48px height */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/courses/${featuredCourse.id}`}
                      className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 sm:px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm sm:text-base"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Megtekintés
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Simple Filter Bar */}
        <div className="bg-gray-950 relative z-20">
          <div className="w-full mx-auto max-w-[1440px] px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 py-4 sm:py-6">
            <SimpleFilterBar
              categories={categoryObjects}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setSearchQuery}
              backgroundColor="dark"
              courseType="WEBINAR"
            />
          </div>
        </div>

        {/* Course Carousels */}
        <div className="py-12 space-y-12">
          {/* Popular Webinars Carousel */}
          {popularCourses.length > 0 && (
            <CarouselSection
              title="Felkapott Webinárok"
              courseType="WEBINAR"
              courses={popularCourses}
              categories={categoryObjects}
              instructors={instructors}
              backgroundColor="dark"
            />
          )}

          {/* Newest Webinars Carousel */}
          {newestCourses.length > 0 && (
            <CarouselSection
              title="Legújabb Webinárok"
              courseType="WEBINAR"
              courses={newestCourses}
              categories={categoryObjects}
              instructors={instructors}
              backgroundColor="dark"
            />
          )}

          {/* Cross-Type Navigation */}
          <div className="w-full mx-auto max-w-[1440px] px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 mt-12 sm:mt-16">
            <CrossTypeNavigation currentType="WEBINAR" />
          </div>
        </div>
      </div>

      <Footer border={true} />
    </AuthProvider>
  )
}
