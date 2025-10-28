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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Monitor, Maximize, ChevronLeft, ChevronRight, Play, RotateCcw, Trophy, Flame, Target, CheckCircle, ChevronDown, ChevronUp, BookOpen, List, User, Home, Menu, X, BarChart3, FileText, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { brandGradient, cardStyles, buttonStyles, animations } from '@/lib/design-tokens'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
            {cload && 'Kurzus betöltése...'}
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
    return <div className="p-8 text-center text-red-600">Kurzus nem található.</div>
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
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium">Vissza a főoldalra</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 hidden md:block">
              {course?.title || 'Kurzus'}
            </h1>
          </div>
        </div>
      </header>

      <div className="flex">{/* Enhanced Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-96 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 mt-[73px] lg:mt-0 shadow-xl lg:shadow-none`}>

          <div className="h-full flex flex-col">
            {/* Enhanced Sidebar Header */}
            <div className="p-6 text-white relative overflow-hidden" style={{ background: brandGradient }}>
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

              <div className="relative z-10">
                {/* Course Title and Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-white/80 text-sm font-medium uppercase tracking-wide">
                      Kurzus
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-tight mb-3">
                    {course?.title || 'Kurzus címe'}
                  </h2>
                  {course?.description && (
                    <p className="text-white/90 text-sm leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                    <div className="text-lg font-bold text-white">{modules.length}</div>
                    <div className="text-xs text-white/80">Modul</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                    <div className="text-lg font-bold text-white">
                      {totalLessons}
                    </div>
                    <div className="text-xs text-white/80">Videó</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                    <div className="text-lg font-bold text-white">{totalCourseDuration}</div>
                    <div className="text-xs text-white/80">Perc</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {modules.map((module: any, moduleIndex: number) => {
                const isExpanded = expandedModules.has(module.id)
                const moduleProgress = getModuleProgress(module.id)
                const hasCurrentLesson = module.lessons.some((l: any) => l.id === lessonId)

                return (
                  <motion.div
                    key={module.id}
                    className={cardStyles.flat}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: moduleIndex * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                          hasCurrentLesson
                            ? 'bg-gray-900'
                            : moduleProgress === 100
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                        }`}>
                          {moduleProgress === 100 ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <span>{moduleIndex + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                            {moduleIndex + 1}. modul
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {module.title}
                          </p>
                          {/* Module Progress */}
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  moduleProgress === 100 ? 'bg-green-500' : 'bg-gray-900'
                                }`}
                                style={{ width: `${moduleProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {module.lessons.filter((l: any) => l.progress?.completed || l.progress?.watchPercentage >= 90).length}/{module.lessons.length} lecke
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>

                    {/* Module Lessons */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-2 space-y-1">
                          {module.lessons.map((moduleLesson: any, lessonIndex: number) => {
                            const isCurrentLesson = moduleLesson.id === lessonId
                            const isCompleted = moduleLesson.progress?.completed || moduleLesson.progress?.watchPercentage >= 90

                            return (
                              <button
                                key={moduleLesson.id}
                                onClick={() => {
                                  navigateToLesson(module.id, moduleLesson.id);
                                  if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                                  isCurrentLesson
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : isCompleted
                                    ? 'bg-green-50 border border-green-200 hover:bg-green-100 text-green-900'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    isCurrentLesson
                                      ? 'bg-white/20 text-white'
                                      : isCompleted
                                      ? 'bg-green-200 text-green-700'
                                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : isCurrentLesson ? (
                                      <Play className="w-3 h-3" />
                                    ) : (
                                      <span>{lessonIndex + 1}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium leading-tight mb-1 ${
                                      isCurrentLesson ? 'text-white' : ''
                                    }`}>
                                      {moduleLesson.title}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Clock className={`w-3 h-3 ${
                                        isCurrentLesson ? 'text-white/80' : 'text-gray-500'
                                      }`} />
                                      <span className={`text-xs ${
                                        isCurrentLesson ? 'text-white/80' : 'text-gray-500'
                                      }`}>
                                        {moduleLesson.duration} perc
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        isCurrentLesson
                                          ? 'bg-white/20 text-white'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {moduleLesson.type === 'video' ? 'Videó' : moduleLesson.type === 'quiz' ? 'Kvíz' : 'Tartalom'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* PDF Resources Section */}
            {course?.resources && course.resources.length > 0 && (
              <div className="p-4 border-t border-gray-200/50">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-gray-900 text-sm">Kurzus anyagok ({course.resources.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {course.resources.slice(0, 3).map((resource: any, idx: number) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors group"
                      >
                        <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-3 h-3 text-red-600" />
                        </div>
                        <span className="text-xs text-gray-700 font-medium group-hover:text-gray-900 line-clamp-1">
                          {resource.title || `Anyag ${idx + 1}`}
                        </span>
                      </a>
                    ))}
                    {course.resources.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{course.resources.length - 3} további anyag
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-6 max-w-5xl mx-auto">
            {/* Lesson Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm mb-3">
                <span className="bg-[#466C95]/10 border border-[#466C95]/20 text-[#466C95] px-2.5 py-1 rounded-md text-xs font-medium">
                  {currentModule?.title || 'Modul'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {lesson?.title}
              </h1>
              {lesson?.description && (
                <p className="text-gray-600 text-lg leading-relaxed">
                  {lesson.description}
                </p>
              )}
            </div>

            {/* Lesson Content */}
            {!locked && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-8">
                <div className="relative">
                  {/* Content Container */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl">
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

                  {/* Lesson Info */}
                  {lesson?.duration && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">{lesson.duration} perc</span>
                        </div>
                        {lesson.type === 'video' && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">Videó</span>
                          </div>
                        )}
                      </div>

                      {!(flatLessons.find((l: any) => l.id === lessonId)?.progress?.completed || flatLessons.find((l: any) => l.id === lessonId)?.progress?.watchPercentage >= 90) && (
                        <button
                          onClick={() => markLessonComplete(lessonId)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
                        >
                          ✓ Lecke befejezése
                        </button>
                      )}

                      {(flatLessons.find((l: any) => l.id === lessonId)?.progress?.completed || flatLessons.find((l: any) => l.id === lessonId)?.progress?.watchPercentage >= 90) && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Befejezve</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

            {/* Enhanced Lesson Navigation */}
            {!locked && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const prev = getPrevLesson();
                      if (prev) {
                        navigateToLesson(prev.moduleId, prev.lessonId);
                        setExpandedModules(new Set(Array.from(expandedModules).concat(prev.moduleId)));
                      }
                    }}
                    disabled={!getPrevLesson()}
                    className={`${buttonStyles.secondaryLight} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Előző lecke</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = getNextLesson();
                      if (next) {
                        navigateToLesson(next.moduleId, next.lessonId);
                        setExpandedModules(new Set(Array.from(expandedModules).concat(next.moduleId)));
                      }
                    }}
                    disabled={!getNextLesson()}
                    className={`${buttonStyles.primaryLight} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span>Következő lecke</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
} 