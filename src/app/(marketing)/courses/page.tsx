'use client'

import { useState, useEffect } from 'react'
import { motion } from "motion/react"
import { BookOpen } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { AuthProvider } from '@/contexts/AuthContext'
import { PremiumHeader } from '@/components/PremiumHeader'
import { PremiumFooter } from '@/components/PremiumFooter'
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
        <PremiumHeader />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'linear-gradient(to bottom, #16222F 0%, #466C95 100%)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-16 w-16 mx-auto mb-6"
              style={{
                border: '3px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: 'white'
              }}
            />
            <p className="text-lg text-white/80">Kurzusok betöltése...</p>
          </div>
        </div>
        <PremiumFooter />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <PremiumHeader />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <CoursesHeroSection
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          totalCourses={courses.length}
        />

        {/* Stats Bar */}
        <CourseStatsBar
          totalCourses={courses.length}
          freeCourses={courses.filter(c => c.price === 0).length}
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
                  className="flex flex-col items-center justify-center py-20 px-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className="p-6 rounded-full mb-6"
                    style={{
                      background: 'linear-gradient(135deg, rgba(70, 108, 149, 0.1) 0%, rgba(70, 108, 149, 0.05) 100%)',
                      border: '2px dashed rgba(70, 108, 149, 0.3)'
                    }}
                  >
                    <BookOpen className="w-12 h-12 text-[#466C95] opacity-40" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Nincs találat
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Próbálj más szűrőket vagy keresési kifejezést használni
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-6 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-full font-medium transition-colors duration-200"
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

      <PremiumFooter />
    </AuthProvider>
  )
}
