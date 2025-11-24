"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Search, Filter, MapPin, Clock, TrendingUp, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface SearchFilters {
  category: string
  level: string
  duration: string
  price: string
  sort: string
}

interface Course {
  id: string
  title: string
  description: string
  category: {
    id: string
    name: string
  }
  difficulty: string
  duration?: number
  price?: number
  isFree?: boolean
  averageRating: number
  enrollmentCount: number
}

interface SearchSuggestion {
  id: string
  title: string
  type: 'course' | 'category' | 'instructor'
}

async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) return []
  
  try {
    const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable')
    const result: any = await getCoursesCallableFn({ search: query, limit: 5 })
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a keresési javaslatok betöltésekor')
    }
    
    return result.data.courses?.map((course: Course) => ({
      id: course.id,
      title: course.title,
      type: 'course' as const
    })) || []
  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return []
  }
}

async function fetchCategories(): Promise<{ id: string; name: string }[]> {
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

export const CourseSearch: React.FC = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    level: '',
    duration: '',
    price: '',
    sort: 'popular'
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const levels = [
    { id: 'all', name: 'Összes szint' },
    { id: 'BEGINNER', name: 'Kezdő' },
    { id: 'INTERMEDIATE', name: 'Középszint' },
    { id: 'ADVANCED', name: 'Haladó' }
  ]

  const durations = [
    { id: 'all', name: 'Összes hossz' },
    { id: '0-2h', name: '0-2 óra' },
    { id: '2-5h', name: '2-5 óra' },
    { id: '5-10h', name: '5-10 óra' },
    { id: '10h+', name: '10+ óra' }
  ]

  const prices = [
    { id: 'all', name: 'Összes ár' },
    { id: 'free', name: 'Ingyenes' },
    { id: 'paid', name: 'Fizetős' }
  ]

  const sortOptions = [
    { id: 'popular', name: 'Népszerűség' },
    { id: 'rating', name: 'Értékelés' },
    { id: 'newest', name: 'Legújabb' },
    { id: 'price_low', name: 'Ár: alacsony-felül' },
    { id: 'price_high', name: 'Ár: magas-alul' }
  ]

  // Fetch categories for dynamic filter options
  const { data: categories = [] } = useQuery({
    queryKey: ['searchCategories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['searchSuggestions', searchQuery],
    queryFn: () => fetchSearchSuggestions(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 2 * 60 * 1000,
  })

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.append('q', searchQuery)
    if (filters.category && filters.category !== 'all') params.append('category', filters.category)
    if (filters.level && filters.level !== 'all') params.append('level', filters.level)
    if (filters.duration && filters.duration !== 'all') params.append('duration', filters.duration)
    if (filters.price && filters.price !== 'all') params.append('price', filters.price)
    if (filters.sort) params.append('sort', filters.sort)
    
    router.push(`/courses?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title)
    setShowSuggestions(false)
    // Auto-search when suggestion is clicked
    const params = new URLSearchParams()
    params.append('q', suggestion.title)
    router.push(`/courses?${params.toString()}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSuggestions(value.length >= 2)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowSuggestions(false)
  }

  return (
    <section id="course-search" className="py-8 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Mit szeretne tanulni? (pl. Python, marketing, vezetés...)"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Keresés
              </button>

              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{suggestion.title}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {suggestion.type === 'course' ? 'Tartalom' : 'Kategória'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Szűrők</span>
                </button>
                
                {/* Quick filter chips */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => router.push('/courses?sort=popular')}
                    className="flex items-center space-x-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm hover:bg-yellow-100 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>Népszerű</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/courses?price=free')}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors"
                  >
                    Ingyenes
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/courses?duration=0-2h')}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Gyors</span>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {searchQuery && `"${searchQuery}" keresés`}
              </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategória</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">Összes kategória</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Szint</label>
                    <select
                      value={filters.level}
                      onChange={(e) => handleFilterChange('level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {levels.map(level => (
                        <option key={level.id} value={level.id}>{level.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hossz</label>
                    <select
                      value={filters.duration}
                      onChange={(e) => handleFilterChange('duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {durations.map(duration => (
                        <option key={duration.id} value={duration.id}>{duration.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ár</label>
                    <select
                      value={filters.price}
                      onChange={(e) => handleFilterChange('price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {prices.map(price => (
                        <option key={price.id} value={price.id}>{price.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rendezés</label>
                    <select
                      value={filters.sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {sortOptions.map(sort => (
                        <option key={sort.id} value={sort.id}>{sort.name}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </section>
  )
} 