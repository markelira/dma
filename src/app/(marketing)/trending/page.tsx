'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Star, 
  Users, 
  Clock, 
  Play, 
  ArrowRight,
  Flame,
  BookOpen,
  Trophy,
  Zap,
  Filter,
  ChevronDown
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'

interface Course {
  id: string
  title: string
  instructorName?: string
  category: string
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price: number
  imageUrl?: string
  createdAt?: any
}

export default function TrendingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(['all'])

  // Fetch all courses from Firestore
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[]
      
      // Sort by enrollment count if available
      coursesData.sort((a, b) => {
        const countA = a.enrollmentCount || a.students || 0
        const countB = b.enrollmentCount || b.students || 0
        return countB - countA
      })
      
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

  // Filter courses when category or level changes
  useEffect(() => {
    let filtered = courses

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => {
        const categoryName = typeof course.category === 'string' ? course.category : (course.category as any)?.name
        return categoryName === selectedCategory
      })
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => 
        course.level?.toUpperCase() === selectedLevel || 
        (selectedLevel === 'BEGINNER' && course.level?.toLowerCase() === 'kezdő') ||
        (selectedLevel === 'INTERMEDIATE' && course.level?.toLowerCase() === 'középhaladó') ||
        (selectedLevel === 'ADVANCED' && course.level?.toLowerCase() === 'haladó')
      )
    }

    setFilteredCourses(filtered)
  }, [selectedCategory, selectedLevel, courses])

  const levels = [
    { value: 'all', label: 'Minden szint' },
    { value: 'BEGINNER', label: 'Kezdő' },
    { value: 'INTERMEDIATE', label: 'Középhaladó' },
    { value: 'ADVANCED', label: 'Haladó' }
  ]

  const getLevelBadgeVariant = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'kezdő':
      case 'beginner':
        return 'secondary'
      case 'középhaladó':
      case 'intermediate':
        return 'default'
      case 'haladó':
      case 'advanced':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Trophy className="w-5 h-5 text-orange-600" />
    return <Zap className="w-5 h-5 text-primary" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Kurzusok betöltése...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-100 to-red-100 py-16">
        <div className="container">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg mb-6">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-gray-900">TRENDING NOW</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Legnépszerűbb Kurzusok
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fedezd fel a legtöbbet választott kurzusainkat, amelyek már több ezer diák sikeréhez járultak hozzá
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Kategória
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-full"
                  >
                    {cat === 'all' ? 'Összes' : cat}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Szint
              </label>
              <div className="flex gap-2">
                {levels.map((level) => (
                  <Button
                    key={level.value}
                    variant={selectedLevel === level.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLevel(level.value)}
                    className="rounded-full"
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="container pb-16">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nincs találat
            </h3>
            <p className="text-gray-600">
              Próbálj más szűrőket választani!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course, index) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  {course.imageUrl ? (
                    <div className="aspect-video bg-gray-100">
                      <img 
                        src={course.imageUrl} 
                        alt={course.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  
                  {/* Ranking Badge */}
                  <div className="absolute top-2 left-2 bg-white rounded-full p-2 shadow-lg">
                    {getRankIcon(index)}
                  </div>
                  
                  {index < 3 && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white gap-1">
                      <Flame className="w-3 h-3" />
                      TOP {index + 1}
                    </Badge>
                  )}
                  
                  <Badge variant={getLevelBadgeVariant(course.level)} className="absolute bottom-2 right-2">
                    {course.level || 'Minden szint'}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {typeof course.category === 'string' ? course.category : (course.category as any)?.name || 'N/A'}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {course.instructorName || 'DMA Oktató'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrollmentCount || course.students || 0}
                    </span>
                    {course.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {course.rating}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-gray-900">
                      {course.price === 0 ? (
                        <Badge className="bg-green-100 text-green-700">
                          Ingyenes
                        </Badge>
                      ) : (
                        `${course.price.toLocaleString()} Ft`
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-1 group-hover:text-primary"
                      asChild
                    >
                      <Link href={`/courses/${course.id}`}>
                        <Play className="w-4 h-4" />
                        Kezdés
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}