'use client'

import { useState, useEffect } from 'react'
import { motion } from "motion/react"
import { BookOpen } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { AuthProvider } from '@/contexts/AuthContext'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { CourseStatsBar } from '@/components/courses/CourseStatsBar'
import { CourseFilterPanel } from '@/components/courses/CourseFilterPanel'
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard'
import { CrossTypeNavigation } from '@/components/courses/CrossTypeNavigation'
import { useInstructors } from '@/hooks/useInstructorQueries'

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
  thumbnailUrl?: string
  lessons?: number
  createdAt?: any
  tags?: string[]
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS'
}

export default function AkadémiaPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>(['all'])
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
          const categoryNames = ['all', ...result.data.categories.map((cat: any) => cat.name)]
          setCategories(categoryNames)
          setCategoryObjects(result.data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories(['all'])
        setCategoryObjects([])
      }
    }

    fetchCategories()
  }, [])

  // Fetch ACADEMIA courses only from Firestore
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('courseType', '==', 'ACADEMIA'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[]

      setCourses(coursesData)
      setFilteredCourses(coursesData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching academia courses:', error)
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

    setFilteredCourses(filtered)
  }, [searchInput, selectedCategory, courses])

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSearchInput('')
  }

  if (loading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 border-4 border-gray-200 border-t-blue-600" />
            <p className="text-lg text-gray-600">Akadémia tartalmak betöltése...</p>
          </div>
        </div>
        <Footer border={true} />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <FramerNavbarWrapper />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-gray-50 relative overflow-hidden">
        {/* Background blur shapes */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" aria-hidden="true"></div>
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-cyan-100/20 rounded-full blur-2xl" aria-hidden="true"></div>

        {/* Hero Section */}
        <div className="relative pt-20 pb-16 px-6 lg:px-12">
          <div className="container mx-auto max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Akadémia
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                Hosszú, több leckéből álló képzések videókkal. Átfogó tudás strukturált tananyaggal, amely végigvezet a témakörön.
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
                <input
                  type="text"
                  placeholder="Keress akadémia tartalmak között..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-6 py-4 rounded-full border-2 border-white/50 bg-white/60 backdrop-blur-xl shadow-lg focus:outline-none focus:border-blue-500 transition-all text-gray-900 placeholder-gray-500"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Bar */}
        <CourseStatsBar
          totalCourses={courses.length}
          categoriesCount={categories.filter(c => c !== 'all').length}
          filteredCount={filteredCourses.length}
          courseType="ACADEMIA"
        />

        {/* Cross-Type Navigation */}
        <CrossTypeNavigation currentType="ACADEMIA" />

        {/* Main Content */}
        <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <CourseFilterPanel
                selectedCategory={selectedCategory}
                categories={categories}
                onCategoryChange={setSelectedCategory}
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
                      categories={categoryObjects}
                      instructors={instructors}
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
