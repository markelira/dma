"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer'
import { VideoChapters } from '@/components/lesson/VideoChapters'
import { LessonResourcesList } from '@/components/lesson/LessonResourcesList'
import { QuizModal } from '@/components/lesson/QuizModal'
import { CourseQASystem } from '@/components/course/CourseQASystem'
// Tabs removed for clean video player interface
import { ChevronLeft, ChevronRight, Menu, X, BookOpen, Play, CheckCircle, MessageSquare, FileText, Users, BarChart3, Edit3, Trophy, Star, Clock } from 'lucide-react'
import { EnhancedProgressSystem } from './EnhancedProgressSystem'
import { EnhancedLessonSidebar } from './EnhancedLessonSidebar'
import { InteractiveNoteTaking } from './InteractiveNoteTaking'
import { GamificationSystem } from './GamificationSystem'

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
  const [quizOpen, setQuizOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [chaptersCollapsed, setChaptersCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [currentVideoTime, setCurrentVideoTime] = useState(0)

  // Mock data for chapters and bookmarks - in real app, these would come from props
  const mockChapters = [
    {
      id: '1',
      title: 'Bevezetés',
      startTime: 0,
      endTime: 120,
      description: 'A lecke áttekintése és célkitűzések'
    },
    {
      id: '2', 
      title: 'Alapfogalmak',
      startTime: 120,
      endTime: 300,
      description: 'Kulcsfogalmak meghatározása és magyarázata'
    },
    {
      id: '3',
      title: 'Gyakorlati példák',
      startTime: 300,
      endTime: 480,
      description: 'Valós példákon keresztül való tanulás'
    }
  ]

  const [bookmarks, setBookmarks] = useState([
    {
      id: '1',
      title: 'Fontos definíció',
      timestamp: 45,
      note: 'Ez egy kulcsfogalom a későbbiekben',
      createdAt: new Date()
    }
  ])

  // Bookmark handlers
  const handleAddBookmark = (bookmark: Omit<any, 'id' | 'createdAt'>) => {
    const newBookmark = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    setBookmarks(prev => [...prev, newBookmark])
    console.log('🔖 Added bookmark:', newBookmark)
  }

  const handleRemoveBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    console.log('🗑️ Removed bookmark:', bookmarkId)
  }

  const handleUpdateBookmark = (bookmarkId: string, updates: any) => {
    setBookmarks(prev => prev.map(b => 
      b.id === bookmarkId ? { ...b, ...updates } : b
    ))
    console.log('✏️ Updated bookmark:', bookmarkId, updates)
  }

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

  return (
    <div className="fixed inset-0 bg-gray-100 flex">
      {/* Blue Academic Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-96 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Course Header Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-white/20 ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <h1 className="text-xl font-bold text-white mb-6 leading-tight">
              {course.title || 'Kurzus címe'}
            </h1>
          </div>

          {/* Modules Section - Dynamic from props */}
          <div className="flex-1 overflow-y-auto px-6">
            {modules && modules.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-200" />
                  <span className="text-sm font-semibold text-white">
                    {modules.length} {modules.length === 1 ? 'Modul' : 'Modul'}
                  </span>
                </div>

                {modules.map((module: any) => (
                  <div key={module.id} className="bg-white/10 rounded-lg p-4 mb-3">
                    <h3 className="font-medium text-white mb-3">{module.title}</h3>

                    {module.lessons && module.lessons.map((lesson: any) => (
                      <button
                        key={lesson.id}
                        onClick={() => router.push(`/courses/${course.id}/player/${lesson.id}`)}
                        className={`w-full text-left rounded-lg p-3 mb-2 transition-colors ${
                          currentLesson?.id === lesson.id
                            ? 'bg-white/20 border-l-4 border-white'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Play className="w-3 h-3 text-white" />
                          <span className="text-sm font-medium text-white">{lesson.title}</span>
                        </div>
                      </button>
                    ))}
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

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Academic Top Header */}
        {!isFullscreen && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-600 hover:bg-gray-100 lg:hidden"
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <div className="text-lg font-semibold text-gray-900">
                  {course.title || 'Kurzus'}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && router.push(`/courses/${course.id}/player/${prevLesson.id}`)}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Előző
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!nextLesson}
                  onClick={() => nextLesson && router.push(`/courses/${course.id}/player/${nextLesson.id}`)}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Következő
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Academic Content Area - with scrolling */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ height: '100vh' }}>
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
            <div className="p-6">
              {/* Clean Video Player */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
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

                {/* Lesson Navigation */}
                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <Button
                    variant={prevLesson ? "outline" : "ghost"}
                    disabled={!prevLesson}
                    onClick={() => prevLesson && router.push(`/courses/${course.id}/player/${prevLesson.id}`)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {prevLesson ? (
                      <div className="text-left">
                        <div className="text-xs text-gray-500">Előző lecke</div>
                        <div className="text-sm font-medium">{prevLesson.title}</div>
                      </div>
                    ) : (
                      <span>Nincs előző lecke</span>
                    )}
                  </Button>

                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">
                      Lecke {currentIndex + 1} / {flatLessons.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lesson?.title || 'Lecke'}
                    </div>
                  </div>

                  <Button
                    variant={nextLesson ? "default" : "ghost"}
                    disabled={!nextLesson}
                    onClick={() => nextLesson && router.push(`/courses/${course.id}/player/${nextLesson.id}`)}
                    className="flex items-center gap-2"
                  >
                    {nextLesson ? (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Következő lecke</div>
                        <div className="text-sm font-medium">{nextLesson.title}</div>
                      </div>
                    ) : (
                      <span>Nincs következő lecke</span>
                    )}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Chapters and Bookmarks */}
        {!isFullscreen && !locked && (
          <VideoChapters
            chapters={mockChapters}
            bookmarks={bookmarks}
            currentTime={0} // This would be passed from VideoPlayer state
            duration={0} // This would be passed from VideoPlayer state
            onSeekTo={(time) => {
              // Handle seeking - this would be connected to the video player
              console.log('Seeking to:', time)
            }}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onUpdateBookmark={handleUpdateBookmark}
            isCollapsed={chaptersCollapsed}
            onToggleCollapse={() => setChaptersCollapsed(!chaptersCollapsed)}
          />
        )}

        {/* Additional Bottom Content (when chapters are collapsed) */}
        {!isFullscreen && !locked && chaptersCollapsed && (
          <div className="bg-white border-t">
            <div className="p-4">
              <div className="flex flex-wrap gap-4">
                {lesson?.quiz && (
                  <Button 
                    variant="outline" 
                    onClick={() => setQuizOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Kvíz indítása
                  </Button>
                )}
                
                {lesson?.resources && lesson.resources.length > 0 && (
                  <div className="flex-1 min-w-0">
                    <LessonResourcesList resources={lesson.resources} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {lesson?.quiz && (
        <QuizModal
          open={quizOpen}
          onClose={() => setQuizOpen(false)}
          quiz={lesson.quiz}
          onPassed={() => {
            setQuizOpen(false)
            // Handle quiz completion
          }}
        />
      )}
    </div>
  )
}