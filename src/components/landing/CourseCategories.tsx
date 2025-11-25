"use client"
import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Card } from '@/components/ui/card'
import { BarChart2, Briefcase, Cpu, ArrowRight, Clock, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// Allow TypeScript to recognize gtag on window
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface Course {
  id: string
  title: string
  description: string
  category: {
    id: string
    name: string
  }
  enrollmentCount: number
  averageRating: number
  reviewCount: number
}

interface Category {
  id: string
  name: string
  description: string
}

interface CategoryStats {
  [key: string]: {
    color: string
    bgColor: string
    textColor: string
    enrollmentCount: number
    courseCount: number
    averageRating: number
  }
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'Karrier': Briefcase,
  'Üzlet': BarChart2,
  'Skill': Cpu,
}

const categoryDetails: CategoryStats = {
  'Karrier': {
    color: 'from-primary to-primary',
    bgColor: 'bg-brand-secondary/5',
    textColor: 'text-brand-secondary-hover',
    enrollmentCount: 0,
    courseCount: 0,
    averageRating: 0
  },
  'Üzlet': {
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    enrollmentCount: 0,
    courseCount: 0,
    averageRating: 0
  },
  'Skill': {
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    enrollmentCount: 0,
    courseCount: 0,
    averageRating: 0
  }
}

// Default fallback for categories not in categoryDetails
const defaultCategoryStyle = {
  color: 'from-gray-500 to-gray-600',
  bgColor: 'bg-gray-50',
  textColor: 'text-gray-700',
  enrollmentCount: 0,
  courseCount: 0,
  averageRating: 0
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

async function fetchCourses(): Promise<Course[]> {
  try {
    const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable')
    const result: any = await getCoursesCallableFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a tartalmak betöltésekor')
    }
    
    return result.data.courses || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const getCategoriesFn = httpsCallable(functions, 'getCategories')
    const result: any = await getCategoriesFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a kategóriák betöltésekor')
    }
    
    return result.data.categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export const CourseCategories: React.FC = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[], Error>({
    queryKey: ['courseCategories'],
    queryFn: fetchCourses,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Calculate category statistics from courses data
  const categoryStats = React.useMemo(() => {
    if (!courses || !categories) return {}

    // Initialize stats for each fetched category
    const stats: CategoryStats = {}
    categories.forEach(category => {
      const baseStyle = categoryDetails[category.name] || defaultCategoryStyle
      stats[category.name] = {
        ...baseStyle,
        enrollmentCount: 0,
        courseCount: 0,
        averageRating: 0,
      }
    })

    // Accumulate course data into stats
    courses.forEach(course => {
      const name = course.category?.name
      if (name && stats[name]) {
        stats[name].enrollmentCount += course.enrollmentCount || 0
        stats[name].courseCount += 1
        stats[name].averageRating =
          (stats[name].averageRating * (stats[name].courseCount - 1) + (course.averageRating || 0)) / stats[name].courseCount
      }
    })

    return stats
  }, [courses, categories])

  const getPopularCourses = (categoryName: string) => {
    if (!courses) return []
    return courses
      .filter(course => course.category?.name === categoryName)
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 3)
  }

  if (coursesLoading || categoriesLoading) {
    return (
      <section className="py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 mx-auto max-w-md"></div>
              <div className="h-4 bg-gray-200 rounded mx-auto max-w-2xl"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-50 rounded-xl p-6 h-64">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <Container>
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fedezze fel tartalmainkat kategóriák szerint
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Válassza ki az érdeklődési körét és találja meg a tökéletes tartalmat karrierfejlesztéséhez
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {categories.map((category) => {
            const stats = categoryStats[category.name] || categoryDetails[category.name] || defaultCategoryStyle
            const Icon = iconMap[category.name] || Cpu
            const popularCourses = getPopularCourses(category.name)

            return (
              <motion.div key={category.id} variants={cardVariants}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-lg ${stats.bgColor} flex items-center justify-center mr-4`}>
                        <Icon className={`w-6 h-6 ${stats.textColor}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {stats.courseCount} tartalom
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Befektetett diákok</span>
                        <span className="font-medium">{stats.enrollmentCount.toLocaleString('hu-HU')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Átlagos értékelés</span>
                        <span className="font-medium">{stats.averageRating.toFixed(1)} ⭐</span>
                      </div>
                    </div>

                    {popularCourses.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Népszerű tartalmak
                        </h4>
                        <div className="space-y-2">
                          {popularCourses.map((course) => (
                            <div key={course.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 truncate flex-1">
                                {course.title}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {course.enrollmentCount} diák
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link 
                      href={`/courses?category=${category.id}`}
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-200"
                      onClick={() => {
                        // Track category click
                        if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'category_click', {
                            category_name: category.name,
                            category_id: category.id
                          })
                        }
                      }}
                    >
                      <span className="text-sm font-medium">Böngésszen tartalmakat</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
} 