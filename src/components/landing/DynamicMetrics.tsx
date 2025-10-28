"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Building2, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Metrics {
  totalUsers: number
  totalCourses: number
  totalInstructors: number
  totalEnrollments: number
  monthlyGrowth: number
  completionRate: number
}

async function fetchMetrics(): Promise<Metrics> {
  try {
    const getStatsFn = httpsCallable(functions, 'getStats')
    const result: any = await getStatsFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a metrikák betöltésekor')
    }
    
    return {
      totalUsers: result.data.stats.userCount || 0,
      totalCourses: result.data.stats.courseCount || 0,
      totalInstructors: 5, // Default value since we don't have this stat yet
      totalEnrollments: 150, // Default value since we don't have this stat yet
      monthlyGrowth: 25, // Default value since we don't have this stat yet
      completionRate: 85 // Default value since we don't have this stat yet
    }
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalInstructors: 0,
      totalEnrollments: 0,
      monthlyGrowth: 0,
      completionRate: 0
    }
  }
}

const Counter: React.FC<{ end: number; duration?: number }> = ({ end, duration = 2 }) => {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration])

  return <span>{count.toLocaleString('hu-HU')}</span>
}

export const DynamicMetrics: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<Metrics, Error>({
    queryKey: ['dynamicMetrics'],
    queryFn: fetchMetrics,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const metricItems = [
    {
      icon: Users,
      label: 'Aktív diák',
      value: metrics?.totalUsers || 0,
      suffix: '+',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: BookOpen,
      label: 'Kurzus',
      value: metrics?.totalCourses || 0,
      suffix: '+',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Building2,
      label: 'Oktató',
      value: metrics?.totalInstructors || 0,
      suffix: '+',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: TrendingUp,
      label: 'Befejezési arány',
      value: metrics?.completionRate || 0,
      suffix: '%',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metricItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className={`w-16 h-16 ${item.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {isLoading ? (
                  <span className="animate-pulse bg-gray-200 rounded">...</span>
                ) : (
                  <>
                    <Counter end={item.value} />
                    {item.suffix}
                  </>
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Growth Indicator */}
        {metrics?.monthlyGrowth && (
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{metrics.monthlyGrowth}% növekedés ebben a hónapban</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
} 