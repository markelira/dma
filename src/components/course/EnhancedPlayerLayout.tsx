"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer'
import { CourseNavigationPanel } from './CourseNavigationPanel'
import { CourseProgressTracker } from './CourseProgressTracker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronLeft, 
  Menu, 
  X, 
  BookOpen, 
  Play, 
  CheckCircle,
  Settings,
  BarChart3,
  Maximize,
  Minimize,
  Share2,
  Download,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Star,
  Flag
} from 'lucide-react'

interface EnhancedPlayerLayoutProps {
  course: any
  lesson: any
  playerData: any
  modules: any[]
  currentLessonId: string
  userId?: string
  onProgress: (percentage: number, time: number, analytics?: any) => void
  onCompleted: () => void
  hasSubscription: boolean
  lessonProgress?: Record<string, any>
  moduleProgress?: Record<string, any>
  courseStats?: any
}

export const EnhancedPlayerLayout: React.FC<EnhancedPlayerLayoutProps> = ({
  course,
  lesson,
  playerData,
  modules,
  currentLessonId,
  userId,
  onProgress,
  onCompleted,
  hasSubscription,
  lessonProgress = {},
  moduleProgress = {},
  courseStats = {
    totalLessons: 0,
    completedLessons: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    completionPercentage: 0,
    streakDays: 0,
    achievements: []
  }
}) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarMode, setSidebarMode] = useState<'navigation' | 'progress'>('navigation')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [playerSettings, setPlayerSettings] = useState({
    autoplay: true,
    showNotes: true,
    showProgress: true,
    theme: 'light' as 'light' | 'dark'
  })

  // Calculate navigation data
  const flatLessons = modules.flatMap((m: any) =>
    (m.lessons as any[]).sort((a: any, b: any) => a.order - b.order).map((l: any) => ({ 
      ...l, 
      moduleId: m.id, 
      moduleOrder: m.order,
      moduleTitle: m.title 
    }))
  )
  
  const currentIndex = flatLessons.findIndex((l: any) => l.id === currentLessonId)
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex-1] : null
  const nextLesson = currentIndex < flatLessons.length-1 ? flatLessons[currentIndex+1] : null

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case 'Escape':
          if (sidebarOpen) setSidebarOpen(false)
          if (isFullscreen) document.exitFullscreen()
          break
        case 'm':
        case 'M':
          setSidebarOpen(!sidebarOpen)
          break
        case 'ArrowLeft':
          if (e.shiftKey && prevLesson) {
            router.push(`/courses/${course.id}/player/${prevLesson.id}`)
          }
          break
        case 'ArrowRight':
          if (e.shiftKey && nextLesson) {
            router.push(`/courses/${course.id}/player/${nextLesson.id}`)
          }
          break
        case 'f':
        case 'F':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
          break
        case '?':
          setShowHelp(!showHelp)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen, prevLesson, nextLesson, course.id, router, isFullscreen, showHelp])

  const handleLessonSelect = useCallback((lessonId: string) => {
    router.push(`/courses/${course.id}/player/${lessonId}`)
  }, [course.id, router])

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleExportProgress = () => {
    // Implementation for exporting progress
    console.log('Exporting progress...')
  }

  const handleShareProgress = () => {
    // Implementation for sharing progress
    console.log('Sharing progress...')
  }

  const locked = !hasSubscription && lesson?.subscriptionTier === 'PREMIUM'

  return (
    <div className="fixed inset-0 bg-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <Tabs value={sidebarMode} onValueChange={(value) => setSidebarMode(value as 'navigation' | 'progress')}>
          <div className="h-full bg-white border-r flex flex-col">
            {/* Tab Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 truncate">{course.title}</h2>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="hidden lg:block p-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="navigation" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Navigáció
                </TabsTrigger>
                <TabsTrigger value="progress" className="text-xs">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Haladás
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="navigation" className="h-full m-0">
                <CourseNavigationPanel
                  courseId={course.id}
                  currentLessonId={currentLessonId}
                  course={course}
                  modules={modules}
                  lessonProgress={lessonProgress}
                  moduleProgress={moduleProgress}
                  courseStats={courseStats}
                  hasSubscription={hasSubscription}
                  onLessonSelect={handleLessonSelect}
                  isCollapsed={false}
                />
              </TabsContent>

              <TabsContent value="progress" className="h-full m-0 overflow-y-auto">
                <div className="p-4">
                  <CourseProgressTracker
                    courseProgress={{
                      courseId: course.id,
                      courseTitle: course.title,
                      totalLessons: flatLessons.length,
                      completedLessons: courseStats.completedLessons,
                      inProgressLessons: courseStats.inProgressLessons || 0,
                      totalTimeSpent: courseStats.totalTimeSpent,
                      averageScore: courseStats.averageScore,
                      completionPercentage: courseStats.completionPercentage,
                      streakDays: courseStats.streakDays,
                      lastActivityDate: new Date(),
                      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                      learningVelocity: 2.5,
                      skillLevel: 'Intermediate',
                      certificates: [],
                      milestones: [
                        {
                          id: '1',
                          title: 'Első lecke befejezése',
                          description: 'Fejezd be az első leckét',
                          targetValue: 1,
                          currentValue: courseStats.completedLessons > 0 ? 1 : 0,
                          completed: courseStats.completedLessons > 0,
                          completedAt: courseStats.completedLessons > 0 ? new Date() : undefined
                        },
                        {
                          id: '2',
                          title: 'Tartalom felét',
                          description: 'Fejezd be a tartalom felét',
                          targetValue: Math.floor(flatLessons.length / 2),
                          currentValue: courseStats.completedLessons,
                          completed: courseStats.completedLessons >= Math.floor(flatLessons.length / 2)
                        }
                      ]
                    }}
                    lessonProgress={Object.values(lessonProgress).map((progress: any) => ({
                      lessonId: progress.lessonId,
                      lessonTitle: flatLessons.find(l => l.id === progress.lessonId)?.title || 'Unknown',
                      lessonType: flatLessons.find(l => l.id === progress.lessonId)?.type || 'TEXT',
                      moduleId: flatLessons.find(l => l.id === progress.lessonId)?.moduleId || '',
                      moduleTitle: flatLessons.find(l => l.id === progress.lessonId)?.moduleTitle || '',
                      completed: progress.completed || false,
                      watchPercentage: progress.watchPercentage || 0,
                      timeSpent: progress.timeSpent || 0,
                      lastAccessed: progress.lastAccessed || new Date(),
                      quizScore: progress.quizScore,
                      quizPassed: progress.quizPassed,
                      notes: progress.notes || 0,
                      bookmarks: progress.bookmarks || 0
                    }))}
                    weeklyProgress={[
                      { week: 'Ez a hét', lessonsCompleted: 3, timeSpent: 7200, quizzesPassed: 2, averageScore: 85 },
                      { week: 'Múlt hét', lessonsCompleted: 5, timeSpent: 9600, quizzesPassed: 3, averageScore: 78 }
                    ]}
                    onExportProgress={handleExportProgress}
                    onShareProgress={handleShareProgress}
                  />
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        {!isFullscreen && (
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className={`${sidebarOpen ? 'lg:hidden' : ''}`}
              >
                <Menu className="w-4 h-4" />
              </Button>
              
              <div className="min-w-0 flex-1">
                <h1 className="font-bold truncate">{lesson?.title}</h1>
                <div className="text-sm text-gray-500 truncate">
                  {flatLessons.find(l => l.id === currentLessonId)?.moduleTitle}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Lesson Progress Indicator */}
              <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">
                {currentIndex + 1} / {flatLessons.length}
              </Badge>

              {/* Quick Actions */}
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
                <HelpCircle className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleToggleFullscreen}>
                <Maximize className="w-4 h-4" />
              </Button>

              {/* Navigation */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!prevLesson}
                onClick={() => prevLesson && router.push(`/courses/${course.id}/player/${prevLesson.id}`)}
              >
                Előző
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!nextLesson}
                onClick={() => nextLesson && router.push(`/courses/${course.id}/player/${nextLesson.id}`)}
              >
                Következő
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {locked ? (
            <div className="h-full flex items-center justify-center bg-gray-900 text-white p-8">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Előfizetés szükséges</h3>
                <p className="text-gray-300 mb-6">
                  Ez a lecke csak előfizetőknek érhető el. Kezdje el az előfizetést a teljes tartalom eléréséhez.
                </p>
                <Button onClick={() => router.push(`/courses/${course.id}`)}>
                  Előfizetés indítása
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-50">
              <LessonContentRenderer
                lesson={lesson}
                playerData={playerData}
                courseId={course.id}
                userId={userId}
                onProgress={onProgress}
                onCompleted={onCompleted}
                hasAccess={hasSubscription}
              />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        {!isFullscreen && !locked && (
          <div className="bg-white border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{lesson?.title}</span>
                  {lesson?.duration && (
                    <span className="ml-2">• {Math.ceil(lesson.duration / 60)} perc</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Flag className="w-4 h-4 mr-2" />
                  Jelentés
                </Button>
                
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-2" />
                  Értékelés
                </Button>

                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Megosztás
                </Button>

                {nextLesson && (
                  <Button onClick={() => router.push(`/courses/${course.id}/player/${nextLesson.id}`)}>
                    Következő lecke
                    <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Billentyűparancsok</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Navigáció be/ki:</span>
                  <Badge variant="outline">M</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Előző lecke:</span>
                  <Badge variant="outline">Shift + ←</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Következő lecke:</span>
                  <Badge variant="outline">Shift + →</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Teljes képernyő:</span>
                  <Badge variant="outline">F</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Kilépés:</span>
                  <Badge variant="outline">Escape</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Súgó:</span>
                  <Badge variant="outline">?</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}