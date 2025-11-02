'use client'

import { useState, useEffect } from 'react'
import { motion } from "motion/react"
import { BookOpen } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { AuthProvider } from '@/contexts/AuthContext'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { CoursesHeroSection } from '@/components/courses/CoursesHeroSection'
import { CourseStatsBar } from '@/components/courses/CourseStatsBar'
import { CourseFilterPanel } from '@/components/courses/CourseFilterPanel'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'

interface Course {
  id: string
  title: string
  description: string
  instructorName?: string
  category: string
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price: number
  imageUrl?: string
  lessons?: number
  createdAt?: any
  tags?: string[]
}

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [categories, setCategories] = useState<string[]>(['all'])

  // Fetch all courses from Firestore
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

      setCourses(coursesData)
      setFilteredCourses(coursesData)

      // Extract unique categories
      const uniqueCategories = new Set<string>(['all'])
      coursesData.forEach(course => {
        if (course.category) {
          const categoryName = typeof course.category === 'string' ? course.category : (course.category as any)?.name
          if (categoryName) {
            uniqueCategories.add(categoryName)
          }
        }
      })
      setCategories(Array.from(uniqueCategories))

      setLoading(false)
    }, (error) => {
      console.error('Error fetching courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter courses
  useEffect(() => {
    let filtered = courses

    // Search filter
    if (searchInput) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchInput.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchInput.toLowerCase()) ||
        course.tags?.some(tag => tag.toLowerCase().includes(searchInput.toLowerCase()))
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => {
        const categoryName = typeof course.category === 'string' ? course.category : (course.category as any)?.name
        return categoryName === selectedCategory
      })
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course =>
        course.level?.toLowerCase() === selectedLevel.toLowerCase()
      )
    }

    // Price filter
    if (selectedPrice === 'free') {
      filtered = filtered.filter(course => course.price === 0)
    } else if (selectedPrice === 'paid') {
      filtered = filtered.filter(course => course.price > 0)
    }

    setFilteredCourses(filtered)
  }, [searchInput, selectedCategory, selectedLevel, selectedPrice, courses])

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSelectedLevel('all')
    setSelectedPrice('all')
    setSearchInput('')
  }

  if (loading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-200 border-t-blue-600" />
            <p className="text-lg text-gray-600">Kurzusok betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <FramerNavbarWrapper />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
        {/* Background blur shapes */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" aria-hidden="true"></div>
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-purple-100/20 rounded-full blur-2xl" aria-hidden="true"></div>
        {/* Hero Section */}
        <CoursesHeroSection
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          totalCourses={courses.length}
          courses={courses}
        />

        {/* Stats Bar */}
        <CourseStatsBar
          totalCourses={courses.length}
          categoriesCount={categories.filter(c => c !== 'all').length}
          filteredCount={filteredCourses.length}
        />

        {/* Main Content */}
        <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <CourseFilterPanel
                selectedCategory={selectedCategory}
                selectedLevel={selectedLevel}
                selectedPrice={selectedPrice}
                categories={categories}
                onCategoryChange={setSelectedCategory}
                onLevelChange={setSelectedLevel}
                onPriceChange={setSelectedPrice}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Course Grid */}
            <div className="lg:col-span-3">
              {filteredCourses.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-20 px-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Nincs találat
                  </h3>
                  <p className="text-gray-600 text-center max-w-md mb-6">
                    Próbálj más szűrőket vagy keresési kifejezést használni
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="btn bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm hover:shadow-md transition-all"
                  >
                    Szűrők törlése
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course, index) => (
                    <PremiumCourseCard
                      key={course.id}
                      course={course}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer border={true} />
    </AuthProvider>
  )
}
