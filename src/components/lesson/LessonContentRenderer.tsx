"use client"

import React, { useState, useEffect } from 'react'
import { LessonVideoPlayer } from './LessonVideoPlayer'
import { QuizModal } from './QuizModal'
import { InteractiveQuizEngine } from './InteractiveQuizEngine'
import { RichTextContentRenderer } from './RichTextContentRenderer'
import { PDFViewer } from './PDFViewer'
import { AudioPlayer } from './AudioPlayer'
import { ResumePrompt } from './ResumePrompt'
import { useResumeManager } from '@/hooks/useResumeManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  Award,
  Volume2,
  Download,
  Eye,
  Bookmark,
  RotateCcw
} from 'lucide-react'
import { Lesson } from '@/types'

interface LessonContentRendererProps {
  lesson: Lesson
  playerData?: any
  courseId: string
  userId?: string
  onProgress: (percentage: number, time: number, analytics?: any) => void
  onCompleted: () => void
  hasAccess?: boolean
}

interface LessonProgress {
  type: Lesson['type']
  percentage: number
  timeSpent: number
  completed: boolean
  lastAccessed: Date
  metadata?: {
    videoPosition?: number
    quizAttempts?: number
    quizScore?: number
    readingProgress?: number
    notesCount?: number
  }
}

export const LessonContentRenderer: React.FC<LessonContentRendererProps> = ({
  lesson,
  playerData,
  courseId,
  userId,
  onProgress,
  onCompleted,
  hasAccess = true
}) => {
  // Check if lesson exists and has required type
  if (!lesson) {
    console.error('❌ [LessonContentRenderer] No lesson data provided');
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Lecke betöltése...</h2>
        <p className="text-gray-600">Egy pillanat, a lecke tartalmát töltük...</p>
      </div>
    );
  }
  
  if (!lesson.type) {
    console.error('❌ [LessonContentRenderer] Lesson missing type field:', lesson);
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Hiba a lecke betöltésekor</h2>
        <p className="text-gray-600">A lecke formátuma érvénytelen. Kérjük próbálja újra később.</p>
        <p className="text-sm text-gray-500 mt-2">Hiba: Hiányzó típus információ</p>
      </div>
    );
  }

  const [quizOpen, setQuizOpen] = useState(false)
  const [progress, setProgress] = useState<LessonProgress>({
    type: lesson.type,
    percentage: 0,
    timeSpent: 0,
    completed: false,
    lastAccessed: new Date()
  })
  const [isLoading, setIsLoading] = useState(false)
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null)

  // Resume functionality
  const resumeManager = useResumeManager({
    lessonId: lesson.id,
    courseId,
    lesson,
    threshold: 5
  })

  // Calculate estimated reading time for text content
  const getEstimatedReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  // Handle progress updates with cross-device sync
  const handleProgressUpdate = (percentage: number, timeSpent: number, analytics?: any) => {
    const newProgress = {
      ...progress,
      percentage: Math.max(progress.percentage, percentage),
      timeSpent: timeSpent,
      lastAccessed: new Date(),
      metadata: {
        ...progress.metadata,
        ...analytics
      }
    }

    setProgress(newProgress)
    
    // Send to backend with enhanced tracking data
    onProgress(percentage, timeSpent, {
      ...analytics,
      courseId,
      resumePosition: analytics?.videoPosition || analytics?.readingProgress || 0,
      contentType: lesson.type,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      }
    })

    // Mark as completed if threshold met
    if (percentage >= 90 && !progress.completed) {
      newProgress.completed = true
      setProgress(newProgress)
      onCompleted()
    }
  }

  // Reading progress tracking
  useEffect(() => {
    if (lesson.type === 'TEXT' || lesson.type === 'READING') {
      if (!readingStartTime) {
        setReadingStartTime(new Date())
      }

      const interval = setInterval(() => {
        if (readingStartTime) {
          const timeSpent = Math.floor((Date.now() - readingStartTime.getTime()) / 1000)
          const estimatedTime = getEstimatedReadingTime(lesson.content || '') * 60
          const percentage = Math.min((timeSpent / estimatedTime) * 100, 100)
          
          handleProgressUpdate(percentage, timeSpent)
        }
      }, 10000) // Update every 10 seconds

      return () => clearInterval(interval)
    }
  }, [lesson.type, readingStartTime, lesson.content])

  // Access control
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Korlátozott hozzáférés</h3>
          <p className="text-gray-600 max-w-md">
            Ez a lecke csak előfizetőknek érhető el. Vásárolja meg a kurzust a teljes tartalom eléréséhez.
          </p>
          <Button className="mt-4">Előfizetés indítása</Button>
        </div>
      </div>
    )
  }

  // Get lesson type icon and color - handle both uppercase and lowercase
  const getLessonTypeInfo = (type: Lesson['type']) => {
    const normalizedType = type?.toUpperCase()
    switch (normalizedType) {
      case 'VIDEO':
        return { icon: Play, color: 'text-red-500 bg-red-50', label: 'Videó lecke' }
      case 'QUIZ':
        return { icon: Award, color: 'text-white0 bg-brand-secondary/5', label: 'Kvíz' }
      case 'TEXT':
        return { icon: FileText, color: 'text-green-500 bg-green-50', label: 'Szöveges tartalom' }
      case 'READING':
        return { icon: BookOpen, color: 'text-purple-500 bg-purple-50', label: 'Olvasmány' }
      case 'PDF':
        return { icon: FileText, color: 'text-orange-500 bg-orange-50', label: 'PDF dokumentum' }
      case 'AUDIO':
        return { icon: Volume2, color: 'text-indigo-500 bg-indigo-50', label: 'Hanganyag' }
      default:
        return { icon: FileText, color: 'text-gray-500 bg-gray-50', label: 'Tartalom' }
    }
  }

  const typeInfo = getLessonTypeInfo(lesson.type)
  const TypeIcon = typeInfo.icon

  return (
    <div className="space-y-6">
      {/* Resume Prompt */}
      {resumeManager.showResumePrompt && resumeManager.resumePoint && (
        <ResumePrompt
          lessonTitle={lesson.title}
          lessonType={lesson.type}
          resumePoint={resumeManager.resumePoint}
          progress={resumeManager.progress}
          onResume={resumeManager.handleResume}
          onStartFromBeginning={resumeManager.handleStartFromBeginning}
          onDismiss={resumeManager.dismissResumePrompt}
          className="mb-6"
        />
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* VIDEO Content - handle both uppercase and lowercase */}
        {(lesson.type === 'VIDEO' || lesson.type === 'video') && (
          <div className="bg-black rounded-lg overflow-hidden">
            <LessonVideoPlayer
              muxPlaybackId={lesson.muxPlaybackId}
              videoUrl={playerData?.signedPlaybackUrl || lesson.videoUrl}
              poster={lesson.muxThumbnailUrl || lesson.thumbnailUrl}
              lessonTitle={lesson.title}
              lessonId={lesson.id}
              courseId={courseId}
              userId={userId}
              autoPlay={false}
              startTime={resumeManager.getVideoResumeContext()?.startTime}
              className="w-full"
              onProgress={(percentage, timeSpent, analytics) => {
                handleProgressUpdate(percentage, timeSpent, {
                  videoPosition: timeSpent,
                  ...analytics
                })
              }}
              onEnded={() => {
                handleProgressUpdate(100, progress.timeSpent)
                onCompleted()
              }}
            />
          </div>
        )}

        {/* TEXT Content */}
        {(lesson.type === 'TEXT' || lesson.type === 'text') && (
          <RichTextContentRenderer
            content={lesson.content || ''}
            lessonType="TEXT"
            title={lesson.title}
            estimatedReadingTime={getEstimatedReadingTime(lesson.content || '')}
            onProgressUpdate={(percentage, timeSpent) => {
              handleProgressUpdate(percentage, timeSpent, {
                readingProgress: percentage
              })
            }}
            resumeContext={resumeManager.getReadingResumeContext()}
          />
        )}

        {/* READING Content */}
        {lesson.type === 'READING' && (
          <div className="space-y-6">
            <RichTextContentRenderer
              content={lesson.content || ''}
              lessonType="READING"
              title={lesson.title}
              estimatedReadingTime={getEstimatedReadingTime(lesson.content || '')}
              onProgressUpdate={(percentage, timeSpent) => {
                handleProgressUpdate(percentage, timeSpent, {
                  readingProgress: percentage
                })
              }}
              resumeContext={resumeManager.getReadingResumeContext()}
            />

            {/* Reading Assessment */}
            {lesson.quiz && (
              <div className="bg-white rounded-lg border p-6">
                <div className="bg-brand-secondary/5 border-l-4 border-brand-secondary p-4 mb-6">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-brand-secondary mr-2" />
                    <h3 className="text-lg font-medium text-brand-secondary-hover">Értelmező kérdések</h3>
                  </div>
                  <p className="text-brand-secondary-hover text-sm mt-1">
                    Most, hogy elolvasta a szöveget, válaszoljon az alábbi kérdésekre.
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Kvíz</h3>
                    <p className="text-sm text-gray-600">
                      {lesson.quiz.questions.length} kérdés • {lesson.quiz.passingScore}% szükséges a teljesítéshez
                    </p>
                  </div>
                  <Button onClick={() => setQuizOpen(true)} variant="default">
                    <Award className="w-4 h-4 mr-2" />
                    Kvíz megkezdése
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUIZ Content */}
        {lesson.type === 'QUIZ' && (
          <div className="p-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-brand-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-10 h-10 text-brand-secondary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Interaktív kvíz készen áll</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Tesztelje tudását az eddigi anyagról. A kvíz teljesítéséhez {lesson.quiz?.passingScore || 80}% szükséges.
                </p>
              </div>

              {lesson.quiz && (
                <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{lesson.quiz.questions.length}</div>
                      <div className="text-gray-500">Kérdés</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{lesson.quiz.passingScore}%</div>
                      <div className="text-gray-500">Átmenő</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">
                        {lesson.quiz.timeLimitMinutes || '∞'}
                      </div>
                      <div className="text-gray-500">Perc</div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-600">
                    {lesson.quiz.allowRetakes && (
                      <div className="flex items-center space-x-1">
                        <RotateCcw className="w-3 h-3" />
                        <span>Újrapróbálható</span>
                      </div>
                    )}
                    {lesson.quiz.questions.some(q => q.questionType === 'MULTIPLE') && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Többszörös választás</span>
                      </div>
                    )}
                    {lesson.quiz.questions.some(q => q.scenarioContent) && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Forgatókönyv</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setQuizOpen(true)} 
                size="lg"
                className="px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Interaktív kvíz indítása
              </Button>
            </div>
          </div>
        )}

        {/* PDF Content */}
        {lesson.type === 'PDF' && (
          lesson.pdfUrl ? (
            <PDFViewer
              pdfUrl={lesson.pdfUrl}
              title={lesson.title}
              onProgressUpdate={(percentage, timeSpent) => {
                handleProgressUpdate(percentage, timeSpent, {
                  pdfProgress: percentage
                })
              }}
              onPageChange={(currentPage, totalPages) => {
                // Track PDF page navigation
              }}
              enableAnnotations={true}
              enableDownload={true}
              resumeContext={resumeManager.getReadingResumeContext()}
            />
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">PDF dokumentum nem érhető el</h3>
              <p className="text-gray-600">A PDF fájl még nincs feltöltve ehhez a leckéhez.</p>
            </div>
          )
        )}

        {/* AUDIO Content */}
        {lesson.type === 'AUDIO' && (
          lesson.audioUrl ? (
            <div className="p-6">
              <AudioPlayer
                audioUrl={lesson.audioUrl}
                title={lesson.title}
                artist={playerData?.course?.instructor?.name || 'DMA oktató'}
                coverImage={lesson.thumbnailUrl}
                transcript={lesson.content} // Use content field for transcript
                chapters={playerData?.audioChapters || []}
                onProgressUpdate={(percentage, timeSpent) => {
                  handleProgressUpdate(percentage, timeSpent, {
                    audioProgress: percentage
                  })
                }}
                onCompleted={() => {
                  handleProgressUpdate(100, progress.timeSpent)
                }}
                enableDownload={true}
                resumeContext={resumeManager.getAudioResumeContext()}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hanganyag nem érhető el</h3>
              <p className="text-gray-600">Az audio fájl még nincs feltöltve ehhez a leckéhez.</p>
            </div>
          )
        )}
      </div>

      {/* Enhanced Quiz Engine */}
      {lesson.quiz && (
        <InteractiveQuizEngine
          open={quizOpen}
          onClose={() => setQuizOpen(false)}
          quiz={lesson.quiz}
          lessonTitle={lesson.title}
          onCompleted={(results) => {
            handleProgressUpdate(results.passed ? 100 : results.score, progress.timeSpent, {
              quizAttempts: (progress.metadata?.quizAttempts || 0) + 1,
              quizScore: results.score,
              quizPassed: results.passed,
              quizTimeSpent: results.timeSpent,
              quizResults: results
            })
          }}
          onPassed={() => {
            setQuizOpen(false)
            handleProgressUpdate(100, progress.timeSpent, {
              quizAttempts: (progress.metadata?.quizAttempts || 0) + 1,
              quizScore: 100,
              quizPassed: true
            })
          }}
          allowReview={true}
          resumeContext={resumeManager.getQuizResumeContext()}
        />
      )}
    </div>
  )
}