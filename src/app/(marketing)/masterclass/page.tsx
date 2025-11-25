'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from "motion/react"
import { GraduationCap, Play, Info } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { AuthProvider } from '@/contexts/AuthContext'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'
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

export default function MasterclassPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [categoryObjects, setCategoryObjects] = useState<Array<{ id: string; name: string }>>([])

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

  // Fetch MASTERCLASS courses only from Firestore
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('courseType', '==', 'MASTERCLASS'),
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
      console.error('Error fetching masterclass courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Get featured (latest) course
  const featuredCourse = courses[0]

  // Filter courses by search only - include all courses (featured one too)
  const filteredCourses = useMemo(() => {
    if (!searchInput) return courses

    return courses.filter(course =>
      course.title.toLowerCase().includes(searchInput.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchInput.toLowerCase()) ||
      course.tags?.some(tag => tag.toLowerCase().includes(searchInput.toLowerCase()))
    )
  }, [searchInput, courses])

  if (loading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4 border-4 border-gray-700 border-t-amber-500" />
            <p className="text-gray-400">Masterclass tartalmak betöltése...</p>
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
          <div className="relative h-[70vh] min-h-[500px] max-h-[700px]">
            {/* Background Image */}
            <div className="absolute inset-0">
              {featuredCourse.thumbnailUrl ? (
                <img
                  src={featuredCourse.thumbnailUrl}
                  alt={featuredCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600" />
              )}
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-end">
              <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] pb-16 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl"
                >
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-amber-400 font-medium text-sm uppercase tracking-wider">
                      Masterclass
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 text-sm">Legújabb</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    {featuredCourse.title}
                  </h1>

                  {/* Description */}
                  <p className="text-gray-300 text-lg mb-6 line-clamp-3">
                    {featuredCourse.description}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/courses/${featuredCourse.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Megtekintés
                    </Link>
                    <Link
                      href={`/courses/${featuredCourse.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-5 h-5" />
                      Részletek
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Course Grid Section */}
        <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] py-12">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Összes masterclass
            </h2>
            {/* Search */}
            <div className="relative w-[300px]">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Keresés..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {filteredCourses.length === 0 && !featuredCourse ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20 px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nincs találat
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Hamarosan érkeznek új masterclass tartalmak
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filteredCourses.map((course, index) => (
                <PremiumCourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  categories={categoryObjects}
                  instructors={instructors}
                />
              ))}
            </motion.div>
          )}

          {/* Cross-Type Navigation */}
          <div className="mt-16">
            <CrossTypeNavigation currentType="MASTERCLASS" />
          </div>
        </div>
      </div>

      <Footer border={true} />
    </AuthProvider>
  )
}
