"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  Calendar, 
  BarChart3,
  CheckCircle,
  PlayCircle,
  BookOpen,
  Brain,
  Video,
  FileText,
  Trophy,
  Flame,
  Star,
  ChevronRight,
  Download,
  Share2
} from 'lucide-react'

interface LessonProgress {
  lessonId: string
  lessonTitle: string
  lessonType: 'VIDEO' | 'TEXT' | 'QUIZ' | 'READING'
  moduleId: string
  moduleTitle: string
  completed: boolean
  watchPercentage: number
  timeSpent: number
  lastAccessed: Date
  quizScore?: number
  quizPassed?: boolean
  notes?: number
  bookmarks?: number
  achievements?: string[]
}

interface CourseProgressData {
  courseId: string
  courseTitle: string
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  totalTimeSpent: number
  averageScore: number
  completionPercentage: number
  streakDays: number
  lastActivityDate: Date
  estimatedCompletionDate: Date
  learningVelocity: number // lessons per week
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced'
  milestones: Array<{
    id: string
    title: string
    description: string
    targetValue: number
    currentValue: number
    completed: boolean
    completedAt?: Date
  }>
}

interface WeeklyProgress {
  week: string
  lessonsCompleted: number
  timeSpent: number
  quizzesPassed: number
  averageScore: number
}

interface CourseProgressTrackerProps {
  courseProgress: CourseProgressData
  lessonProgress: LessonProgress[]
  weeklyProgress: WeeklyProgress[]
  onExportProgress?: () => void
  onShareProgress?: () => void
  className?: string
}

export const CourseProgressTracker: React.FC<CourseProgressTrackerProps> = ({
  courseProgress,
  lessonProgress,
  weeklyProgress,
  onExportProgress,
  onShareProgress,
  className = ''
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [showDetailed, setShowDetailed] = useState(false)

  // Calculate learning analytics
  const learningAnalytics = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const getFilteredProgress = (cutoffDate: Date) => {
      return lessonProgress.filter(lesson => lesson.lastAccessed >= cutoffDate)
    }

    const weeklyLessons = getFilteredProgress(oneWeekAgo)
    const monthlyLessons = getFilteredProgress(oneMonthAgo)

    return {
      weeklyLessons: weeklyLessons.length,
      weeklyTime: weeklyLessons.reduce((sum, lesson) => sum + lesson.timeSpent, 0),
      monthlyLessons: monthlyLessons.length,
      monthlyTime: monthlyLessons.reduce((sum, lesson) => sum + lesson.timeSpent, 0),
      averageSessionTime: lessonProgress.length > 0 
        ? Math.round(lessonProgress.reduce((sum, lesson) => sum + lesson.timeSpent, 0) / lessonProgress.length / 60)
        : 0,
      favoriteType: getFavoriteContentType(),
      strongestSkill: getStrongestSkill()
    }
  }, [lessonProgress])

  const getFavoriteContentType = () => {
    const typeCounts = lessonProgress.reduce((acc, lesson) => {
      acc[lesson.lessonType] = (acc[lesson.lessonType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    )[0] || 'VIDEO'
  }

  const getStrongestSkill = () => {
    const quizLessons = lessonProgress.filter(lesson => 
      lesson.lessonType === 'QUIZ' && lesson.quizScore !== undefined
    )
    
    if (quizLessons.length === 0) return 'N/A'
    
    const averageScore = quizLessons.reduce((sum, lesson) => 
      sum + (lesson.quizScore || 0), 0
    ) / quizLessons.length

    if (averageScore >= 90) return 'Kiváló'
    if (averageScore >= 80) return 'Jó'
    if (averageScore >= 70) return 'Megfelelő'
    return 'Fejlesztendő'
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}ó ${minutes}p`
    }
    return `${minutes}p`
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-brand-secondary'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return Video
      case 'TEXT': return FileText
      case 'QUIZ': return Brain
      case 'READING': return BookOpen
      default: return FileText
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Progress Overview */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-brand-secondary/5 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand-secondary" />
                <span>Tanulási haladás</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{courseProgress.courseTitle}</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-secondary">
                {Math.round(courseProgress.completionPercentage)}%
              </div>
              <div className="text-sm text-gray-500">teljesítve</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <Progress value={courseProgress.completionPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{courseProgress.completedLessons} / {courseProgress.totalLessons} lecke</span>
                <span>Becsült befejezés: {formatDate(courseProgress.estimatedCompletionDate)}</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-brand-secondary/5 rounded-lg">
                <Clock className="w-6 h-6 text-brand-secondary mx-auto mb-1" />
                <div className="text-lg font-bold text-brand-secondary-hover">
                  {formatTime(courseProgress.totalTimeSpent)}
                </div>
                <div className="text-xs text-brand-secondary">Tanulási idő</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Award className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700">
                  {Math.round(courseProgress.averageScore)}%
                </div>
                <div className="text-xs text-green-600">Átlag pontszám</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-700">
                  {courseProgress.streakDays}
                </div>
                <div className="text-xs text-orange-600">Napos sorozat</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-700">
                  {courseProgress.learningVelocity.toFixed(1)}
                </div>
                <div className="text-xs text-purple-600">Lecke/hét</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Legutóbbi aktivitás</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ezen a héten:</span>
                <div className="text-right">
                  <div className="font-bold">{learningAnalytics.weeklyLessons} lecke</div>
                  <div className="text-xs text-gray-500">{formatTime(learningAnalytics.weeklyTime)}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ebben a hónapban:</span>
                <div className="text-right">
                  <div className="font-bold">{learningAnalytics.monthlyLessons} lecke</div>
                  <div className="text-xs text-gray-500">{formatTime(learningAnalytics.monthlyTime)}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Átlagos munkamenet:</span>
                <div className="font-bold">{learningAnalytics.averageSessionTime} perc</div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Kedvenc tartalom:</span>
                <div className="flex items-center space-x-1">
                  {React.createElement(getContentTypeIcon(learningAnalytics.favoriteType), {
                    className: 'w-4 h-4'
                  })}
                  <span className="font-bold text-sm">
                    {learningAnalytics.favoriteType === 'VIDEO' && 'Videó'}
                    {learningAnalytics.favoriteType === 'TEXT' && 'Szöveg'}
                    {learningAnalytics.favoriteType === 'QUIZ' && 'Kvíz'}
                    {learningAnalytics.favoriteType === 'READING' && 'Olvasmány'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Teljesítmény</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Szint:</span>
                <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">
                  {courseProgress.skillLevel}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Legerősebb terület:</span>
                <span className="font-bold">{learningAnalytics.strongestSkill}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Befejezett leckék</span>
                  <span className="font-medium">{courseProgress.completedLessons}/{courseProgress.totalLessons}</span>
                </div>
                <Progress 
                  value={(courseProgress.completedLessons / courseProgress.totalLessons) * 100} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kvíz átlag</span>
                  <span className={`font-medium ${getProgressColor(courseProgress.averageScore)}`}>
                    {Math.round(courseProgress.averageScore)}%
                  </span>
                </div>
                <Progress 
                  value={courseProgress.averageScore} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones & Achievements */}
      {courseProgress.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Mérföldkövek</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courseProgress.milestones.map((milestone) => (
                <div 
                  key={milestone.id} 
                  className={`p-3 rounded-lg border ${
                    milestone.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{milestone.title}</h4>
                    {milestone.completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Haladás</span>
                      <span className="font-medium">
                        {milestone.currentValue}/{milestone.targetValue}
                      </span>
                    </div>
                    <Progress 
                      value={(milestone.currentValue / milestone.targetValue) * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  {milestone.completedAt && (
                    <div className="text-xs text-green-600 mt-2">
                      Teljesítve: {formatDate(milestone.completedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {onExportProgress && (
          <Button variant="outline" onClick={onExportProgress}>
            <Download className="w-4 h-4 mr-2" />
            Haladás exportálása
          </Button>
        )}
        
        {onShareProgress && (
          <Button variant="outline" onClick={onShareProgress}>
            <Share2 className="w-4 h-4 mr-2" />
            Haladás megosztása
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={() => setShowDetailed(!showDetailed)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {showDetailed ? 'Kevesebb részlet' : 'Részletes nézet'}
        </Button>
      </div>

      {/* Detailed Analytics (collapsible) */}
      {showDetailed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Részletes elemzés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Weekly Progress Chart */}
              <div>
                <h4 className="font-medium mb-3">Heti haladás</h4>
                <div className="space-y-2">
                  {weeklyProgress.map((week, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{week.week}</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{week.lessonsCompleted} lecke</span>
                        <span>{formatTime(week.timeSpent)}</span>
                        <span>{week.averageScore}% átlag</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Lessons */}
              <div>
                <h4 className="font-medium mb-3">Legutóbbi leckék</h4>
                <div className="space-y-2">
                  {lessonProgress.slice(0, 5).map((lesson) => {
                    const LessonIcon = getContentTypeIcon(lesson.lessonType)
                    return (
                      <div key={lesson.lessonId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <LessonIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{lesson.lessonTitle}</span>
                          {lesson.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(lesson.lastAccessed)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}