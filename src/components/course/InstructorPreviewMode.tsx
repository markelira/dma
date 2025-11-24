"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Play, 
  FileText, 
  MessageSquare, 
  Award, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Settings,
  BarChart3,
  Download,
  Share2,
  Edit3,
  Volume2
} from 'lucide-react'
import { Course, Module, Lesson } from '@/types'
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer'
import { CourseQASystem } from '@/components/course/CourseQASystem'

interface InstructorPreviewModeProps {
  course: Course
  currentLesson?: Lesson
  playerData?: any
  userId?: string
  onNavigateToLesson?: (lessonId: string) => void
  onExitPreview?: () => void
}

export const InstructorPreviewMode: React.FC<InstructorPreviewModeProps> = ({
  course,
  currentLesson,
  playerData,
  userId,
  onNavigateToLesson,
  onExitPreview
}) => {
  const [previewMode, setPreviewMode] = useState<'student' | 'instructor'>('student')
  const [mockProgress, setMockProgress] = useState(45) // Mock student progress

  // Calculate course stats
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const videoLessons = course.modules.flatMap(m => m.lessons).filter(l => l.type === 'VIDEO').length
  const textLessons = course.modules.flatMap(m => m.lessons).filter(l => l.type === 'TEXT' || l.type === 'READING').length
  const quizLessons = course.modules.flatMap(m => m.lessons).filter(l => l.type === 'QUIZ').length
  const pdfLessons = course.modules.flatMap(m => m.lessons).filter(l => l.type === 'PDF').length

  // Mock lesson completion
  const handleMockProgress = (percentage: number, time: number) => {
    console.log('📊 Preview Mode - Mock Progress:', { percentage, time })
    setMockProgress(Math.max(mockProgress, percentage))
  }

  const handleMockCompletion = () => {
    console.log('✅ Preview Mode - Mock Lesson Completed')
    setMockProgress(100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Eye className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Oktató előnézet mód</h1>
                <p className="text-blue-100 text-sm">
                  {course.title} - Így látják a diákok a tartalmat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-blue-700 rounded-lg p-1">
                <Button
                  variant={previewMode === 'student' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('student')}
                  className={previewMode === 'student' ? 'bg-white text-blue-600' : 'text-white hover:bg-blue-600'}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Diák nézet
                </Button>
                <Button
                  variant={previewMode === 'instructor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('instructor')}
                  className={previewMode === 'instructor' ? 'bg-white text-blue-600' : 'text-white hover:bg-blue-600'}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Oktató nézet
                </Button>
              </div>
              
              {onExitPreview && (
                <Button variant="outline" onClick={onExitPreview} className="text-blue-600 border-white hover:bg-blue-50">
                  Szerkesztés folytatása
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-7xl mx-auto p-6">
        {previewMode === 'instructor' && (
          <div className="mb-6 space-y-4">
            {/* Course Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Tartalom statisztikák
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalLessons}</div>
                    <div className="text-sm text-gray-600">Összes lecke</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{videoLessons}</div>
                    <div className="text-sm text-gray-600">Videó leckék</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{quizLessons}</div>
                    <div className="text-sm text-gray-600">Kvízek</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{pdfLessons}</div>
                    <div className="text-sm text-gray-600">PDF anyagok</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Type Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Tartalom típusok elemzése</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-red-500" />
                      <span>Videó tartalom</span>
                    </div>
                    <Badge variant="outline">{videoLessons} lecke</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-500" />
                      <span>Szöveges tartalom</span>
                    </div>
                    <Badge variant="outline">{textLessons} lecke</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span>Interaktív kvízek</span>
                    </div>
                    <Badge variant="outline">{quizLessons} kvíz</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-orange-500" />
                      <span>PDF dokumentumok</span>
                    </div>
                    <Badge variant="outline">{pdfLessons} fájl</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Alerts */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ez egy előnézeti mód. A valós diák-oktató interakciók (Q&A, haladás követés) nem mentődnek el.
                A funkciók tesztelésére szolgál az éles indítás előtt.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue={currentLesson ? 'lesson' : 'overview'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Áttekintés
            </TabsTrigger>
            <TabsTrigger value="lesson" className="flex items-center gap-2" disabled={!currentLesson}>
              <Play className="w-4 h-4" />
              Lecke előnézet
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Q&A rendszer
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Funkciók
            </TabsTrigger>
          </TabsList>

          {/* Course Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tartalom szerkezet előnézet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {moduleIndex + 1}. modul
                        </span>
                        {module.title}
                      </h3>
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">
                                {moduleIndex + 1}.{lessonIndex + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                {lesson.type === 'VIDEO' && <Play className="w-4 h-4 text-red-500" />}
                                {lesson.type === 'TEXT' && <FileText className="w-4 h-4 text-green-500" />}
                                {lesson.type === 'READING' && <BookOpen className="w-4 h-4 text-purple-500" />}
                                {lesson.type === 'QUIZ' && <Award className="w-4 h-4 text-blue-500" />}
                                {lesson.type === 'PDF' && <Download className="w-4 h-4 text-orange-500" />}
                                {lesson.type === 'AUDIO' && <Volume2 className="w-4 h-4 text-indigo-500" />}
                                <span>{lesson.title}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.duration && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {Math.ceil(lesson.duration / 60)} perc
                                </Badge>
                              )}
                              {onNavigateToLesson && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onNavigateToLesson(lesson.id)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Előnézet
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Lesson Preview */}
          <TabsContent value="lesson" className="space-y-6">
            {currentLesson ? (
              <div className="space-y-4">
                {/* Mock Progress Indicator (Instructor View Only) */}
                {previewMode === 'instructor' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Szimuláció aktív:</strong> Mock diák haladás: {mockProgress}% 
                      - A valós diákok haladása eltérhet ettől.
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardContent className="p-0">
                    <LessonContentRenderer
                      lesson={currentLesson}
                      playerData={playerData}
                      courseId={course.id}
                      userId={userId}
                      onProgress={handleMockProgress}
                      onCompleted={handleMockCompletion}
                      hasAccess={true} // Always allow access in preview mode
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Válasszon ki egy leckét az előnézethez</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Q&A System Preview */}
          <TabsContent value="qa" className="space-y-6">
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                <strong>Q&A rendszer előnézet:</strong> Itt láthatja, hogyan működik a diák-oktató kommunikáció.
                Az előnézeti módban feltett kérdések nem kerülnek mentésre.
              </AlertDescription>
            </Alert>

            <CourseQASystem
              courseId={course.id}
              lessonId={currentLesson?.id}
              courseTitle={course.title}
              isInstructor={true}
            />
          </TabsContent>

          {/* Features Overview */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* PDF Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-orange-500" />
                    PDF Megjelenítő
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Natív PDF megjelenítés böngészőben, teljes funkcionalitással.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Nagyítás, forgatás</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Könyvjelzők, keresés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Haladás követés</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quiz System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" />
                    Kvíz Rendszer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Interaktív kvízek részletes visszajelzéssel és többszöri próbálkozással.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Többszörös próbálkozás</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Részletes visszajelzés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Teljesítmény elemzés</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Q&A System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    Q&A Rendszer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Diák-oktató kommunikáció kérdés-válasz formátumban.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Nyilvános/privát kérdések</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Hivatalos válaszok</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Szavazási rendszer</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Player */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-red-500" />
                    Videó Lejátszó
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Mux-alapú prémium videó lejátszás adaptív minőséggel.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>4K támogatás</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Fejezetek, könyvjelzők</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Folytatás funkció</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Haladás Követés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Valós idejű haladás szinkronizáció eszközök között.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Eszköz szinkronizáció</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Részletes analitika</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Befejezés nyomon követés</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Responsive */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-indigo-500" />
                    Reszponzív Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Tökéletes élmény minden eszközön és képernyőméretben.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Mobil optimalizáció</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Tablet támogatás</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Desktop élmény</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}