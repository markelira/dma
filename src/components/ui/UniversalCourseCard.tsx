'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Users, Clock, BookOpen, Play, Award, TrendingUp, Bookmark, Share, ExternalLink, DollarSign, GraduationCap, Heart } from 'lucide-react'

// Enhanced Course interface for Universal Card
interface Course {
  id: string
  title: string
  slug?: string
  thumbnailUrl?: string | null
  description?: string
  instructor?: {
    firstName: string
    lastName: string
    title?: string
    imageUrl?: string
  }
  university?: {
    name: string
    logoUrl?: string
  }
  rating?: number
  ratingCount?: number
  enrollmentCount?: number
  duration?: number
  difficulty?: string
  category?: string
  price?: number
  originalPrice?: number
  isFeatured?: boolean
  hasVideo?: boolean
  certificateType?: string
  completionRate?: number
  progress?: number
  isEnrolled?: boolean
  isBookmarked?: boolean
  createdAt?: string
  updatedAt?: string
}

interface UniversalCourseCardProps {
  course: Course
  variant?: 'default' | 'compact' | 'featured' | 'list' | 'minimal'
  context?: 'dashboard' | 'university' | 'search' | 'recommendations' | 'home'
  actions?: ('enroll' | 'continue' | 'bookmark' | 'share' | 'details' | 'purchase')[]
  showElements?: ('rating' | 'price' | 'instructor' | 'duration' | 'students' | 'category' | 'university' | 'progress' | 'difficulty')[]
  onAction?: (action: string, course: Course) => void
  className?: string
  priority?: boolean
}

const difficultyColors = {
  'Kezdő': 'bg-green-100 text-green-800',
  'Haladó': 'bg-blue-100 text-blue-800',
  'Középhaladó': 'bg-yellow-100 text-yellow-800',
  'Szakértő': 'bg-red-100 text-red-800'
}

const categoryIcons = {
  'Business': '💼',
  'Technology': '💻',
  'Design': '🎨',
  'Marketing': '📊',
  'Engineering': '⚙️',
  'Healthcare': '🏥',
  'Education': '🎓',
  'Finance': '💰'
}

// Context-aware defaults
const getContextDefaults = (context: string) => {
  switch (context) {
    case 'dashboard':
      return {
        variant: 'default' as const,
        actions: ['continue', 'details'] as const,
        showElements: ['rating', 'progress', 'duration'] as const
      }
    case 'university':
      return {
        variant: 'default' as const,
        actions: ['enroll', 'details'] as const,
        showElements: ['rating', 'price', 'instructor', 'students'] as const
      }
    case 'search':
      return {
        variant: 'list' as const,
        actions: ['enroll', 'bookmark'] as const,
        showElements: ['rating', 'price', 'category', 'university'] as const
      }
    case 'recommendations':
      return {
        variant: 'minimal' as const,
        actions: ['details'] as const,
        showElements: ['rating', 'price'] as const
      }
    case 'home':
      return {
        variant: 'default' as const,
        actions: ['enroll', 'details', 'bookmark'] as const,
        showElements: ['rating', 'price', 'instructor', 'category'] as const
      }
    default:
      return {
        variant: 'default' as const,
        actions: ['enroll', 'details'] as const,
        showElements: ['rating', 'price', 'duration'] as const
      }
  }
}

export function UniversalCourseCard({
  course,
  variant,
  context = 'dashboard',
  actions,
  showElements,
  onAction,
  className = '',
  priority = false
}: UniversalCourseCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(course.isBookmarked || false)
  const [imageError, setImageError] = useState(false)

  // Apply context defaults if props not provided
  const defaults = getContextDefaults(context)
  const finalVariant = variant || defaults.variant
  const finalActions = actions || defaults.actions
  const finalShowElements = showElements || defaults.showElements

  const handleAction = (action: string) => {
    if (action === 'bookmark') {
      setIsBookmarked(!isBookmarked)
    }
    onAction?.(action, course)
  }

  const courseUrl = `/courses/${course.id}`
  const hasDiscount = course.originalPrice && course.price && course.originalPrice > course.price

  // Common elements used across variants
  const renderThumbnail = (aspectRatio: string = 'aspect-video', size: string = 'h-48') => (
    <div className={`relative ${aspectRatio} ${size} bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg overflow-hidden`}>
      {course.thumbnailUrl && !imageError ? (
        <Image
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          className="object-cover"
          priority={priority}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <BookOpen className="w-12 h-12 text-primary/60" />
        </div>
      )}

      {/* Overlay badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        {course.isFeatured && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Kiemelt
          </div>
        )}
        {finalShowElements.includes('category') && course.category && (
          <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            {categoryIcons[typeof course.category === 'string' ? course.category : (course.category as any)?.name]} {typeof course.category === 'string' ? course.category : (course.category as any)?.name}
          </div>
        )}
      </div>

      {/* Rating badge */}
      {finalShowElements.includes('rating') && course.rating && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          {course.rating}
        </div>
      )}

      {/* Video play button */}
      {course.hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // Navigate to first lesson
              window.location.href = `/courses/${course.slug || course.id}/lessons/lesson-1`
            }}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 cursor-pointer">
            <Play className="w-5 h-5 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Progress bar for enrolled courses */}
      {finalShowElements.includes('progress') && course.progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
          <div className="text-white text-xs mt-1">{course.progress}% befejezve</div>
        </div>
      )}
    </div>
  )

  const renderPrice = () => {
    if (!finalShowElements.includes('price') || !course.price) return null

    return (
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-green-600">
          {course.price.toLocaleString('hu-HU')} Ft
        </span>
        {hasDiscount && (
          <span className="text-sm text-gray-500 line-through">
            {course.originalPrice?.toLocaleString('hu-HU')} Ft
          </span>
        )}
        {hasDiscount && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            -{Math.round(((course.originalPrice! - course.price!) / course.originalPrice!) * 100)}%
          </span>
        )}
      </div>
    )
  }

  const renderStats = () => (
    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
      {finalShowElements.includes('rating') && course.rating && (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="font-medium">{course.rating}</span>
          {course.ratingCount && <span>({course.ratingCount})</span>}
        </div>
      )}
      
      {finalShowElements.includes('students') && course.enrollmentCount && (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{course.enrollmentCount} hallgató</span>
        </div>
      )}

      {finalShowElements.includes('duration') && course.duration && (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{course.duration}h</span>
        </div>
      )}

      {finalShowElements.includes('difficulty') && course.difficulty && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty] || 'bg-gray-100 text-gray-800'}`}>
          {course.difficulty}
        </span>
      )}
    </div>
  )

  const renderInstructor = () => {
    if (!finalShowElements.includes('instructor') || !course.instructor) return null

    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          {course.instructor.imageUrl ? (
            <Image
              src={course.instructor.imageUrl}
              alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-primary">
              {course.instructor.firstName[0]}{course.instructor.lastName[0]}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {course.instructor.firstName} {course.instructor.lastName}
          </div>
          {course.instructor.title && (
            <div className="text-sm text-gray-600 truncate">{course.instructor.title}</div>
          )}
        </div>
      </div>
    )
  }

  const renderUniversity = () => {
    if (!finalShowElements.includes('university') || !course.university) return null

    return (
      <div className="flex items-center gap-2">
        {course.university.logoUrl && (
          <Image
            src={course.university.logoUrl}
            alt={course.university.name}
            width={20}
            height={20}
            className="rounded object-cover"
          />
        )}
        <span className="text-sm text-gray-600 truncate">{course.university.name}</span>
      </div>
    )
  }

  const renderActions = () => (
    <div className="flex gap-2 flex-wrap">
      {finalActions.map(action => {
        switch (action) {
          case 'enroll':
            return (
              <button
                key={action}
                onClick={() => handleAction('enroll')}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-center min-w-[120px]"
              >
                {course.isEnrolled ? 'Beiratkozva' : 'Beiratkozás'}
              </button>
            )
          
          case 'purchase':
            return (
              <button
                key={action}
                onClick={() => handleAction('purchase')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center min-w-[120px]"
              >
                📚 Beiratkozás
              </button>
            )
          
          case 'continue':
            return (
              <button
                key={action}
                onClick={() => handleAction('continue')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center min-w-[120px]"
              >
                Folytatás
              </button>
            )
          
          case 'details':
            return (
              <Link
                key={action}
                href={courseUrl}
                className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors text-center"
              >
                Részletek
              </Link>
            )
          
          case 'bookmark':
            return (
              <button
                key={action}
                onClick={() => handleAction('bookmark')}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )
          
          case 'share':
            return (
              <button
                key={action}
                onClick={() => handleAction('share')}
                className="p-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Share className="w-4 h-4" />
              </button>
            )
          
          default:
            return null
        }
      })}
    </div>
  )

  // Variant-specific layouts
  const renderDefault = () => (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:scale-[1.02] ${className}`}>
      {renderThumbnail()}
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          <div className="mt-2 space-y-2">
            {renderUniversity()}
            {renderInstructor()}
          </div>
        </div>

        {renderStats()}
        {renderPrice()}

        <div className="pt-2">
          {renderActions()}
        </div>
      </div>
    </div>
  )

  const renderCompact = () => (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 ${className}`}>
      <div className="flex gap-4 p-4">
        {renderThumbnail('aspect-square', 'h-16 w-16')}
        
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-medium text-gray-900 line-clamp-1 text-sm">
            {course.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {course.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  {course.rating}
                </div>
              )}
              {course.duration && <span>{course.duration}h</span>}
              {course.price && (
                <span className="font-bold text-green-600">
                  {(course.price / 1000).toFixed(0)}k Ft
                </span>
              )}
            </div>
            
            <button
              onClick={() => handleAction(course.price && course.price > 0 ? 'purchase' : 'enroll')}
              className={`${course.price && course.price > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary-dark'} text-white px-3 py-1 rounded-md text-xs font-medium transition-colors`}
            >
              {course.isEnrolled ? 'Folytatás' : 'Beiratkozás'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFeatured = () => (
    <div className={`group relative bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border border-gray-100 hover:scale-[1.02] ${className}`}>
      {/* Featured Badge */}
      <div className="absolute top-6 left-6 z-20">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          KIEMELT
        </div>
      </div>

      {renderThumbnail('aspect-video', 'h-72')}
      
      <div className="p-8 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors mb-3">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-gray-600 line-clamp-3 leading-relaxed mb-4">
              {course.description}
            </p>
          )}

          <div className="space-y-3">
            {renderInstructor()}
            {renderUniversity()}
          </div>
        </div>

        {renderStats()}
        {renderPrice()}

        <div className="flex gap-4">
          <button
            onClick={() => handleAction(course.price && course.price > 0 ? 'purchase' : 'enroll')}
            className={`flex-1 ${course.price && course.price > 0 ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-primary to-primary-dark'} text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all hover:scale-105`}
          >
            🎯 Beiratkozás Most
          </button>
          <Link
            href={courseUrl}
            className="px-8 py-4 border-2 border-primary text-primary rounded-xl font-bold text-lg hover:bg-primary hover:text-white transition-colors"
          >
            📚 Tudj meg többet
          </Link>
        </div>
      </div>
    </div>
  )

  const renderList = () => (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:bg-gray-50 ${className}`}>
      <div className="flex items-center gap-4 p-4">
        {renderThumbnail('aspect-square', 'h-16 w-16')}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
            {course.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {renderUniversity()}
            {course.category && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {typeof course.category === 'string' ? course.category : (course.category as any)?.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {course.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium">{course.rating}</span>
            </div>
          )}
          
          {course.price && (
            <div className="text-lg font-bold text-green-600">
              {(course.price / 1000).toFixed(0)}k Ft
            </div>
          )}
          
          <button
            onClick={() => handleAction(course.price && course.price > 0 ? 'purchase' : 'enroll')}
            className={`${course.price && course.price > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary-dark'} text-white px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap`}
          >
            Beiratkozás
          </button>
        </div>
      </div>
    </div>
  )

  const renderMinimal = () => (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-4 ${className}`}>
      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-2">
        {course.title}
      </h3>
      
      {course.university && (
        <div className="text-xs text-gray-600 mb-2">{course.university.name}</div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {course.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              {course.rating}
            </div>
          )}
          {course.price && (
            <span className="font-bold text-green-600">
              {(course.price / 1000).toFixed(0)}k Ft
            </span>
          )}
        </div>
        
        <Link
          href={courseUrl}
          className="text-primary hover:text-primary-dark text-xs font-medium"
        >
          Részletek
        </Link>
      </div>
    </div>
  )

  // Render appropriate variant
  switch (finalVariant) {
    case 'compact':
      return renderCompact()
    case 'featured':
      return renderFeatured()
    case 'list':
      return renderList()
    case 'minimal':
      return renderMinimal()
    default:
      return renderDefault()
  }
}