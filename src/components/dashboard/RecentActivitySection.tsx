'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Award, BookOpen, Play, CheckCircle, Target, Zap, Users, TrendingUp, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserProgressData, Activity, ActivityType, ActivityPriority } from '@/types'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { hu } from 'date-fns/locale'

/**
 * Recent Activity Section - Enhanced Timeline
 * Shows user's recent learning activities with hybrid activity system
 */

interface RecentActivitySectionProps {
  data: UserProgressData | null
  isLoading?: boolean
}

type ActivityTimeFilter = '7days' | '30days' | 'all'

interface ActivityGroup {
  date: string
  displayDate: string
  activities: Activity[]
}

export function RecentActivitySection({ data, isLoading = false }: RecentActivitySectionProps) {
  const [timeFilter, setTimeFilter] = useState<ActivityTimeFilter>('7days')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['today', 'yesterday']))

  // Get activities from user progress data
  const activities: Activity[] = data?.recentActivities || []
  
  // If no enrolled courses, don't show this section
  if (!data?.enrolledCourses || data.enrolledCourses.length === 0) {
    return null;
  }

  // Filter activities by time range
  const getFilteredActivities = (filter: ActivityTimeFilter): Activity[] => {
    const now = new Date()
    let cutoffDate: Date

    switch (filter) {
      case '7days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        return activities
    }

    return activities.filter(activity => new Date(activity.createdAt) >= cutoffDate)
  }

  // Group activities by date
  const groupActivitiesByDate = (activities: Activity[]): ActivityGroup[] => {
    const groups: Record<string, Activity[]> = {}

    activities.forEach(activity => {
      const activityDate = new Date(activity.createdAt)
      const dateKey = format(activityDate, 'yyyy-MM-dd')
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })

    return Object.entries(groups)
      .map(([dateKey, activities]) => {
        const date = new Date(dateKey)
        let displayDate: string
        
        if (isToday(date)) {
          displayDate = 'Ma'
        } else if (isYesterday(date)) {
          displayDate = 'Tegnap'
        } else {
          displayDate = format(date, 'MMMM d.', { locale: hu })
        }

        return {
          date: dateKey,
          displayDate,
          activities: activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const filteredActivities = getFilteredActivities(timeFilter)
  const activityGroups = groupActivitiesByDate(filteredActivities)

  const toggleGroupExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Loading state
  if (isLoading) {
    return <RecentActivityLoadingSkeleton />
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Legutóbbi tevékenység</h2>
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Kezdje meg tanulási útját!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Itt fogja látni legutóbbi tanulási tevékenységeit, előrehaladását és eredményeit.
            </p>
            <Link href="/courses">
              <Button size="lg" className="flex items-center mx-auto">
                <BookOpen className="w-5 h-5 mr-2" />
                Első kurzus indítása
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Legutóbbi tevékenység</h2>
        
        {/* Time Filter Controls */}
        <div className="flex gap-2">
          {[
            { key: '7days' as ActivityTimeFilter, label: '7 nap' },
            { key: '30days' as ActivityTimeFilter, label: '30 nap' },
            { key: 'all' as ActivityTimeFilter, label: 'Összes' }
          ].map(filter => (
            <Button
              key={filter.key}
              variant={timeFilter === filter.key ? "default" : "secondary"}
              size="sm"
              onClick={() => setTimeFilter(filter.key)}
              className={
                timeFilter === filter.key 
                  ? 'bg-teal-600 text-white hover:bg-teal-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nincs tevékenység ebben az időszakban
            </h3>
            <p className="text-gray-600 mb-6">
              {timeFilter === '7days' ? 'Az elmúlt 7 napban' : 
               timeFilter === '30days' ? 'Az elmúlt 30 napban' : 
               'Eddig'} nem volt tanulási tevékenység.
            </p>
            <Link href="/courses">
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Tanulás indítása
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activityGroups.slice(0, 5).map(group => (
            <Card key={group.date} className="overflow-hidden">
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGroupExpansion(group.date)}
              >
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {expandedGroups.has(group.date) ? 
                        <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      }
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">{group.displayDate}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                    {group.activities.length} tevékenység
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              {expandedGroups.has(group.date) && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {group.activities.map(activity => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Activity Summary Stats */}
      {filteredActivities.length > 0 && (
        <Card className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {filteredActivities.length}
                </div>
                <div className="text-teal-100 text-sm">Összes tevékenység</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {filteredActivities.filter(a => a.priority === ActivityPriority.HIGH).length}
                </div>
                <div className="text-teal-100 text-sm">Fontos eredmény</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {new Set(filteredActivities.map(a => a.courseId).filter(Boolean)).size}
                </div>
                <div className="text-teal-100 text-sm">Aktív kurzus</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View All Activities Link */}
      {activities.length > 0 && (
        <div className="text-center">
          <Link href="/dashboard/activity">
            <Button variant="outline" className="flex items-center mx-auto">
              <Clock className="w-4 h-4 mr-2" />
              Összes tevékenység megtekintése
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

// Individual activity item component
function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityIcon = (type: ActivityType, priority: ActivityPriority) => {
    const iconClass = `w-5 h-5 ${
      priority === ActivityPriority.HIGH ? 'text-green-600' :
      priority === ActivityPriority.MEDIUM ? 'text-teal-600' :
      'text-gray-600'
    }`

    switch (type) {
      case ActivityType.COURSE_ENROLLED:
        return <Users className={iconClass} />
      case ActivityType.COURSE_COMPLETED:
        return <Award className={`${iconClass} text-yellow-600`} />
      case ActivityType.CERTIFICATE_EARNED:
        return <Award className={`${iconClass} text-yellow-600`} />
      case ActivityType.MILESTONE_REACHED:
        return <Target className={`${iconClass} text-green-600`} />
      case ActivityType.QUIZ_MASTERED:
        return <Zap className={`${iconClass} text-purple-600`} />
      case ActivityType.LESSON_COMPLETED:
        return <CheckCircle className={iconClass} />
      case ActivityType.LEARNING_SESSION:
        return <Play className={iconClass} />
      default:
        return <BookOpen className={iconClass} />
    }
  }

  const getPriorityBadge = (priority: ActivityPriority) => {
    const variants = {
      [ActivityPriority.HIGH]: 'bg-green-100 text-green-800',
      [ActivityPriority.MEDIUM]: 'bg-teal-100 text-teal-800',
      [ActivityPriority.LOW]: 'bg-gray-100 text-gray-600'
    }

    const labels = {
      [ActivityPriority.HIGH]: 'Fontos',
      [ActivityPriority.MEDIUM]: 'Közepes',
      [ActivityPriority.LOW]: 'Alacsony'
    }

    return (
      <Badge className={`text-xs ${variants[priority]}`}>
        {labels[priority]}
      </Badge>
    )
  }

  const activityTime = formatDistanceToNow(new Date(activity.createdAt), { 
    addSuffix: true,
    locale: hu 
  })

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.type, activity.priority)}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <h4 className="font-medium text-gray-900 mb-1">
              {activity.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {activity.description}
            </p>
            
            {activity.courseName && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <BookOpen className="w-3 h-3" />
                <span>{activity.courseName}</span>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 ml-4 text-right">
            {getPriorityBadge(activity.priority)}
            <div className="text-xs text-gray-500 mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              {activityTime}
            </div>
          </div>
        </div>

        {/* Activity metadata */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activity.metadata.completionPercentage !== undefined && (
              <Badge variant="outline" className="text-xs">
                {activity.metadata.completionPercentage}% teljesítve
              </Badge>
            )}
            {activity.metadata.quizScore !== undefined && (
              <Badge variant="outline" className="text-xs">
                Quiz: {activity.metadata.quizScore}%
              </Badge>
            )}
            {activity.metadata.lessonsCompleted !== undefined && (
              <Badge variant="outline" className="text-xs">
                {activity.metadata.lessonsCompleted} lecke
              </Badge>
            )}
            {activity.metadata.totalTimeSpent !== undefined && (
              <Badge variant="outline" className="text-xs">
                {Math.round(activity.metadata.totalTimeSpent / 60)} perc
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Loading skeleton
function RecentActivityLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Activity groups skeleton */}
      {[1, 2].map((group) => (
        <Card key={group} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-1"></div>
                  <div className="flex-grow">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="h-5 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}