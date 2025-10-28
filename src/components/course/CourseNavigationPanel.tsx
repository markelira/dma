"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Lock, 
  Search, 
  Filter,
  ChevronDown,
  ChevronRight,
  Award,
  FileText,
  Video,
  Brain,
  BarChart3,
  Target,
  Calendar,
  Timer,
  TrendingUp,
  Star,
  Bookmark,
  Eye,
  Users,
  MessageSquare
} from 'lucide-react'

interface LessonProgress {
  lessonId: string
  completed: boolean
  watchPercentage: number
  timeSpent: number
  lastAccessed?: Date
  quizScore?: number
  quizPassed?: boolean
  notes?: number
  bookmarks?: number
}

interface ModuleProgress {
  moduleId: string
  completedLessons: number
  totalLessons: number
  progressPercentage: number
  timeSpent: number
  averageScore?: number
}

interface CourseStats {
  totalLessons: number
  completedLessons: number
  totalTimeSpent: number
  averageScore: number
  completionPercentage: number
  streakDays: number
  lastActivity?: Date
  achievements: Array<{
    id: string
    title: string
    description: string
    earnedAt: Date
    icon: string
  }>
}

interface CourseNavigationPanelProps {
  courseId: string
  currentLessonId: string
  course: any
  modules: any[]
  lessonProgress: Record<string, LessonProgress>
  moduleProgress: Record<string, ModuleProgress>
  courseStats: CourseStats
  hasSubscription: boolean
  onLessonSelect: (lessonId: string) => void
  onModuleToggle?: (moduleId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

type FilterType = 'all' | 'completed' | 'in-progress' | 'locked' | 'video' | 'text' | 'quiz' | 'reading'
type SortType = 'order' | 'progress' | 'recent' | 'duration'

export const CourseNavigationPanel: React.FC<CourseNavigationPanelProps> = ({
  courseId,
  currentLessonId,
  course,
  modules,
  lessonProgress,
  moduleProgress,
  courseStats,
  hasSubscription,
  onLessonSelect,
  onModuleToggle,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('order')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(false)

  // Auto-expand module containing current lesson
  useEffect(() => {
    const currentModule = modules.find(module => 
      module.lessons.some((lesson: any) => lesson.id === currentLessonId)
    )
    if (currentModule) {
      setExpandedModules(prev => new Set([...prev, currentModule.id]))
    }
  }, [currentLessonId, modules])

  const getLessonIcon = (lesson: any) => {
    switch (lesson.type) {
      case 'VIDEO': return Video
      case 'TEXT': return FileText
      case 'QUIZ': return Brain
      case 'READING': return BookOpen
      default: return FileText
    }
  }

  const getLessonStatusIcon = (lessonId: string, lesson: any) => {
    const progress = lessonProgress[lessonId]
    const isLocked = !hasSubscription && lesson.subscriptionTier === 'PREMIUM'
    
    if (isLocked) return Lock
    if (progress?.completed) return CheckCircle
    if (progress?.watchPercentage > 0) return Play
    return null
  }

  const getLessonStatusColor = (lessonId: string, lesson: any) => {
    const progress = lessonProgress[lessonId]
    const isLocked = !hasSubscription && lesson.subscriptionTier === 'PREMIUM'
    
    if (isLocked) return 'text-gray-400'
    if (progress?.completed) return 'text-green-500'
    if (progress?.watchPercentage > 0) return 'text-blue-500'
    return 'text-gray-400'
  }

  const filteredAndSortedLessons = useMemo(() => {
    let allLessons = modules.flatMap(module =>
      module.lessons.map((lesson: any) => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title,
        moduleOrder: module.order
      }))
    )

    // Apply search filter
    if (searchQuery) {
      allLessons = allLessons.filter(lesson =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type/status filter
    if (activeFilter !== 'all') {
      allLessons = allLessons.filter(lesson => {
        const progress = lessonProgress[lesson.id]
        const isLocked = !hasSubscription && lesson.subscriptionTier === 'PREMIUM'

        switch (activeFilter) {
          case 'completed':
            return progress?.completed
          case 'in-progress':
            return progress?.watchPercentage > 0 && !progress?.completed
          case 'locked':
            return isLocked
          case 'video':
          case 'text':
          case 'quiz':
          case 'reading':
            return lesson.type.toLowerCase() === activeFilter
          default:
            return true
        }
      })
    }

    // Apply sorting
    allLessons.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          const progressA = lessonProgress[a.id]?.watchPercentage || 0
          const progressB = lessonProgress[b.id]?.watchPercentage || 0
          return progressB - progressA
        case 'recent':
          const lastA = lessonProgress[a.id]?.lastAccessed?.getTime() || 0
          const lastB = lessonProgress[b.id]?.lastAccessed?.getTime() || 0
          return lastB - lastA
        case 'duration':
          return (b.duration || 0) - (a.duration || 0)
        default: // order
          if (a.moduleOrder !== b.moduleOrder) {
            return a.moduleOrder - b.moduleOrder
          }
          return a.order - b.order
      }
    })

    return allLessons
  }, [modules, searchQuery, activeFilter, sortBy, lessonProgress, hasSubscription])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
    onModuleToggle?.(moduleId)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}ó ${minutes}p`
    }
    return `${minutes}p`
  }

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">
              {Math.round(courseStats.completionPercentage)}%
            </span>
          </div>
          
          <div className="text-xs text-center text-gray-500 -rotate-90 whitespace-nowrap mt-8">
            Navigáció
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 truncate">{course.title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1 flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Haladás</span>
            <span className="font-medium">{Math.round(courseStats.completionPercentage)}%</span>
          </div>
          <Progress value={courseStats.completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{courseStats.completedLessons}/{courseStats.totalLessons} lecke</span>
            <span>{formatTime(courseStats.totalTimeSpent)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="lessons" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="lessons" className="text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            Leckék
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            Statisztika
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="flex-1 flex flex-col mt-2">
          {/* Search and Filters */}
          <div className="px-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Keresés leckékben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as FilterType)}
                className="text-xs border rounded px-2 py-1 bg-white flex-1"
              >
                <option value="all">Minden lecke</option>
                <option value="completed">Befejezett</option>
                <option value="in-progress">Folyamatban</option>
                <option value="locked">Zárolt</option>
                <option value="video">Videók</option>
                <option value="text">Szöveg</option>
                <option value="quiz">Kvízek</option>
                <option value="reading">Olvasmányok</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="order">Sorrend</option>
                <option value="progress">Haladás</option>
                <option value="recent">Legutóbbi</option>
                <option value="duration">Hossz</option>
              </select>
            </div>
          </div>

          {/* Lessons List */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-1 pb-4">
              {searchQuery || activeFilter !== 'all' ? (
                // Filtered view - flat list
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">
                    {filteredAndSortedLessons.length} találat
                  </div>
                  {filteredAndSortedLessons.map((lesson) => {
                    const progress = lessonProgress[lesson.id]
                    const isActive = lesson.id === currentLessonId
                    const isLocked = !hasSubscription && lesson.subscriptionTier === 'PREMIUM'
                    const StatusIcon = getLessonStatusIcon(lesson.id, lesson)
                    const LessonIcon = getLessonIcon(lesson)

                    return (
                      <Card
                        key={lesson.id}
                        className={`cursor-pointer transition-all hover:shadow-sm ${
                          isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => !isLocked && onLessonSelect(lesson.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <LessonIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`text-sm font-medium truncate ${
                                  isLocked ? 'text-gray-400' : isActive ? 'text-blue-700' : 'text-gray-900'
                                }`}>
                                  {lesson.title}
                                </h4>
                                {StatusIcon && (
                                  <StatusIcon className={`w-4 h-4 ${getLessonStatusColor(lesson.id, lesson)}`} />
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500 mb-2">
                                {lesson.moduleTitle}
                              </div>

                              {progress && !isLocked && (
                                <div className="space-y-1">
                                  <Progress value={progress.watchPercentage} className="h-1" />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{Math.round(progress.watchPercentage)}%</span>
                                    {progress.timeSpent > 0 && (
                                      <span>{formatTime(progress.timeSpent)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                // Module view - hierarchical
                <div className="space-y-2">
                  {modules.sort((a, b) => a.order - b.order).map((module) => {
                    const moduleProgressData = moduleProgress[module.id]
                    const isExpanded = expandedModules.has(module.id)

                    return (
                      <Card key={module.id} className="overflow-hidden">
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleModule(module.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer p-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`} />
                                  <BookOpen className="w-4 h-4 text-gray-600" />
                                  <h3 className="font-medium text-sm">{module.title}</h3>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {moduleProgressData && (
                                    <Badge className="text-xs bg-blue-100 text-blue-700">
                                      {moduleProgressData.completedLessons}/{moduleProgressData.totalLessons}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {moduleProgressData && (
                                <div className="mt-2">
                                  <Progress value={moduleProgressData.progressPercentage} className="h-1" />
                                </div>
                              )}
                            </CardHeader>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className="pt-0 pb-3">
                              <div className="space-y-1">
                                {module.lessons.sort((a: any, b: any) => a.order - b.order).map((lesson: any) => {
                                  const progress = lessonProgress[lesson.id]
                                  const isActive = lesson.id === currentLessonId
                                  const isLocked = !hasSubscription && lesson.subscriptionTier === 'PREMIUM'
                                  const StatusIcon = getLessonStatusIcon(lesson.id, lesson)
                                  const LessonIcon = getLessonIcon(lesson)

                                  return (
                                    <button
                                      key={lesson.id}
                                      onClick={() => !isLocked && onLessonSelect(lesson.id)}
                                      className={`w-full text-left p-2 rounded transition-colors ${
                                        isActive 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : isLocked 
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                      disabled={isLocked}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <LessonIcon className="w-3 h-3 flex-shrink-0" />
                                        <span className="text-sm truncate flex-1">{lesson.title}</span>
                                        {StatusIcon && (
                                          <StatusIcon className={`w-3 h-3 flex-shrink-0 ${getLessonStatusColor(lesson.id, lesson)}`} />
                                        )}
                                      </div>
                                      
                                      {progress && !isLocked && progress.watchPercentage > 0 && (
                                        <div className="mt-1 ml-5">
                                          <Progress value={progress.watchPercentage} className="h-0.5" />
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 pb-4">
            {/* Overall Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Összesített statisztika</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {courseStats.completedLessons}
                    </div>
                    <div className="text-xs text-blue-700">Befejezett lecke</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(courseStats.averageScore)}%
                    </div>
                    <div className="text-xs text-green-700">Átlag pontszám</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tanulási idő:</span>
                    <span className="font-medium">{formatTime(courseStats.totalTimeSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Napok sorozat:</span>
                    <span className="font-medium">{courseStats.streakDays} nap</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {courseStats.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>Eredmények</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courseStats.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                        <span className="text-lg">{achievement.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{achievement.title}</div>
                          <div className="text-xs text-gray-600">{achievement.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}