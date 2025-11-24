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
        <h2 className="text-xl font-semibold text-gray-900">Legutóbbi tevékenység</h2>
        <Link
          href="/dashboard/activity"
          className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          Összes
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 shadow-sm">
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
        return <Users className={`${iconClass} text-blue-600`} />
      case ActivityType.COURSE_COMPLETED:
        return <Award className={`${iconClass} text-yellow-600`} />
      case ActivityType.CERTIFICATE_EARNED:
        return <Award className={`${iconClass} text-yellow-600`} />
      case ActivityType.MILESTONE_REACHED:
        return <Target className={`${iconClass} text-green-600`} />
      case ActivityType.QUIZ_MASTERED:
        return <Zap className={`${iconClass} text-purple-600`} />
      case ActivityType.LESSON_COMPLETED:
        return <CheckCircle className={`${iconClass} text-green-600`} />
      case ActivityType.LEARNING_SESSION:
        return <Play className={`${iconClass} text-blue-600`} />
      default:
        return <BookOpen className={`${iconClass} text-gray-500`} />
    }
  }

  const activityTime = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
    locale: hu
  })

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{activity.title}</p>
        <p className="text-xs text-gray-500 truncate">{activity.courseName}</p>
      </div>
      <div className="flex-shrink-0 text-xs text-gray-400">
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
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
      </div>
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}