'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTrendingCourses } from '@/hooks/useCoursesCatalog'
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics'
import {
  BookOpen,
  TrendingUp,
  Target,
  Clock,
  Users,
  Star,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react'
import { brandGradient, glassMorphism, buttonStyles, cardStyles, animations } from '@/lib/design-tokens-premium'

/**
 * Welcome Hero Section - Dynamic First Experience
 * 
 * Eliminates empty state problem by providing rich, actionable content
 * for both new and returning users with engaging course discovery
 */

interface WelcomeHeroProps {
  userName?: string
  hasEnrolledCourses?: boolean
  isNewUser?: boolean
}

export function WelcomeHero({ userName, hasEnrolledCourses = false, isNewUser = true }: WelcomeHeroProps) {
  const [currentTip, setCurrentTip] = useState(0)

  // Real trending courses data
  const { data: trendingData, isLoading: trendingLoading } = useTrendingCourses(3)

  // Real platform analytics for hero stats
  const { data: platformData } = usePlatformAnalytics()

  // Only use real data - no fallback mock data
  const featuredCourses = trendingData?.courses?.slice(0, 3) || []

  const learningTips = [
    "💡 Tipp: Kezdje 15-20 perces leckékkel a hatékony tanuláshoz",
    "🎯 Tipp: Állítson be napi tanulási célokat a folyamatos fejlődéshez",
    "🏆 Tipp: Vegyen részt kvízekben a tudás elmélyítéséhez",
    "⚡ Tipp: Használja a jegyzetelési funkciót fontos részek kiemelésére"
  ]

  // Rotate learning tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % learningTips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [learningTips.length])

  const quickActions = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Kurzusok böngészése',
      description: 'Fedezze fel 100+ szakmai kurzust',
      href: '/dashboard/browse',
      color: 'bg-blue-600 hover:bg-blue-700',
      badge: 'Népszerű'
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Személyre szabott javaslatok',
      description: 'AI-alapú kurzusajánlatok',
      href: '/dashboard/browse?tab=recommended',
      color: 'bg-gray-700 hover:bg-gray-600',
      badge: 'Új'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Dynamic Welcome Header */}
      <motion.div
        className="rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden"
        style={{ background: brandGradient }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                <Badge className="bg-white/20 text-white border-white/30">
                  {isNewUser ? 'Üdvözöljük!' : 'Jó látni újra!'}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {hasEnrolledCourses 
                  ? `Folytassa tanulását, ${userName}!`
                  : `Kezdje meg tanulási útját, ${userName}!`
                }
              </h1>
              
              <p className="text-white/90 text-lg mb-6 max-w-2xl">
                {hasEnrolledCourses
                  ? 'Térjen vissza aktív kurzusaihoz, vagy fedezzen fel új területeket.'
                  : 'Több mint 100 szakmai kurzus vár Önre. Válassza ki a megfelelő tanulási utat és kezdje meg fejlődését még ma.'
                }
              </p>

              {/* Dynamic Learning Tip */}
              <motion.div
                className="rounded-lg p-4 mb-6"
                style={{
                  ...glassMorphism.badge,
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
                key={currentTip}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium">
                    {learningTips[currentTip]}
                  </span>
                </div>
              </motion.div>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                {hasEnrolledCourses ? (
                  <>
                    <Link href="/dashboard/my-learning">
                      <button className={`${buttonStyles.primaryDark} !text-gray-900`}>
                        <Play className="w-5 h-5" />
                        <span>Tanulás folytatása</span>
                      </button>
                    </Link>
                    <Link href="/dashboard/browse">
                      <button className={buttonStyles.secondaryDark}>
                        <BookOpen className="w-5 h-5" />
                        <span>Új kurzusok felfedezése</span>
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard/browse">
                      <button className={`${buttonStyles.primaryDark} !text-gray-900`}>
                        <BookOpen className="w-5 h-5" />
                        <span>Kurzusok böngészése</span>
                      </button>
                    </Link>
                    <Link href="/dashboard/browse?tab=recommended">
                      <button className={buttonStyles.secondaryDark}>
                        <Target className="w-5 h-5" />
                        <span>Személyre szabott javaslatok</span>
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="hidden lg:block text-right">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">
                    {platformData?.data?.totalCourses ? `${platformData.data.totalCourses}+` : '100+'}
                  </div>
                  <div className="text-white/80 text-sm">Szakmai kurzus</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {platformData?.data?.totalUsers ?
                      `${Math.floor(platformData.data.totalUsers / 1000)}K+` :
                      '25K+'
                    }
                  </div>
                  <div className="text-white/80 text-sm">Aktív tanuló</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {platformData?.data?.averageRating ?
                      `${platformData.data.averageRating}★` :
                      '4.8★'
                    }
                  </div>
                  <div className="text-white/80 text-sm">Átlag értékelés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <motion.div
              className="rounded-xl bg-[#1a1a1a] border border-gray-800 p-6 cursor-pointer group hover:border-gray-700 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${action?.color || 'bg-blue-600'} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  {action?.icon}
                </div>
                {action?.badge && (
                  <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full">
                    {action.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {action?.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {action?.description}
              </p>
              <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                Kezdés
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Featured Courses Preview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Kiemelt Kurzusok</h2>
            <p className="text-gray-400 mt-1">A legkeresettebb tanulási lehetőségek</p>
          </div>
          <Link href="/dashboard/browse" className="text-blue-400 hover:text-blue-300 font-medium flex items-center">
            Összes megtekintése
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {trendingLoading ? (
          // Loading skeleton for trending courses
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-[#1a1a1a] border border-gray-800 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-800" />
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-700 rounded-full w-16" />
                    <div className="h-5 bg-gray-700 rounded-full w-20" />
                  </div>
                  <div className="h-5 bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                  <div className="h-10 bg-gray-700 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredCourses.length === 0 ? (
          // Empty state when no courses available
          <div className="rounded-xl bg-[#1a1a1a] border border-gray-800 p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nincsenek elérhető kurzusok
                </h3>
                <p className="text-gray-400 text-sm">
                  Jelenleg nincs megjeleníthető kurzus. Kérjük, látogasson vissza később.
                </p>
              </div>
              <Link href="/dashboard/browse">
                <button className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                  Kurzusok böngészése
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCourses.map((course, index) => {
              // Map course data to display format
              const courseData = {
                id: course.id,
                slug: course.slug,
                title: course.title,
                description: course.description || course.shortDescription || '',
                thumbnail: course.thumbnailUrl || course.thumbnail || null,
                category: course.category?.name || course.category || 'Általános',
                rating: course.averageRating || course.rating || 4.8,
                students: course.enrollmentCount || course.students || 0,
                instructor: course.instructor ?
                  (typeof course.instructor === 'string' ? course.instructor : `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim()) :
                  'Oktató',
                level: course.difficulty || course.level || 'Kezdő',
                duration: course.totalDuration || course.duration || 0,
                lessonCount: course.lessonCount || course.totalLessons || 0,
              }

              // Format duration in hours and minutes
              const formatDuration = (minutes: number) => {
                if (minutes < 60) return `${minutes} perc`
                const hours = Math.floor(minutes / 60)
                const mins = minutes % 60
                return mins > 0 ? `${hours} ó ${mins} p` : `${hours} óra`
              }

              // Map level to Hungarian
              const getLevelText = (level: string) => {
                const levelMap: Record<string, string> = {
                  'BEGINNER': 'Kezdő',
                  'INTERMEDIATE': 'Középhaladó',
                  'ADVANCED': 'Haladó',
                  'EXPERT': 'Szakértő'
                }
                return levelMap[level] || level
              }

              return (
                <Link key={courseData.id} href={`/courses/${courseData.slug || courseData.id}`}>
                  <motion.div
                    className="rounded-xl bg-[#1a1a1a] border border-gray-800 cursor-pointer group overflow-hidden hover:border-gray-700 hover:shadow-xl hover:shadow-black/20 transition-all h-full flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video relative bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
                      {courseData.thumbnail ? (
                        <img
                          src={courseData.thumbnail}
                          alt={courseData.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-xs font-medium rounded">
                          {typeof courseData.category === 'string' ? courseData.category : 'Kurzus'}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                          {getLevelText(courseData.level)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors mb-2">
                        {courseData.title}
                      </h3>

                      {/* Description */}
                      {courseData.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                          {courseData.description}
                        </p>
                      )}

                      {/* Instructor */}
                      <p className="text-sm text-gray-500 mb-4">
                        {courseData.instructor}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto mb-4">
                        {courseData.duration > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDuration(courseData.duration)}</span>
                          </div>
                        )}
                        {courseData.lessonCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Play className="w-3.5 h-3.5" />
                            <span>{courseData.lessonCount} lecke</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{courseData.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
                        <span>Megtekintés</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}