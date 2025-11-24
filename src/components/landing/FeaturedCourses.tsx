"use client"
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Users, Clock, Play, ArrowRight, Sparkles, TrendingUp, Award, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { CourseCard } from '@/components/course/CourseCard'
import { Course } from '@/types'
import { mockCourses } from '@/lib/mockCourses'

interface UserProgress {
  enrolledCourses: string[]
  completedCourses: string[]
  preferredCategories: string[]
  averageRating: number
  totalEnrollments: number
}

async function fetchFeaturedCourses(): Promise<Course[]> {
  try {
    // Development mode: return mock courses
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: using mock featured courses')
      
      // Use the first 3 courses from complete mock data
      return mockCourses.slice(0, 3)
    }
    
    const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable')
    const result: any = await getCoursesCallableFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a kiemelt tartalmak betöltésekor')
    }
    
    // Limit to 6 courses and sort by popularity (for now, just take first 6)
    return result.data.courses.slice(0, 6) || []
  } catch (error) {
    console.error('Error fetching featured courses:', error)
    return []
  }
}

async function fetchPersonalizedCourses(userId: string): Promise<Course[]> {
  try {
    // Development mode: return mock personalized courses
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: using mock personalized courses for userId:', userId)
      
      // Return a different selection of courses for personalized view
      return mockCourses.slice(1, 4) // Different selection than featured
    }
    
    // For now, use the same as featured courses since we don't have personalized endpoint
    const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable')
    const result: any = await getCoursesCallableFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a személyre szabott tartalmak betöltésekor')
    }
    
    return result.data.courses.slice(0, 6) || []
  } catch (error) {
    console.error('Error fetching personalized courses:', error)
    return []
  }
}

async function fetchUserProgress(userId: string): Promise<UserProgress> {
  try {
    const getUserProgressFn = httpsCallable(functions, 'getUserProgress')
    const result: any = await getUserProgressFn({ userId })
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a felhasználói folyamat betöltésekor')
    }
    
    return result.data.progress || {
      enrolledCourses: [],
      completedCourses: [],
      preferredCategories: [],
      averageRating: 0,
      totalEnrollments: 0
    }
  } catch (error) {
    console.error('Error fetching user progress:', error)
    return {
      enrolledCourses: [],
      completedCourses: [],
      preferredCategories: [],
      averageRating: 0,
      totalEnrollments: 0
    }
  }
}

async function fetchRecommendedCourses(categoryIds: string[]): Promise<Course[]> {
  try {
    // Development mode: return mock recommended courses
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: using mock recommended courses for categories:', categoryIds)
      
      // Filter mock courses by categories if provided
      let courses = mockCourses
      if (categoryIds.length > 0) {
        courses = courses.filter(course => 
          course.category && course.category.id && categoryIds.includes(course.category.id)
        )
      }
      
      return courses.slice(0, 6) || []
    }
    
    const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable')
    const result: any = await getCoursesCallableFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba az ajánlott tartalmak betöltésekor')
    }
    
    // Filter by categories if provided
    let courses = result.data.courses
    if (categoryIds.length > 0) {
      courses = courses.filter((course: Course) => 
        course.category && course.category.id && categoryIds.includes(course.category.id)
      )
    }
    
    return courses.slice(0, 6) || []
  } catch (error) {
    console.error('Error fetching recommended courses:', error)
    return []
  }
}

export const FeaturedCourses: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()

  // Fetch featured courses (fallback for non-authenticated users)
  const { data: featuredCourses, isLoading: featuredLoading } = useQuery<Course[], Error>({
    queryKey: ['featuredCourses'],
    queryFn: fetchFeaturedCourses,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch personalized courses for authenticated users
  const { data: personalizedCourses, isLoading: personalizedLoading } = useQuery<Course[], Error>({
    queryKey: ['personalizedCourses', user?.id],
    queryFn: () => fetchPersonalizedCourses(user!.id),
    enabled: isAuthenticated && !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch user progress for personalized recommendations
  const { data: userProgress } = useQuery<UserProgress, Error>({
    queryKey: ['userProgress', user?.id],
    queryFn: () => fetchUserProgress(user!.id),
    enabled: isAuthenticated && !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch recommended courses based on user preferences
  const { data: recommendedCourses, isLoading: recommendedLoading } = useQuery<Course[], Error>({
    queryKey: ['recommendedCourses', userProgress?.preferredCategories],
    queryFn: () => fetchRecommendedCourses(userProgress?.preferredCategories || []),
    enabled: isAuthenticated && !!userProgress?.preferredCategories?.length,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  // Determine which courses to show
  const coursesToShow = isAuthenticated && personalizedCourses?.length 
    ? personalizedCourses 
    : featuredCourses || []

  const isLoading = featuredLoading || (isAuthenticated && personalizedLoading)

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 mx-auto max-w-md"></div>
              <div className="h-4 bg-gray-200 rounded mx-auto max-w-2xl"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl p-6 h-80">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!coursesToShow || coursesToShow.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isAuthenticated ? 'Személyre szabott ajánlatok' : 'Kiemelt tartalmak'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isAuthenticated 
              ? 'Tartalmak, amelyek a te érdeklődési körödnek és tanulási stílusodnak megfelelnek'
              : 'A legnépszerűbb és legmagasabb értékelésű tartalmaink, amelyeket már több ezer diák teljesített'
            }
          </p>
        </motion.div>

        {/* User Progress Summary for Authenticated Users */}
        {isAuthenticated && userProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Tanulási folyamatod</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{userProgress.totalEnrollments}</div>
                <div className="text-sm text-gray-600">Beiratkozás</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userProgress.completedCourses.length}</div>
                <div className="text-sm text-gray-600">Teljesített</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{userProgress.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Átlagos értékelés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userProgress.preferredCategories.length}</div>
                <div className="text-sm text-gray-600">Kedvenc kategória</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesToShow.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <CourseCard course={course} showPreview={true} />
            </motion.div>
          ))}
        </div>

        {/* Recommended Courses Section for Authenticated Users */}
        {isAuthenticated && recommendedCourses && recommendedCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-900">Ajánlott tartalmak</h3>
              </div>
              <p className="text-gray-600">
                A te érdeklődési köröd alapján kiválasztott tartalmak
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedCourses.slice(0, 3).map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <CourseCard course={course} showPreview={true} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Link
            href="/courses"
            className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            <span>{isAuthenticated ? 'További ajánlatok megtekintése' : 'Összes tartalom megtekintése'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
} 