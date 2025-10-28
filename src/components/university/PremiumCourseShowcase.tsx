'use client'

import { useState } from 'react'
import { TrendingUp, Filter, Search, ChevronDown, BookOpen } from 'lucide-react'
import { UniversalCourseCard } from '@/components/ui/UniversalCourseCard'

interface PublicCourse {
  id: string
  title: string
  slug?: string
  thumbnailUrl?: string | null
  description?: string
  instructor?: {
    firstName: string
    lastName: string
    title?: string
  }
  rating?: number
  enrollmentCount?: number
  duration?: number
  difficulty?: string
  category?: string
  price?: number
  isFeatured?: boolean
  hasVideo?: boolean
  certificateType?: string
  completionRate?: number
}

interface PremiumCourseShowcaseProps {
  courses: PublicCourse[]
  universityName: string
}

const handleCourseAction = (action: string, course: PublicCourse) => {
  console.log(`Course action: ${action}`, course)
  // Add actual action handling logic here
}

export function PremiumCourseShowcase({ courses, universityName }: PremiumCourseShowcaseProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)

  // Enhance courses with premium data
  const enhancedCourses = courses.map(course => ({
    ...course,
    price: course.price || 450000 + Math.floor(Math.random() * 200000),
    isFeatured: course.isFeatured || Math.random() > 0.7,
    hasVideo: course.hasVideo || Math.random() > 0.6,
    certificateType: course.certificateType || (Math.random() > 0.5 ? 'Diploma' : 'Tanúsítvány'),
    completionRate: course.completionRate || 78 + Math.floor(Math.random() * 20),
    difficulty: course.difficulty || ['Kezdő', 'Középhaladó', 'Haladó', 'Szakértő'][Math.floor(Math.random() * 4)],
    category: typeof course.category === 'string' ? course.category : (course.category as any)?.name || ['Business', 'Technology', 'Design', 'Marketing'][Math.floor(Math.random() * 4)]
  }))

  // Get featured courses
  const featuredCourses = enhancedCourses.filter(course => course.isFeatured).slice(0, 3)

  // Filter and sort logic
  const filteredCourses = enhancedCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
    const categoryName = typeof course.category === 'string' ? course.category : (course.category as any)?.name
    const matchesCategory = selectedCategory === 'all' || categoryName === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'price':
        return (a.price || 0) - (b.price || 0)
      case 'students':
        return (b.enrollmentCount || 0) - (a.enrollmentCount || 0)
      case 'featured':
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
    }
  })

  const categories = [...new Set(enhancedCourses.map(c => c.category).filter(Boolean))]
  const difficulties = [...new Set(enhancedCourses.map(c => c.difficulty).filter(Boolean))]

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Featured Programs Section */}
        {featuredCourses.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h2 className="text-4xl font-bold text-gray-900">Kiemelt programok</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A {universityName} legkeresettebb és legsikeresebb képzési programjai
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {featuredCourses.map(course => (
                <UniversalCourseCard
                  key={course.id}
                  course={course}
                  variant="featured"
                  context="university"
                  actions={['enroll', 'details', 'share']}
                  showElements={['rating', 'price', 'instructor', 'students', 'category']}
                  onAction={handleCourseAction}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Programs Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold text-gray-900">
                Összes program ({sortedCourses.length})
              </h2>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Szűrők
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keresés</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Program neve..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategória</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Összes kategória</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nehézség</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Összes szint</option>
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rendezés</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="featured">Kiemelt először</option>
                    <option value="rating">Értékelés szerint</option>
                    <option value="price">Ár szerint</option>
                    <option value="students">Hallgatók száma szerint</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Course Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedCourses.map(course => (
              <UniversalCourseCard
                key={course.id}
                course={course}
                variant="default"
                context="university"
                actions={['enroll', 'bookmark', 'details']}
                showElements={['rating', 'price', 'instructor', 'students', 'category', 'difficulty']}
                onAction={handleCourseAction}
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedCourses.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nincs találat
              </h3>
              <p className="text-gray-500">
                Próbáljon meg más keresési feltételeket.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}