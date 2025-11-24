"use client"

import { useRouter } from 'next/navigation'
import { useCourse } from '@/hooks/useCourseQueries'
import { useLesson } from '@/hooks/useLessonQueries'
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer'
import { LessonResourcesList } from '@/components/lesson/LessonResourcesList'
import { DeviceSyncNotification } from '@/components/lesson/DeviceSyncNotification'
import { usePlayerData } from '@/hooks/usePlayerData'
import { LessonSidebar } from '@/components/lesson/LessonSidebar'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useLessonProgress } from '@/hooks/useLessonProgress'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDemoLearningStats, useDemoAchievements } from '@/lib/demoDataManager'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Monitor, ChevronLeft, ChevronRight, Play, CheckCircle, BookOpen, Menu, X, Clock, Lock } from 'lucide-react'

export default function LessonPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string }
  const router = useRouter()
  // Auth state will be retrieved with other properties below

  // Debug log
  console.log('🎯 [LessonPage] Params:', { courseId, lessonId });

  const { data: playerData, isLoading: pload } = usePlayerData(courseId, lessonId)
  const course = playerData?.course
  const cload = pload
  const { data: lesson, isLoading: lload, error: lessonError } = useLesson(lessonId, courseId)

  // Debug log for lesson data
  console.log('📚 [LessonPage] Lesson state:', {
    lesson: lesson?.id,
    loading: lload,
    error: lessonError?.message
  });
  const { data: subStatus } = useSubscriptionStatus()
  const progressMutation = useLessonProgress()
  const { authReady, isAuthenticated, user } = useAuthStore()
  const { stats, simulateCompletion } = useDemoLearningStats()
  const { achievements, earnAchievement } = useDemoAchievements()

  // Layout state management
  const [showSidebar, setShowSidebar] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showProgress, setShowProgress] = useState(false)

  // Auto-expand first module on mount
  useEffect(() => {
    if (course?.modules && course.modules.length > 0 && expandedModules.size === 0) {
      setExpandedModules(new Set([course.modules[0].id]))
    }
  }, [course?.modules, expandedModules.size])

  // Module toggle function
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }
  
  // DEBUGGING: Log lesson data received
  console.log('🔍 [LessonPage] Lesson data from useLesson:', {
    hasLesson: !!lesson,
    isLoading: lload,
    hasError: !!lessonError,
    errorMessage: lessonError?.message,
    authReady,
    isAuthenticated,
    lessonId: lesson?.id,
    lessonTitle: lesson?.title,
    lessonType: lesson?.type,
    lessonKeys: Object.keys(lesson || {})
  });

  const hasSub = subStatus?.hasActiveSubscription ?? false

  // Auth check - enhanced with better loading states
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Autentikáció inicializálása...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  // Enhanced loading states
  if (cload || lload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {cload && 'Tartalom betöltése...'}
            {lload && 'Lecke betöltése...'}
          </p>
        </div>
      </div>
    )
  }
  
  // Enhanced error handling
  if (lessonError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hiba a lecke betöltésekor</h2>
          <p className="text-gray-600 mb-4">{lessonError.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Újrapróbálás
          </button>
        </div>
      </div>
    )
  }

  // If course or lesson not found
  if (!course) {
    return <div className="p-8 text-center text-red-600">Tartalom nem található.</div>
  }
  if (!lesson) {
    return <div className="p-8 text-center text-red-600">Lecke nem található.</div>
  }

  const modules = course?.modules || []

  // Find current lesson's module to compute navigation
  const flatLessons = modules.flatMap((m: any) =>
    (m.lessons as any[]).sort((a: any, b: any) => a.order - b.order).map((l: any) => ({ ...l, moduleId: m.id, moduleOrder: m.order }))
  )
  const currentIndex = flatLessons.findIndex((l: any) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex-1] : null
  const nextLesson = currentIndex < flatLessons.length-1 ? flatLessons[currentIndex+1] : null

  // Calculate REAL progress data from actual course data
  const completedLessons = flatLessons.filter((l: any) => l.progress?.completed || l.progress?.watchPercentage >= 90).length
  const totalLessons = flatLessons.length
  const realProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Find current module and lesson position
  const currentModule = modules.find((m: any) => 
    m.lessons.some((l: any) => l.id === lessonId)
  )
  const currentModuleIndex = modules.findIndex((m: any) => m.id === currentModule?.id)
  const currentLessonInModule = currentModule?.lessons.findIndex((l: any) => l.id === lessonId) + 1 || 0
  const totalLessonsInModule = currentModule?.lessons.length || 0

  // Calculate total course duration from all lessons
  const totalCourseDuration = flatLessons.reduce((acc: number, l: any) => {
    return acc + (parseInt(l.duration) || 0)
  }, 0)

  const handleProgress = (percentage: number, time: number, analytics?: any) => {
    if (percentage < 5) return
    
    // Send progress to backend
    progressMutation.mutate({ lessonId, watchPercentage: percentage, timeSpent: time })
    
    // Log analytics data for future use (with safe checks)
    if (analytics && analytics.engagementEvents && analytics.engagementEvents.length > 0) {
      console.log('📊 Video Analytics:', {
        sessionId: analytics.sessionId,
        totalEvents: analytics.engagementEvents.length,
        progressMarkers: analytics.progressMarkers?.length || 0,
        watchTime: time
      })
    }
  }

  const handleCompleted = () => {
    // Update lesson progress
    progressMutation.mutate({ lessonId, watchPercentage: 100 })
    
    // Simulate gamification updates
    simulateCompletion()
    
    // Check for achievements and show notifications
    setTimeout(() => {
      // First lesson achievement
      if (stats.totalLessonsCompleted === 0) {
        earnAchievement('first_lesson')
        toast.success('🎉 Első lecke kitüntetés!', {
          description: 'Kitűnő munka! Megszerezted az első leckét.',
          duration: 4000,
        })
      }
      
      // Streak achievements
      if (stats.currentStreak >= 6) {
        earnAchievement('week_streak')
        toast.success('🔥 Hetes sorozat!', {
          description: '7 nap egymás után tanultál. Fantasztikus!',
          duration: 4000,
        })
      }
      
      // Progress milestones
      const newProgress = Math.round(((stats.totalLessonsCompleted + 1) / 12) * 100)
      if (newProgress >= 25 && stats.totalLessonsCompleted < 3) {
        toast.success('🏆 Első negyedrész kész!', {
          description: '25% teljesítve. Jó úton haladsz!',
          duration: 4000,
        })
      }
      
      if (newProgress >= 50 && stats.totalLessonsCompleted < 6) {
        toast.success('🎯 Félúton vagy!', {
          description: '50% teljesítve. Folytatd így!',
          duration: 4000,
        })
      }
    }, 1000)
    
    // Auto-advance to next lesson
    if (course?.autoplayNext && nextLesson) {
      setTimeout(() => {
        router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)
      }, 2000) // Delay to show achievement notifications
    }
  }

  // Progress calculation helpers
  const getTotalProgress = () => {
    return realProgress
  }

  const getModuleProgress = (moduleId: string) => {
    const module = modules.find((m: any) => m.id === moduleId)
    if (!module) return 0
    const completedInModule = module.lessons.filter((l: any) =>
      l.progress?.completed || l.progress?.watchPercentage >= 90
    ).length
    return Math.round((completedInModule / module.lessons.length) * 100)
  }

  // Navigation helpers
  const getNextLesson = () => {
    return nextLesson ? { moduleId: nextLesson.moduleId, lessonId: nextLesson.id } : null
  }

  const getPrevLesson = () => {
    return prevLesson ? { moduleId: prevLesson.moduleId, lessonId: prevLesson.id } : null
  }

  const navigateToLesson = (moduleId: string, lessonId: string) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}`)
  }

  const markLessonComplete = (lessonId: string) => {
    progressMutation.mutate({ lessonId, watchPercentage: 100 })
  }

  const locked = !hasSub && ((lesson as any)?.subscriptionTier === 'PREMIUM')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/courses/${courseId}`)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>

            <div className="border-l pl-4">
              <h1 className="font-semibold text-gray-900 truncate max-w-md">
                {lesson?.title}
              </h1>
              <p className="text-sm text-gray-600">{course?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentIndex + 1} of {totalLessons}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!showSidebar)}
              className="lg:hidden"
            >
              {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-r p-6 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>

            <div className="space-y-4">
              {modules.map((module: any) => (
                <div key={module.id}>
                  <h4 className="font-medium text-gray-900 mb-2">{module.title}</h4>
                  <div className="space-y-1">
                    {module.lessons.map((moduleLesson: any, index: number) => {
                      const isCurrentLesson = moduleLesson.id === lessonId
                      const isCompleted = moduleLesson.progress?.completed || moduleLesson.progress?.watchPercentage >= 90
                      const isLocked = false // Based on course progression

                      return (
                        <button
                          key={moduleLesson.id}
                          onClick={() => navigateToLesson(module.id, moduleLesson.id)}
                          disabled={isLocked}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            isCurrentLesson
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : isCompleted
                              ? 'bg-green-50 border-green-200 hover:bg-green-100'
                              : isLocked
                              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : isCurrentLesson ? (
                                  <Play className="w-4 h-4 text-blue-600" />
                                ) : isLocked ? (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                ) : moduleLesson.type === 'VIDEO' ? (
                                  <Play className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <BookOpen className="w-4 h-4 text-gray-400" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">
                                  {moduleLesson.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {moduleLesson.type}
                                  </Badge>
                                  {moduleLesson.duration && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      <span>{Math.ceil(moduleLesson.duration / 60)}m</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 p-6 ${showSidebar ? 'pr-0' : ''}`}>
          <div className="max-w-4xl">
            {/* Video Player for Video Lessons */}
            {lesson && !locked && (
              <div className="mb-6">
                <LessonContentRenderer
                  lesson={lesson}
                  playerData={playerData}
                  courseId={courseId}
                  userId={user?.uid}
                  onProgress={handleProgress}
                  onCompleted={handleCompleted}
                  hasAccess={!locked}
                />
              </div>
            )}

            {locked && (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Előfizetés szükséges</h3>
                  <p className="text-gray-600 mb-4">Ez a lecke csak előfizetőknek érhető el.</p>
                  <Button onClick={() => router.push(`/courses/${courseId}`)}>
                    Előfizetés indítása
                  </Button>
                </div>
              </div>
            )}

            {/* Text Content for Non-Video Lessons */}
            {!locked && lesson?.type !== 'VIDEO' && lesson?.type !== 'PDF' && (
              <div className="bg-white p-8 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <Badge variant="outline">{lesson.type}</Badge>
                </div>

                <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>

                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{lesson.content}</p>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={() => markLessonComplete(lessonId)}
                    disabled={flatLessons.find((l: any) => l.id === lessonId)?.progress?.completed}
                    className={flatLessons.find((l: any) => l.id === lessonId)?.progress?.completed ? 'bg-green-600' : ''}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {flatLessons.find((l: any) => l.id === lessonId)?.progress?.completed ? 'Befejezve' : 'Befejezés jelölése'}
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div>
                {prevLesson && (
                  <Button
                    variant="outline"
                    onClick={() => navigateToLesson(prevLesson.moduleId, prevLesson.id)}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous: {prevLesson.title}
                  </Button>
                )}
              </div>

              <div>
                {nextLesson && (
                  <Button
                    onClick={() => navigateToLesson(nextLesson.moduleId, nextLesson.id)}
                    className="gap-2"
                  >
                    Next: {nextLesson.title}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
} 