'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from "motion/react"
import { BookOpen } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel'
import { AdvancedFilterBar } from '@/components/courses/AdvancedFilterBar'
import { CarouselSection } from '@/components/courses/CarouselSection'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { shuffleArray } from '@/lib/utils'

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [targetAudiences, setTargetAudiences] = useState<Array<{ id: string; name: string }>>([])
  // Multi-select state - arrays instead of single strings
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState<string[]>([])
  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>([])
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
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

  // Apply filters and organize courses by type (with multi-select OR logic)
  const filteredCoursesByType = useMemo(() => {
    let filtered = courses

    // Apply category filter (OR logic for multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(c => {
        return selectedCategories.some(catId => {
          if (c.categoryIds?.includes(catId)) return true
          if (c.categoryId === catId) return true
          return false
        })
      })
    }

    // Apply target audience filter (OR logic for multi-select)
    if (selectedTargetAudiences.length > 0) {
      filtered = filtered.filter(c =>
        selectedTargetAudiences.some(audId => c.targetAudienceIds?.includes(audId))
      )
    }

    // Apply course type filter (OR logic for multi-select)
    if (selectedCourseTypes.length > 0) {
      filtered = filtered.filter(c => selectedCourseTypes.includes(c.courseType))
    }

    // Apply instructor filter (OR logic for multi-select)
    if (selectedInstructors.length > 0) {
      filtered = filtered.filter(c =>
        selectedInstructors.some(instId =>
          c.instructorId === instId ||
          c.instructorIds?.includes(instId)
        )
      )
    }

    return {
      ACADEMIA: shuffleArray(filtered.filter(c => c.courseType === 'ACADEMIA')),
      WEBINAR: shuffleArray(filtered.filter(c => c.courseType === 'WEBINAR')),
      MASTERCLASS: shuffleArray(filtered.filter(c => c.courseType === 'MASTERCLASS')),
      PODCAST: shuffleArray(filtered.filter(c => c.courseType === 'PODCAST')),
    }
  }, [courses, selectedCategories, selectedTargetAudiences, selectedCourseTypes, selectedInstructors])

  // Check if all filtered sections are empty
  const hasFilteredResults = useMemo(() => {
    return (
      filteredCoursesByType.ACADEMIA.length > 0 ||
      filteredCoursesByType.WEBINAR.length > 0 ||
      filteredCoursesByType.MASTERCLASS.length > 0 ||
      filteredCoursesByType.PODCAST.length > 0
    )
  }, [filteredCoursesByType])

  const hasActiveFilters = selectedCategories.length > 0 || selectedTargetAudiences.length > 0 || selectedCourseTypes.length > 0 || selectedInstructors.length > 0

  // Build hero slides with one course from each type
  const heroSlides = useMemo(() => {
    const slides: Array<{
      id: string
      title: string
      description?: string
      thumbnailUrl?: string
      courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
      instructorNames?: string[]
      duration?: string
    }> = []

    // Helper to get instructor names
    const getInstructorNames = (course: Course): string[] => {
      if (!instructors) return []
      const names: string[] = []

      if (course.instructorId) {
        const instructor = instructors.find(i => i.id === course.instructorId)
        if (instructor?.name) names.push(instructor.name)
      }

      if ((course as any).instructorIds?.length) {
        (course as any).instructorIds.forEach((id: string) => {
          const instructor = instructors.find(i => i.id === id)
          if (instructor?.name && !names.includes(instructor.name)) {
            names.push(instructor.name)
          }
        })
      }

      return names
    }

    // Get latest from each course type
    const sortedCourses = [...courses].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    const webinar = sortedCourses.find(c => c.courseType === 'WEBINAR')
    const academia = sortedCourses.find(c => c.courseType === 'ACADEMIA')
    const masterclass = sortedCourses.find(c => c.courseType === 'MASTERCLASS')
    const podcast = sortedCourses.find(c => c.courseType === 'PODCAST')

    // Add in order: Webinar, Academia, Masterclass, Podcast
    if (webinar) {
      slides.push({
        id: webinar.id,
        title: webinar.title,
        description: webinar.description,
        thumbnailUrl: webinar.thumbnailUrl,
        courseType: 'WEBINAR',
        instructorNames: getInstructorNames(webinar),
        duration: webinar.duration,
      })
    }

    if (academia) {
      slides.push({
        id: academia.id,
        title: academia.title,
        description: academia.description,
        thumbnailUrl: academia.thumbnailUrl,
        courseType: 'ACADEMIA',
        instructorNames: getInstructorNames(academia),
        duration: academia.duration,
      })
    }

    if (masterclass) {
      slides.push({
        id: masterclass.id,
        title: masterclass.title,
        description: masterclass.description,
        thumbnailUrl: masterclass.thumbnailUrl,
        courseType: 'MASTERCLASS',
        instructorNames: getInstructorNames(masterclass),
        duration: masterclass.duration,
      })
    }

    if (podcast) {
      slides.push({
        id: podcast.id,
        title: podcast.title,
        description: podcast.description,
        thumbnailUrl: podcast.thumbnailUrl,
        courseType: 'PODCAST',
        instructorNames: getInstructorNames(podcast),
        duration: podcast.duration,
      })
    }

    return slides
  }, [courses, instructors])

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
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-800 border-t-brand-secondary" />
            <p className="text-base font-normal text-gray-300">Tartalmak betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </>
    )
  }

  return (
    <>
      <FramerNavbarWrapper />

      <div className="w-full min-h-screen bg-gray-950 overflow-x-hidden">
        {/* Hero Carousel and Search/Filter */}
        <div className="bg-gray-950">
          <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] pt-24 md:pt-32 pb-8">
            {/* Hero Carousel */}
            {heroSlides.length > 0 && (
              <div className="mb-8">
                <DashboardHeroCarousel slides={heroSlides} />
              </div>
            )}

            {/* Search and Filter Bar */}
            <AdvancedFilterBar
              courses={courses}
              categories={categories}
              targetAudiences={targetAudiences}
              instructors={instructors}
              selectedCategories={selectedCategories}
              selectedTargetAudiences={selectedTargetAudiences}
              selectedCourseTypes={selectedCourseTypes}
              selectedInstructors={selectedInstructors}
              onCategoriesChange={setSelectedCategories}
              onTargetAudiencesChange={setSelectedTargetAudiences}
              onCourseTypesChange={setSelectedCourseTypes}
              onInstructorsChange={setSelectedInstructors}
              onClearFilters={() => {
                setSelectedCategories([])
                setSelectedTargetAudiences([])
                setSelectedCourseTypes([])
                setSelectedInstructors([])
              }}
              backgroundColor="light"
            />
          </div>
        </div>

        {/* Course Carousels */}
        <div className="py-12">
          {/* Show carousels only if there are filtered results */}
          {hasFilteredResults ? (
            <>
              {/* Webinar Carousel */}
              <CarouselSection
                title="Webinár"
                courseType="WEBINAR"
                courses={filteredCoursesByType.WEBINAR}
                categories={categories}
                instructors={instructors}
                viewAllLink="/webinar"
                backgroundColor="dark"
              />

              {/* Academia Carousel */}
              <CarouselSection
                title="Akadémia"
                courseType="ACADEMIA"
                courses={filteredCoursesByType.ACADEMIA}
                categories={categories}
                instructors={instructors}
                viewAllLink="/akadémia"
                backgroundColor="dark"
              />

              {/* Masterclass Carousel */}
              <CarouselSection
                title="Masterclass"
                courseType="MASTERCLASS"
                courses={filteredCoursesByType.MASTERCLASS}
                categories={categories}
                instructors={instructors}
                viewAllLink="/masterclass"
                backgroundColor="dark"
              />

              {/* Podcast Carousel */}
              <CarouselSection
                title="Podcast"
                courseType="PODCAST"
                courses={filteredCoursesByType.PODCAST}
                categories={categories}
                instructors={instructors}
                viewAllLink="/podcast"
                backgroundColor="dark"
              />
            </>
          ) : (
            /* Empty State for Filters */
            <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-12">
              <motion.div
                className="flex flex-col items-center justify-center py-16 px-6 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-lg max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mb-4 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {hasActiveFilters
                    ? 'Nem található tartalom a kiválasztott szűrőkkel'
                    : 'Nincsenek elérhető tartalmak'}
                </h3>
                <p className="text-sm font-normal text-gray-300 text-center mb-4">
                  {hasActiveFilters
                    ? 'Próbálj más szűrőket választani'
                    : 'Jelenleg nincsenek közzétett tartalmak'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedCategories([])
                      setSelectedTargetAudiences([])
                      setSelectedCourseTypes([])
                      setSelectedInstructors([])
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
