'use client'

import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Zap,
  Trophy
} from 'lucide-react'
import { UserProgressData } from '@/types'
import { brandGradient, cardStyles, buttonStyles, animations } from '@/lib/design-tokens'

/**
 * Enhanced Dashboard Stats - Rich Content for All Users
 * 
 * Solves empty state problem by showing meaningful stats and platform insights
 * even for users with no enrolled courses
 */

interface EnhancedDashboardStatsProps {
  data: UserProgressData | null
  isLoading?: boolean
}

export function EnhancedDashboardStats({ data, isLoading }: EnhancedDashboardStatsProps) {
  const hasUserData = data && (data.totalCoursesEnrolled > 0 || data.totalHoursLearned > 0)

  // User's personal stats (when available)
  const userStats = [
    {
      title: 'Beiratkozott kurzusok',
      value: data?.totalCoursesEnrolled || 0,
      icon: BookOpen,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
      description: hasUserData ? 'Aktív tanulás' : 'Kezdje el első kurzusát'
    },
    {
      title: 'Tanulási idő',
      value: hasUserData ? `${data?.totalHoursLearned || 0} óra` : '0 óra',
      icon: Clock,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
      description: hasUserData ? 'Összesen' : 'Hamarosan növekedni fog'
    },
    {
      title: 'Befejezett kurzusok',
      value: data?.completedCourses || 0,
      icon: Award,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
      description: hasUserData ? 'Eredmények' : 'Első sikere vár'
    },
    {
      title: 'Aktuális szint',
      value: hasUserData ? (data?.currentStreak ? `${data.currentStreak} nap` : 'Kezdő') : 'Kezdő',
      icon: TrendingUp,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
      description: hasUserData ? 'Tanulási sorozat' : 'Építse fel rutinját'
    }
  ]


  // Weekly learning goals (motivational for new users)
  const weeklyGoals = [
    {
      title: 'Heti tanulási cél',
      current: hasUserData ? (data?.weeklyHours || 0) : 0,
      target: 5,
      unit: 'óra',
      color: 'bg-gray-900'
    },
    {
      title: 'Leckék a héten',
      current: hasUserData ? (data?.weeklyLessons || 0) : 0,
      target: 10,
      unit: 'lecke',
      color: 'bg-gray-800'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Personal Learning Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {hasUserData ? 'Tanulási Áttekintés' : 'Kezdje Meg Tanulási Útját'}
          </h2>
          {hasUserData && (
            <Badge className="bg-gray-100 text-gray-900">
              <Trophy className="w-3 h-3 mr-1" />
              Aktív tanuló
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                className={`${cardStyles.flat} p-6`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    {!hasUserData && index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Kezdés
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stat.description}
                    </div>
                  </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Weekly Goals (if user has data) */}
      {hasUserData && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Heti Célok</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weeklyGoals.map((goal, index) => (
              <motion.div
                key={index}
                className={`${cardStyles.flat} p-6`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <span className="text-sm text-gray-600">
                      {goal.current}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <Progress
                    value={(goal.current / goal.target) * 100}
                    className="h-2"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {goal.target - goal.current > 0
                      ? `Még ${goal.target - goal.current} ${goal.unit} a cél eléréséhez`
                      : '🎉 Heti cél teljesítve!'
                    }
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}


      {/* Motivational Call-to-Action for New Users */}
      {!hasUserData && (
        <motion.div
          className="text-white p-8 lg:p-12 text-center rounded-2xl relative overflow-hidden"
          style={{ background: brandGradient }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08), transparent 70%)'
            }} />

            <div className="relative z-10">
              <motion.div
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <BookOpen className="w-8 h-8" />
              </motion.div>
              <h3 className="text-xl lg:text-2xl font-bold mb-2">Készen áll az első lépésre?</h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Csatlakozzon 25,000+ tanulóhoz és kezdje meg szakmai fejlődését még ma!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className={`${buttonStyles.primaryDark} !text-gray-900`}>
                  <span>Első kurzus kiválasztása</span>
                </button>
                <button className={buttonStyles.secondaryDark}>
                  <span>Tanulási teszt kitöltése</span>
                </button>
              </div>
            </div>
        </motion.div>
      )}
    </div>
  )
}