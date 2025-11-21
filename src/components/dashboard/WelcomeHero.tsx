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
      color: 'bg-gray-900 hover:bg-black',
      badge: 'Népszerű'
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Személyre szabott javaslatok',
      description: 'AI-alapú kurzusajánlatok',
      href: '/dashboard/browse?tab=recommended',
      color: 'bg-gray-800 hover:bg-gray-900',
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
              className={`${cardStyles.flat} p-6 cursor-pointer group`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${action?.color || 'bg-gray-900'} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  {action?.icon}
                </div>
                {action?.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#466C95] transition-colors">
                {action?.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {action?.description}
              </p>
              <div className="flex items-center text-gray-900 text-sm font-medium group-hover:text-[#466C95] transition-colors">
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
            <h2 className="text-2xl font-bold text-gray-900">Kiemelt Kurzusok</h2>
            <p className="text-gray-600 mt-1">A legkeresettebb tanulási lehetőségek</p>
          </div>
          <Link href="/dashboard/browse" className="text-gray-900 hover:text-gray-700 font-medium flex items-center">
            Összes megtekintése
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {trendingLoading ? (
          // Loading skeleton for trending courses
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredCourses.length === 0 ? (
          // Empty state when no courses available
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nincsenek elérhető kurzusok
                </h3>
                <p className="text-gray-600 text-sm">
                  Jelenleg nincs megjeleníthető kurzus. Kérjük, látogasson vissza később.
                </p>
              </div>
              <Link href="/dashboard/browse">
                <Button variant="outline">
                  Kurzusok böngészése
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCourses.map((course, index) => {
              // Map course data to display format
              const courseData = {
                id: course.id,
                title: course.title,
                category: course.category?.name || course.category || 'Általános',
                rating: course.averageRating || course.rating || 4.8,
                students: course.enrollmentCount || course.students || 0,
                instructor: course.instructor ?
                  `${course.instructor.firstName} ${course.instructor.lastName}` :
                  course.instructor || 'Oktató',
                level: course.difficulty || course.level || 'Kezdő',
                isPlus: course.isPlus || false,
                highlights: course.highlights || ['Gyakorlati', 'Interaktív', 'Tanúsítvány']
              }

              return (
                <motion.div
                  key={courseData.id}
                  className={`${cardStyles.flat} cursor-pointer group overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="h-48 relative" style={{ background: brandGradient }}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/20 text-white border-white/30">
                        {typeof courseData.category === 'string' ? courseData.category : (courseData.category as any)?.name || 'N/A'}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-yellow-500 text-yellow-900">
                        {courseData.isPlus ? 'DMA Plus' : 'Ingyenes próba'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white">
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="w-4 h-4 text-yellow-300" />
                          <span className="text-sm font-medium">{courseData.rating.toFixed(1)}</span>
                          <span className="text-sm text-white/80">({courseData.students} tanuló)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Badge variant="outline" className="text-xs mb-2">
                          {courseData.level === 'BEGINNER' ? 'Kezdő' :
                           courseData.level === 'INTERMEDIATE' ? 'Középhaladó' :
                           courseData.level === 'ADVANCED' ? 'Haladó' :
                           courseData.level === 'EXPERT' ? 'Szakértő' : courseData.level}
                        </Badge>
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {courseData.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {courseData.instructor}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {courseData.students}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {courseData.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {courseData.highlights.map((highlight, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>

                      <Link href={`/courses/${courseData.slug || courseData.id}`}>
                        <button className={`w-full ${buttonStyles.primaryLight} !rounded-lg !py-2.5 text-sm`}>
                          <Play className="w-4 h-4" />
                          <span>Kurzus megtekintése</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}