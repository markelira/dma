"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer'
import { LessonResourcesList } from '@/components/lesson/LessonResourcesList'
import { LessonOverviewTab } from './LessonOverviewTab'
import { ChevronLeft, ChevronRight, Menu, X, BookOpen, Play, CheckCircle, FileDown } from 'lucide-react'

interface PlayerLayoutProps {
  course: any
  lesson: any
  playerData: any
  modules: any[]
  currentLessonId: string
  userId?: string
  onProgress: (percentage: number, time: number, analytics?: any) => void
  onEnded: () => void
  hasSubscription: boolean
}

export const PlayerLayout: React.FC<PlayerLayoutProps> = ({
  course,
  lesson,
  playerData,
  modules,
  currentLessonId,
  userId,
  onProgress,
  onEnded,
  hasSubscription
}) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [currentVideoTime, setCurrentVideoTime] = useState(0)

  // Calculate navigation
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
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen, prevLesson, nextLesson, course.id, router])

  const locked = !hasSubscription && lesson?.subscriptionTier === 'PREMIUM'

  // Calculate progress percentage
  const completedLessons = flatLessons.filter((l: any) => l.completed).length
  const progressPercentage = flatLessons.length > 0
    ? Math.round((completedLessons / flatLessons.length) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-gray-50 flex">
      {/* Hamburger Menu Sidebar - Always hidden by default */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-96 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl transform transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Course Header Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-white/20 ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <h1 className="text-xl font-bold text-white mb-2 leading-tight">
              {course.title || 'Kurzus címe'}
            </h1>

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
                <span>Haladás</span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-blue-100 mt-1">
                {completedLessons} / {flatLessons.length} lecke befejezve
              </div>
            </div>
          </div>

          {/* Modules Section - Dynamic from props */}
          <div className="flex-1 overflow-y-auto px-6">
            {modules && modules.length > 0 && (
              <div className="mb-4">
                {modules.map((module: any) => (
                  <div key={module.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-200" />
                      <h3 className="font-semibold text-white text-sm">{module.title}</h3>
                    </div>

                    <div className="space-y-1">
                      {module.lessons && module.lessons.map((lessonItem: any) => {
                        const isActive = lessonItem.id === currentLessonId
                        const isCompleted = lessonItem.completed

                        return (
                          <button
                            key={lessonItem.id}
                            onClick={() => router.push(`/courses/${course.id}/player/${lessonItem.id}`)}
                            className={`w-full text-left rounded-lg p-3 transition-colors ${
                              isActive
                                ? 'bg-white/20 border-l-4 border-white'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                              ) : isActive ? (
                                <Play className="w-4 h-4 text-white flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-white/40 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium text-white">{lessonItem.title}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-white/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/courses/${course.id}`)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:text-white font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Vissza a kurzushoz
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        {!isFullscreen && (
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  title="Kurzus tartalom (M)"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="min-w-0">
                  <div className="text-sm text-gray-500 truncate">
                    {course.title || 'Kurzus'}
                  </div>
                  <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                    {lesson?.title || 'Lecke'}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/courses/${course.id}`)}
                className="flex-shrink-0 hidden md:flex"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kurzus
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {locked ? (
            <div className="flex items-center justify-center min-h-full text-center p-8">
              <div>
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Előfizetés szükséges</h3>
                <p className="text-gray-600 mb-4">Ez a lecke csak előfizetőknek érhető el.</p>
                <Button onClick={() => router.push(`/courses/${course.id}`)}>
                  Előfizetés indítása
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Video Player */}
              <div className="bg-black">
                <LessonContentRenderer
                  lesson={lesson}
                  playerData={playerData}
                  courseId={course.id}
                  userId={userId}
                  onProgress={(percentage, time, analytics) => {
                    setCurrentVideoTime(time)
                    onProgress(percentage, time, analytics)
                  }}
                  onCompleted={onEnded}
                  hasAccess={hasSubscription}
                />
              </div>

              {/* Progress Bar with Navigation */}
              {!isFullscreen && (
                <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!prevLesson}
                      onClick={() => prevLesson && router.push(`/courses/${course.id}/player/${prevLesson.id}`)}
                      className="flex items-center gap-2"
                      title="Shift + ←"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Előző</span>
                    </Button>

                    <div className="text-center flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Lecke {currentIndex + 1} / {flatLessons.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        {progressPercentage}% befejezve
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      disabled={!nextLesson}
                      onClick={() => nextLesson && router.push(`/courses/${course.id}/player/${nextLesson.id}`)}
                      className="flex items-center gap-2"
                      title="Shift + →"
                    >
                      <span className="hidden sm:inline">Következő</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabs Section */}
              {!isFullscreen && (
                <div className="bg-white">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-gray-200 px-4 md:px-6">
                      <TabsList className="bg-transparent h-auto p-0 space-x-6">
                        <TabsTrigger
                          value="overview"
                          className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-0 py-3"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Áttekintés
                        </TabsTrigger>
                        <TabsTrigger
                          value="resources"
                          className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-0 py-3"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Anyagok
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="px-4 md:px-6">
                      <TabsContent value="overview" className="mt-0">
                        <LessonOverviewTab lesson={lesson} course={course} />
                      </TabsContent>

                      <TabsContent value="resources" className="mt-0 py-6">
                        {lesson?.resources && lesson.resources.length > 0 ? (
                          <div className="max-w-4xl mx-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Letölthető anyagok
                            </h3>
                            <LessonResourcesList resources={lesson.resources} />
                          </div>
                        ) : (
                          <div className="max-w-4xl mx-auto py-12 text-center">
                            <FileDown className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500">
                              Nincsenek letölthető anyagok ehhez a leckéhez
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
