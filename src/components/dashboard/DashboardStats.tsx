'use client'

import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react'
import { DashboardStats as DashboardStatsType } from '@/types'

/**
 * Dashboard Stats Overview
 * Real-time learning statistics from user progress data
 */

interface DashboardStatsProps {
  data: DashboardStatsType | null;
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const stats = [
    {
      title: 'Beiratkozott kurzusok',
      value: data?.totalCoursesEnrolled || 0,
      icon: BookOpen,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: 'Összes kurzus'
    },
    {
      title: 'Folyamatban',
      value: data?.coursesInProgress || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Aktív kurzusok'
    },
    {
      title: 'Befejezett',
      value: data?.coursesCompleted || 0,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Teljesített kurzusok'
    },
    {
      title: 'Tanulási órák',
      value: data?.totalHoursLearned || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Összesen',
      suffix: ' óra'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        const displayValue = `${stat.value}${stat.suffix || ''}`
        
        return (
          <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{displayValue}</p>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}