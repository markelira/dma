'use client'

import Link from 'next/link'
import { Clock, Award, BookOpen, Play, CheckCircle, Target, Zap, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { Activity, ActivityType, ActivityPriority } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { hu } from 'date-fns/locale'
import { useRecentActivities } from '@/hooks/useRecentActivities'

/**
 * Recent Activity Section - Simplified
 * Shows 5 most recent learning activities in a clean list
 */

export function RecentActivitySection() {
  const { data: activities = [], isLoading } = useRecentActivities(5)

  // Loading state
  if (isLoading) {
    return <RecentActivityLoadingSkeleton />
  }

  // Empty state - don't show section if no activities
  if (activities.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Legutóbbi tevékenység</h2>
        <Link
          href="/dashboard/activity"
          className="text-sm text-gray-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          Összes
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-gray-800 divide-y divide-gray-800">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}

// Compact activity item
function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityIcon = (type: ActivityType) => {
    const iconClass = 'w-4 h-4'
    switch (type) {
      case ActivityType.COURSE_ENROLLED:
        return <Users className={`${iconClass} text-blue-400`} />
      case ActivityType.COURSE_COMPLETED:
        return <Award className={`${iconClass} text-yellow-400`} />
      case ActivityType.CERTIFICATE_EARNED:
        return <Award className={`${iconClass} text-yellow-400`} />
      case ActivityType.MILESTONE_REACHED:
        return <Target className={`${iconClass} text-green-400`} />
      case ActivityType.QUIZ_MASTERED:
        return <Zap className={`${iconClass} text-purple-400`} />
      case ActivityType.LESSON_COMPLETED:
        return <CheckCircle className={`${iconClass} text-green-400`} />
      case ActivityType.LEARNING_SESSION:
        return <Play className={`${iconClass} text-blue-400`} />
      default:
        return <BookOpen className={`${iconClass} text-gray-400`} />
    }
  }

  const activityTime = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
    locale: hu
  })

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{activity.title}</p>
        <p className="text-xs text-gray-500 truncate">{activity.courseName}</p>
      </div>
      <div className="flex-shrink-0 text-xs text-gray-500">
        {activityTime}
      </div>
    </div>
  )
}

// Compact loading skeleton
function RecentActivityLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-800 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-16 animate-pulse" />
      </div>
      <div className="rounded-xl bg-[#1a1a1a] border border-gray-800 divide-y divide-gray-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-1 animate-pulse" />
              <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}