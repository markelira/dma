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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
              {(course.universityName || course.universityDepartment) ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    {course.universityName && (
                      <div className="text-xs text-blue-100 mb-1">{course.universityName}</div>
                    )}
                    {course.universityDepartment && (
                      <div className="text-xs text-blue-200 font-medium">{course.universityDepartment}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <h1 className="text-xl font-bold text-white mb-2 leading-tight">
              {course.title || 'Kurzus címe'}
            </h1>
            {course.description && (
              <p className="text-sm text-blue-100 mb-4">
                {course.description}
              </p>
            )}

            {/* Instructor Info - use real data */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {course.instructorName || course.instructor?.name || 'Oktató'}
                </div>
                {course.instructorTitle && (
                  <div className="text-xs text-blue-200">{course.instructorTitle}</div>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Haladás</span>
                <span className="text-lg font-bold text-white">45%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div className="bg-white rounded-full h-2" style={{ width: '45%' }}></div>
              </div>
              <div className="text-xs text-blue-100">B+ Jelenlegi jegy</div>
            </div>

            {/* Course Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-yellow-300" />
                  <span className="text-sm font-bold text-white">4.6</span>
                </div>
                <div className="text-xs text-blue-200">értékelés</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-white mb-1">187</div>
                <div className="text-xs text-blue-200">hallgató</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-white mb-1">4</div>
                <div className="text-xs text-blue-200">kredit</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-white mb-1">56h</div>
                <div className="text-xs text-blue-200">tanulás</div>
              </div>
            </div>
          </div>

          {/* Modules Section */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-semibold text-white">Modulok (3)</span>
              </div>
              
              {/* Current Module - Programozási alapok */}
              <div className="bg-white/10 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">Programozási alapok</h3>
                  <ChevronLeft className="w-4 h-4 text-blue-200 transform rotate-90" />
                </div>
                <p className="text-xs text-blue-200 mb-3">
                  A programozás világába való bevezetés, alapfogalmak megismerése
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-3 h-3 text-blue-300" />
                  <span className="text-xs text-blue-200">3 lecke</span>
                  <Clock className="w-3 h-3 text-blue-300 ml-2" />
                  <span className="text-xs text-blue-200">30 perc</span>
                </div>
                
                <div className="w-full bg-white/20 rounded-full h-1 mb-3">
                  <div className="bg-white rounded-full h-1" style={{ width: '85%' }}></div>
                </div>
                <div className="text-xs text-blue-200">85% kész</div>

                {/* Lessons in this module */}
                <div className="mt-4 space-y-2">
                  <div className="bg-white/20 rounded-lg p-3 border-l-4 border-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="w-3 h-3 text-white" />
                      <span className="text-sm font-medium text-white">Mi a programozás?</span>
                      <Badge className="bg-green-500 text-white text-xs ml-auto">Kezdő</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-200">
                      <Clock className="w-3 h-3" />
                      <span>15 perc</span>
                      <CheckCircle className="w-3 h-3 text-green-300 ml-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">ME</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Miskolci Egyetem</div>
                    <div className="text-xs text-gray-500">Informatikai Intézet</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 ml-4">
                  {course.title || 'Bevezetés a Programozásba'}
                </div>
                <div className="text-sm text-gray-500">PROG-101 • 2024/25 őszi félév</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-blue-600">45% befejezve</div>
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
            <div className="p-8 pb-24">
              {/* Lesson Header Section */}
              <div className="mb-8">
                {/* Lesson Metadata Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <Play className="w-3 h-3 mr-1" />
                      Videó lecke
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Kezdő
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      15 perc
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Modul 1 • Lecke 1/3
                  </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span>Programozási alapok</span>
                  <ChevronLeft className="w-4 h-4 transform rotate-180" />
                  <span className="text-gray-900 font-medium">Mi a programozás?</span>
                </div>

                {/* Lesson Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Mi a programozás?
                </h1>

                {/* Learning Objectives Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-blue-900">Tanulási célok</h2>
                  </div>
                  <ul className="space-y-3 text-blue-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Programozás fogalmának megértése</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Programozási nyelvek típusainak megismerése</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Algoritmus és program közötti különbség</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 mb-6">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Tartalom
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Jegyzet
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Anyagok
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Haladás
                  </TabsTrigger>
                  <TabsTrigger value="achievements" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Kitüntetések
                  </TabsTrigger>
                  <TabsTrigger value="qa" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Kérdések
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-0">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200">
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
                    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
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
                          {lesson?.moduleTitle || 'Modul'}
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
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Jegyzeteim</h2>
                      <p className="text-gray-600">Készíts jegyzeteket és könyvjelzőket a videó közben</p>
                    </div>
                    
                    <InteractiveNoteTaking
                      lessonId={lesson?.id}
                      currentTime={currentVideoTime}
                      onSeekTo={(time) => {
                        console.log('Seeking to:', time)
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Tanulási Haladás</h2>
                      <p className="text-gray-600">Kövesd nyomon a fejlődésedet és teljesítményedet</p>
                    </div>
                    
                    <EnhancedProgressSystem
                      course={course}
                      modules={modules}
                      currentLessonId={currentLessonId}
                      flatLessons={flatLessons}
                      currentIndex={currentIndex}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="achievements" className="mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Kitüntetések & Eredmények</h2>
                      <p className="text-gray-600">Szerezz pontokat, érd el kitüntetéseket és kövesd nyomon tanulási sorozatodat</p>
                    </div>
                    
                    <GamificationSystem
                      courseId={course.id}
                      lessonId={lesson?.id}
                      onLessonComplete={() => {
                        console.log('Lesson completed with gamification')
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Lecke Anyagok</h2>
                      <p className="text-gray-600">Letölthető források és kiegészítő anyagok</p>
                    </div>
                    
                    {lesson?.resources && lesson.resources.length > 0 ? (
                      <LessonResourcesList resources={lesson.resources} />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Lecke anyagok</h3>
                        <p className="text-gray-600 mb-1">A leckéhez tartozó anyagok hamarosan elérhetők lesznek</p>
                        <p className="text-sm text-gray-500">Kiegészítő források, letöltések és hivatkozások</p>
                      </div>
                    )}

                    {lesson?.quiz && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-5 h-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-blue-900">Interaktív Kvíz</h3>
                            </div>
                            <p className="text-blue-700">
                              Tesztelje tudását az eddigi anyagról. {lesson.quiz.questions.length} kérdés várja.
                            </p>
                          </div>
                          <Button 
                            onClick={() => setQuizOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Kvíz Indítása
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="qa" className="mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Kérdések & Válaszok</h2>
                      <p className="text-gray-600">Tedd fel kérdéseidet és segíts társaidnak</p>
                    </div>
                    
                    <CourseQASystem
                      courseId={course.id}
                      lessonId={lesson?.id}
                      courseTitle={course.title}
                      isInstructor={course.instructor?.id === userId}
                    />
                  </div>
                </TabsContent>
              </Tabs>
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