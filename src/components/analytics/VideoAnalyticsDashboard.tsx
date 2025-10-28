"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  SkipForward, 
  Settings, 
  Maximize, 
  Clock, 
  Users, 
  TrendingUp,
  Video,
  Eye,
  Target,
  BarChart3
} from 'lucide-react'

// Mock data structure - this would come from your analytics API
interface VideoAnalyticsData {
  totalViews: number
  totalWatchTime: number // in minutes
  averageWatchTime: number // in minutes
  completionRate: number // percentage
  engagementScore: number // events per minute
  mostWatchedLessons: Array<{
    id: string
    title: string
    views: number
    avgCompletionRate: number
  }>
  userEngagement: Array<{
    type: 'play' | 'pause' | 'seek' | 'rate_change' | 'fullscreen'
    count: number
    percentage: number
  }>
  watchTimeDistribution: Array<{
    timeRange: string
    users: number
    percentage: number
  }>
  retentionCurve: Array<{
    timestamp: number
    retentionRate: number
  }>
}

// Mock data - replace with real API call
const mockAnalyticsData: VideoAnalyticsData = {
  totalViews: 15420,
  totalWatchTime: 8940,
  averageWatchTime: 12.4,
  completionRate: 68.5,
  engagementScore: 4.2,
  mostWatchedLessons: [
    { id: '1', title: 'Bevezetés a React alapokba', views: 2340, avgCompletionRate: 85.2 },
    { id: '2', title: 'Component lifecycle', views: 1980, avgCompletionRate: 72.8 },
    { id: '3', title: 'State management', views: 1756, avgCompletionRate: 69.3 },
    { id: '4', title: 'Hooks használata', views: 1654, avgCompletionRate: 78.1 },
    { id: '5', title: 'Testing React apps', views: 1432, avgCompletionRate: 61.9 },
  ],
  userEngagement: [
    { type: 'play', count: 45230, percentage: 42.1 },
    { type: 'pause', count: 23450, percentage: 21.8 },
    { type: 'seek', count: 19870, percentage: 18.5 },
    { type: 'rate_change', count: 12340, percentage: 11.5 },
    { type: 'fullscreen', count: 6540, percentage: 6.1 },
  ],
  watchTimeDistribution: [
    { timeRange: '0-25%', users: 2340, percentage: 23.4 },
    { timeRange: '25-50%', users: 1980, percentage: 19.8 },
    { timeRange: '50-75%', users: 2456, percentage: 24.6 },
    { timeRange: '75-100%', users: 3224, percentage: 32.2 },
  ],
  retentionCurve: [
    { timestamp: 0, retentionRate: 100 },
    { timestamp: 30, retentionRate: 89.2 },
    { timestamp: 60, retentionRate: 82.1 },
    { timestamp: 120, retentionRate: 74.5 },
    { timestamp: 180, retentionRate: 68.9 },
    { timestamp: 300, retentionRate: 58.2 },
    { timestamp: 600, retentionRate: 42.1 },
    { timestamp: 900, retentionRate: 35.8 },
  ]
}

interface VideoAnalyticsDashboardProps {
  courseId?: string
  lessonId?: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
}

export const VideoAnalyticsDashboard: React.FC<VideoAnalyticsDashboardProps> = ({
  courseId,
  lessonId,
  timeRange = '30d'
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'engagement' | 'completion'>('views')
  const [isClient, setIsClient] = useState(false)

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  const data = mockAnalyticsData

  // Show loading during SSR/hydration
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Videó Analitika</h2>
          <p className="text-gray-600">Részletes betekintés a videó nézettségbe és felhasználói interakciókba</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === '7d' ? '7 nap' : range === '30d' ? '30 nap' : range === '90d' ? '90 nap' : '1 év'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes megtekintés</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12.5% az előző időszakhoz képest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes nézési idő</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(data.totalWatchTime / 60)}h {data.totalWatchTime % 60}m</div>
            <p className="text-xs text-muted-foreground">
              Átlag: {data.averageWatchTime} perc/felhasználó
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Befejezési arány</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completionRate}%</div>
            <Progress value={data.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.engagementScore}</div>
            <p className="text-xs text-muted-foreground">
              Interakció/perc
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Most Watched Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Legnépszerűbb leckék</CardTitle>
          <CardDescription>A legtöbbet megtekintett videó leckék</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.mostWatchedLessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{lesson.title}</h4>
                    <p className="text-sm text-gray-600">{lesson.views.toLocaleString()} megtekintés</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{lesson.avgCompletionRate}%</div>
                  <div className="text-xs text-gray-500">befejezési arány</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Felhasználói interakciók</CardTitle>
            <CardDescription>Interakció típusok megoszlása</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.userEngagement.map((engagement) => {
                const Icon = {
                  play: Play,
                  pause: Pause,
                  seek: SkipForward,
                  rate_change: Settings,
                  fullscreen: Maximize,
                }[engagement.type]

                return (
                  <div key={engagement.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="capitalize text-sm">
                        {engagement.type === 'rate_change' ? 'Sebesség váltás' :
                         engagement.type === 'fullscreen' ? 'Teljes képernyő' :
                         engagement.type === 'seek' ? 'Ugrás' :
                         engagement.type === 'play' ? 'Lejátszás' : 'Megállítás'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{engagement.count.toLocaleString()}</span>
                      <Badge variant="secondary">{engagement.percentage}%</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nézési idő megoszlás</CardTitle>
            <CardDescription>Hány felhasználó nézte meg a videó mekkora részét</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.watchTimeDistribution.map((range) => (
                <div key={range.timeRange} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{range.timeRange}</span>
                    <span>{range.users.toLocaleString()} felhasználó</span>
                  </div>
                  <Progress value={range.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Curve */}
      <Card>
        <CardHeader>
          <CardTitle>Megtartási görbe</CardTitle>
          <CardDescription>Hány százalék nézi még a videót az idő függvényében</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.retentionCurve.map((point, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">
                  {Math.floor(point.timestamp / 60)}:{(point.timestamp % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <Progress value={point.retentionRate} className="h-2" />
                </div>
                <div className="w-12 text-sm font-medium text-right">
                  {point.retentionRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}