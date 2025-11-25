'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search, TrendingUp, Star, Users, Heart, Filter, ChevronDown, BookOpen, Award, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePersonalizedRecommendations, useTrendingCourses, useCoursesCatalog, CatalogCourse, CourseCatalogFilters } from '@/hooks/useCoursesCatalog'
import { brandGradient, buttonStyles, cardStyles } from '@/lib/design-tokens'

/**
 * Browse Courses Section - Hybrid Discovery Interface
 * Real data integration with personalized recommendations, trending courses, and filterable catalog
 */

export function BrowseCoursesSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogFilters, setCatalogFilters] = useState<CourseCatalogFilters>({
    limit: 6,
    sort: 'popular',
    order: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Real data hooks
  const { data: recommendationsData, isLoading: recommendationsLoading } = usePersonalizedRecommendations(4)
  const { data: trendingData, isLoading: trendingLoading } = useTrendingCourses(6)
  const { data: catalogData, isLoading: catalogLoading } = useCoursesCatalog(catalogFilters)

  const handleSearch = () => {
    setCatalogFilters(prev => ({
      ...prev,
      search: searchQuery.trim() || undefined,
      offset: 0 // Reset to first page
    }))
  }

  const handleFilterChange = (key: keyof CourseCatalogFilters, value: any) => {
    setCatalogFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page
    }))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tartalmak felfedezése</h2>
        <Link href="/courses">
          <Button variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Összes tartalom
          </Button>
        </Link>
      </div>

      {/* Quick Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Mit szeretne tanulni? (pl. Python, Marketing, Design...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Szűrők
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              <Button onClick={handleSearch} size="lg">
                <Search className="w-4 h-4 mr-2" />
                Keresés
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nehézség</label>
                  <Select value={catalogFilters.difficulty || ''} onValueChange={(value) => handleFilterChange('difficulty', value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon nehézséget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Összes szint</SelectItem>
                      <SelectItem value="BEGINNER">Kezdő</SelectItem>
                      <SelectItem value="INTERMEDIATE">Közepes</SelectItem>
                      <SelectItem value="ADVANCED">Haladó</SelectItem>
                      <SelectItem value="EXPERT">Szakértő</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rendezés</label>
                  <Select value={catalogFilters.sort || 'popular'} onValueChange={(value) => handleFilterChange('sort', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Népszerűség</SelectItem>
                      <SelectItem value="rating">Értékelés</SelectItem>
                      <SelectItem value="new">Legújabb</SelectItem>
                      <SelectItem value="trending">Felkapott</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Típus</label>
                  <Select 
                    value={catalogFilters.isPlus === undefined ? '' : catalogFilters.isPlus ? 'plus' : 'paid'} 
                    onValueChange={(value) => handleFilterChange('isPlus', value === '' ? undefined : value === 'plus')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon típust" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Minden tartalom</SelectItem>
                      <SelectItem value="plus">DMA Plus</SelectItem>
                      <SelectItem value="paid">Fizetős tartalmak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personalized Recommendations */}
      {recommendationsData?.courses && recommendationsData.courses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-gray-900 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Önnek ajánljuk</h3>
              <Badge variant="secondary" className="ml-2 bg-[#466C95]/10 text-[#466C95]">
                Személyre szabott
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {recommendationsData.meta.userCategories.length > 0
                ? `${recommendationsData.meta.userCategories.length} kategória alapján`
                : 'Tanulási előzmények alapján'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendationsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)
            ) : (
              recommendationsData.courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <CourseCard course={course} isRecommended />
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Trending Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Felkapott tartalmak</h3>
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Trending
            </Badge>
          </div>
          <Link href="/courses?sort=trending" className="text-sm text-gray-900 hover:text-[#466C95] transition-colors">
            Összes trending tartalom →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
          ) : (
            trendingData?.courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <CourseCard course={course} isTrending />
              </motion.div>
            )) || []
          )}
        </div>
      </div>

      {/* Browse All Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">
              {catalogFilters.search ? `Keresési eredmények: "${catalogFilters.search}"` : 'Népszerű tartalmak'}
            </h3>
          </div>
          {catalogData?.total && (
            <p className="text-sm text-gray-600">
              {catalogData.total} tartalom található
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
          ) : catalogData?.courses.length === 0 ? (
            <div className="col-span-full">
              <EmptySearchResults searchQuery={catalogFilters.search} />
            </div>
          ) : (
            catalogData?.courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <CourseCard course={course} />
              </motion.div>
            )) || []
          )}
        </div>

        {/* Load More Button */}
        {catalogData && catalogData.courses.length < catalogData.total && (
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => handleFilterChange('limit', (catalogFilters.limit || 6) + 6)}
              disabled={catalogLoading}
            >
              További tartalmak betöltése ({catalogData.total - catalogData.courses.length} maradt)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Course Card Component
function CourseCard({ 
  course, 
  isRecommended = false, 
  isTrending = false 
}: { 
  course: CatalogCourse
  isRecommended?: boolean
  isTrending?: boolean 
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-700'
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-700'
      case 'ADVANCED': return 'bg-orange-100 text-orange-700'
      case 'EXPERT': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'Kezdő'
      case 'INTERMEDIATE': return 'Közepes'
      case 'ADVANCED': return 'Haladó'
      case 'EXPERT': return 'Szakértő'
      default: return difficulty
    }
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
        {/* Course Thumbnail */}
        <div className="h-48 relative" style={{ background: brandGradient }}>
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">📚</div>
                <p className="font-medium">{course.category?.name}</p>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {course.isPlus && (
              <Badge className="text-white" style={{ background: brandGradient }}>
                DMA Plus
              </Badge>
            )}
            {isRecommended && (
              <Badge className="bg-[#466C95] text-white">
                <Target className="w-3 h-3 mr-1" />
                Ajánlott
              </Badge>
            )}
            {isTrending && (
              <Badge className="bg-green-600 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {course.isEnrolled && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Beiratkozva
              </Badge>
            )}
          </div>
        </div>

        {/* Course Info */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#466C95] transition-colors">
              {course.title}
            </h4>
            <p className="text-sm text-gray-600">
              {course.instructor.firstName} {course.instructor.lastName}
            </p>
          </div>

          {/* Course Meta */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              {course.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {course.enrollmentCount}
            </div>
            {course.certificateEnabled && (
              <div className="flex items-center">
                <Award className="w-4 h-4 text-[#466C95] mr-1" />
                <span className="text-xs">Tanúsítvány</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge className={getDifficultyColor(course.difficulty)}>
              {getDifficultyLabel(course.difficulty)}
            </Badge>
            <Link href={`/courses/${course.id}`}>
              <Button size="sm" className="bg-gray-900 hover:bg-[#466C95] text-white transition-colors">
                {course.isEnrolled ? 'Folytatás' : 'Részletek'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Loading skeleton
function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse"></div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty search results
function EmptySearchResults({ searchQuery }: { searchQuery?: string }) {
  return (
    <Card className="p-12 text-center bg-gray-50 border-2 border-dashed border-gray-300">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {searchQuery ? `Nincs találat: "${searchQuery}"` : 'Nincsenek tartalmak'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {searchQuery 
          ? 'Próbáljon meg más kulcsszavakat vagy szűrőket használni.'
          : 'Jelenleg nincsenek elérhető tartalmak ezekkel a szűrőkkel.'
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/courses">
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Összes tartalom böngészése
          </Button>
        </Link>
        {searchQuery && (
          <Button onClick={() => window.location.reload()}>
            Szűrők törlése
          </Button>
        )}
      </div>
    </Card>
  )
}