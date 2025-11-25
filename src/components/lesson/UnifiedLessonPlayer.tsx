"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play,
  Pause,
  BookOpen,
  MessageSquare,
  Target,
  Volume2,
  Settings,
  Monitor,
  Smartphone,
  RefreshCw as Sync,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Award,
  Zap,
  Eye,
  PictureInPicture,
  Maximize2,
  RotateCcw,
  FastForward,
  Film,
  Headphones,
  FileText,
  HelpCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VideoPlayerWithAdvancedControls } from './video/VideoPlayerWithAdvancedControls'
import { EnhancedChapterSystem } from './video/EnhancedChapterSystem'
import { EnhancedQuizEngine } from './quiz/EnhancedQuizEngine'
import { useAdvancedProgressSync } from '@/hooks/useAdvancedProgressSync'
import { useAdvancedResume } from '@/hooks/useAdvancedResume'
import { useGranularProgress } from '@/hooks/useGranularProgress'

// Unified lesson content interface
interface LessonContent {
  id: string
  type: 'video' | 'text' | 'quiz' | 'audio' | 'pdf' | 'interactive'
  title: string
  description?: string
  duration?: number
  order: number
  isRequired: boolean
  prerequisites?: string[]
  
  // Content-specific data
  videoData?: {
    src: string
    playbackId?: string
    poster?: string
    chapters: any[]
    subtitles: any[]
    bookmarks: any[]
    notes: any[]
  }
  
  textData?: {
    content: string
    sections: any[]
    attachments: any[]
  }
  
  quizData?: {
    questions: any[]
    passingScore: number
    allowRetry: boolean
    timeLimit?: number
  }
  
  audioData?: {
    src: string
    transcript?: string
    chapters: any[]
  }
  
  pdfData?: {
    src: string
    pages: number
    annotations: any[]
  }
}

// Unified lesson state
interface LessonState {
  currentContentIndex: number
  contentProgress: Record<string, {
    completionPercentage: number
    timeSpent: number
    lastAccessTime: Date
    isCompleted: boolean
    attempts?: number
    score?: number
  }>
  overallProgress: number
  sessionStartTime: Date
  totalTimeSpent: number
  analytics: {
    engagementScore: number
    interactionCount: number
    contentSwitches: number
    completionStreak: number
    averageTimePerContent: number
  }
}

// Learning path configuration
interface LearningPath {
  isLinear: boolean
  allowSkipping: boolean
  adaptivePath: boolean
  personalizedRecommendations: boolean
  difficultyAdjustment: boolean
}

// Unified UX settings
interface UnifiedUXSettings {
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean
  sidebarPosition: 'left' | 'right' | 'bottom'
  autoProgress: boolean
  distractionFreeMode: boolean
  accessibilityMode: boolean
  showProgressIndicators: boolean
  enableNotifications: boolean
  syncAcrossDevices: boolean
  saveProgressLocally: boolean
  showLearningAnalytics: boolean
  gamificationElements: boolean
}

interface Props {
  lessonId: string
  courseId: string
  lessonTitle: string
  courseTitle: string
  contents: LessonContent[]
  learningPath?: Partial<LearningPath>
  uxSettings?: Partial<UnifiedUXSettings>
  onComplete?: (analytics: any) => void
  onProgressUpdate?: (progress: number, analytics: any) => void
  onContentComplete?: (contentId: string, analytics: any) => void
  className?: string
}

export const UnifiedLessonPlayer: React.FC<Props> = ({
  lessonId,
  courseId,
  lessonTitle,
  courseTitle,
  contents,
  learningPath = {},
  uxSettings = {},
  onComplete,
  onProgressUpdate,
  onContentComplete,
  className
}) => {
  // State management
  const [lessonState, setLessonState] = useState<LessonState>({
    currentContentIndex: 0,
    contentProgress: {},
    overallProgress: 0,
    sessionStartTime: new Date(),
    totalTimeSpent: 0,
    analytics: {
      engagementScore: 0,
      interactionCount: 0,
      contentSwitches: 0,
      completionStreak: 0,
      averageTimePerContent: 0
    }
  })

  const [showSidebar, setShowSidebar] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)

  const mainContentRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Default configurations
  const defaultLearningPath: LearningPath = {
    isLinear: true,
    allowSkipping: false,
    adaptivePath: false,
    personalizedRecommendations: true,
    difficultyAdjustment: false,
    ...learningPath
  }

  const defaultUXSettings: UnifiedUXSettings = {
    theme: 'light',
    compactMode: false,
    sidebarPosition: 'right',
    autoProgress: false,
    distractionFreeMode: false,
    accessibilityMode: false,
    showProgressIndicators: true,
    enableNotifications: true,
    syncAcrossDevices: true,
    saveProgressLocally: true,
    showLearningAnalytics: true,
    gamificationElements: true,
    ...uxSettings
  }

  // Current content
  const currentContent = contents[lessonState.currentContentIndex]
  const currentProgress = lessonState.contentProgress[currentContent?.id] || {
    completionPercentage: 0,
    timeSpent: 0,
    lastAccessTime: new Date(),
    isCompleted: false
  }

  // Hooks integration
  const { 
    progressData, 
    updateProgress, 
    syncStatus,
    forceSync 
  } = useAdvancedProgressSync({
    lessonId,
    courseId,
    contentType: currentContent?.type || 'video'
  })

  const {
    resumePoint,
    showResumePrompt,
    handleResumeAction,
    dismissResumePrompt,
    canResume
  } = useAdvancedResume({
    lessonId,
    courseId,
    contentType: currentContent?.type || 'video',
    title: lessonTitle
  })

  const {
    metrics,
    trackInteraction,
    progressSummary,
    isCompleted: contentCompleted
  } = useGranularProgress({
    lessonId,
    courseId,
    contentType: currentContent?.type || 'video',
    completionCriteria: {
      type: 'basic',
      minimumCompletionPercentage: 80,
      minimumTimeSpent: 30
    },
    onCompletion: (completionMetrics) => {
      handleContentComplete(currentContent.id, completionMetrics)
    }
  })

  // Calculate overall lesson progress
  const calculateOverallProgress = useCallback(() => {
    const totalContents = contents.length
    const completedContents = Object.values(lessonState.contentProgress)
      .filter(progress => progress.isCompleted).length
    
    const weightedProgress = contents.reduce((sum, content, index) => {
      const progress = lessonState.contentProgress[content.id]
      const weight = content.isRequired ? 1.5 : 1
      return sum + (progress?.completionPercentage || 0) * weight
    }, 0)
    
    const totalWeight = contents.reduce((sum, content) => 
      sum + (content.isRequired ? 1.5 : 1), 0
    )
    
    return Math.min(100, (weightedProgress / totalWeight))
  }, [contents, lessonState.contentProgress])

  // Handle content navigation
  const navigateToContent = useCallback((index: number) => {
    if (index < 0 || index >= contents.length) return
    
    // Check prerequisites if linear path
    if (defaultLearningPath.isLinear && !defaultLearningPath.allowSkipping) {
      for (let i = 0; i < index; i++) {
        const prevContent = contents[i]
        const prevProgress = lessonState.contentProgress[prevContent.id]
        if (prevContent.isRequired && !prevProgress?.isCompleted) {
          return // Cannot skip required content
        }
      }
    }

    setLessonState(prev => ({
      ...prev,
      currentContentIndex: index,
      analytics: {
        ...prev.analytics,
        contentSwitches: prev.analytics.contentSwitches + 1
      }
    }))

    trackInteraction('content_navigation', { 
      from: lessonState.currentContentIndex, 
      to: index 
    })
  }, [contents, lessonState.currentContentIndex, defaultLearningPath, trackInteraction])

  // Handle content completion
  const handleContentComplete = useCallback((contentId: string, analytics: any) => {
    setLessonState(prev => {
      const newProgress = {
        ...prev.contentProgress,
        [contentId]: {
          ...prev.contentProgress[contentId],
          isCompleted: true,
          completionPercentage: 100,
          lastAccessTime: new Date()
        }
      }

      const newOverallProgress = calculateOverallProgress()
      const updatedState = {
        ...prev,
        contentProgress: newProgress,
        overallProgress: newOverallProgress,
        analytics: {
          ...prev.analytics,
          completionStreak: prev.analytics.completionStreak + 1
        }
      }

      // Auto-progress to next content if enabled
      if (defaultUXSettings.autoProgress && prev.currentContentIndex < contents.length - 1) {
        setTimeout(() => {
          navigateToContent(prev.currentContentIndex + 1)
        }, 2000)
      }

      return updatedState
    })

    // Sync progress
    updateProgress({
      completionPercentage: 100,
      isCompleted: true,
      lastUpdated: new Date()
    })

    if (onContentComplete) {
      onContentComplete(contentId, analytics)
    }

    // Check if entire lesson is complete
    const completedCount = Object.values(lessonState.contentProgress)
      .filter(p => p.isCompleted).length + 1
    
    if (completedCount === contents.length) {
      handleLessonComplete()
    }
  }, [lessonState.contentProgress, calculateOverallProgress, contents.length, 
      defaultUXSettings.autoProgress, navigateToContent, updateProgress, onContentComplete])

  // Handle lesson completion
  const handleLessonComplete = useCallback(() => {
    const finalAnalytics = {
      ...lessonState.analytics,
      totalTimeSpent: Date.now() - lessonState.sessionStartTime.getTime(),
      overallProgress: 100,
      completionRate: 100,
      averageEngagement: lessonState.analytics.engagementScore
    }

    if (onComplete) {
      onComplete(finalAnalytics)
    }

    // Show completion celebration if gamification is enabled
    if (defaultUXSettings.gamificationElements) {
      // Trigger celebration animation
      trackInteraction('lesson_completed', finalAnalytics)
    }
  }, [lessonState, onComplete, defaultUXSettings.gamificationElements, trackInteraction])

  // Handle content progress updates
  const handleContentProgress = useCallback((contentId: string, progress: number, timeSpent: number) => {
    setLessonState(prev => ({
      ...prev,
      contentProgress: {
        ...prev.contentProgress,
        [contentId]: {
          ...prev.contentProgress[contentId],
          completionPercentage: progress,
          timeSpent,
          lastAccessTime: new Date()
        }
      },
      totalTimeSpent: prev.totalTimeSpent + 1000 // Increment by 1 second
    }))

    // Sync progress
    updateProgress({
      completionPercentage: progress,
      timeSpent,
      lastUpdated: new Date()
    })

    if (onProgressUpdate) {
      onProgressUpdate(calculateOverallProgress(), lessonState.analytics)
    }
  }, [updateProgress, calculateOverallProgress, lessonState.analytics, onProgressUpdate])

  // Render content based on type
  const renderContent = (content: LessonContent) => {
    const commonProps = {
      key: content.id,
      onProgress: (progress: number, timeSpent: number) => 
        handleContentProgress(content.id, progress, timeSpent),
      className: "w-full"
    }

    switch (content.type) {
      case 'video':
        return (
          <VideoPlayerWithAdvancedControls
            {...commonProps}
            src={content.videoData?.src || ''}
            playbackId={content.videoData?.playbackId}
            poster={content.videoData?.poster}
            lessonTitle={content.title}
            courseTitle={courseTitle}
            lessonId={lessonId}
            courseId={courseId}
            chapters={content.videoData?.chapters || []}
            bookmarks={content.videoData?.bookmarks || []}
            notes={content.videoData?.notes || []}
            subtitles={content.videoData?.subtitles || []}
            enableAdvancedControls={true}
            enablePiP={true}
            nextLesson={
              lessonState.currentContentIndex < contents.length - 1 
                ? {
                    id: contents[lessonState.currentContentIndex + 1].id,
                    title: contents[lessonState.currentContentIndex + 1].title
                  }
                : undefined
            }
            onNextLesson={() => navigateToContent(lessonState.currentContentIndex + 1)}
          />
        )

      case 'quiz':
        return (
          <EnhancedQuizEngine
            {...commonProps}
            questions={content.quizData?.questions || []}
            title={content.title}
            description={content.description}
            passingScore={content.quizData?.passingScore || 70}
            allowRetry={content.quizData?.allowRetry ?? true}
            showProgress={true}
            showTimer={!!content.quizData?.timeLimit}
            immediateMessages={true}
            shuffleQuestions={false}
            adaptiveDifficulty={defaultLearningPath.difficultyAdjustment}
            enableAnalytics={defaultUXSettings.showLearningAnalytics}
            onComplete={(analytics) => handleContentComplete(content.id, analytics)}
          />
        )

      case 'text':
        return (
          <Card className="p-6">
            <div className="prose prose-lg max-w-none">
              <h1>{content.title}</h1>
              {content.description && <p className="lead">{content.description}</p>}
              {content.textData?.content && (
                <div dangerouslySetInnerHTML={{ __html: content.textData.content }} />
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => handleContentComplete(content.id, { readingTime: 300 })}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Elolvasom befejezése
              </Button>
            </div>
          </Card>
        )

      default:
        return (
          <Card className="p-6 text-center">
            <div className="text-gray-500">
              <HelpCircle className="w-8 h-8 mx-auto mb-2" />
              Nem támogatott tartalom típus: {content.type}
            </div>
          </Card>
        )
    }
  }

  // Render sidebar content
  const renderSidebar = () => (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Tartalom</TabsTrigger>
          <TabsTrigger value="progress">Haladás</TabsTrigger>
          <TabsTrigger value="notes">Jegyzet</TabsTrigger>
          <TabsTrigger value="help">Segítség</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-3">
          <div className="space-y-2">
            {contents.map((content, index) => {
              const progress = lessonState.contentProgress[content.id]
              const isCurrent = index === lessonState.currentContentIndex
              const isCompleted = progress?.isCompleted
              const isLocked = defaultLearningPath.isLinear && 
                !defaultLearningPath.allowSkipping && 
                index > 0 && 
                !lessonState.contentProgress[contents[index - 1].id]?.isCompleted

              return (
                <Card 
                  key={content.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isCurrent && "ring-2 ring-brand-secondary bg-brand-secondary/5",
                    isCompleted && "bg-green-50 border-green-200",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isLocked && navigateToContent(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isCurrent ? (
                        <Play className="w-5 h-5 text-brand-secondary" />
                      ) : isLocked ? (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {content.title}
                        </span>
                        {content.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Kötelező
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          {content.type === 'video' && <Film className="w-3 h-3 mr-1" />}
                          {content.type === 'quiz' && <Target className="w-3 h-3 mr-1" />}
                          {content.type === 'text' && <FileText className="w-3 h-3 mr-1" />}
                          {content.type === 'audio' && <Headphones className="w-3 h-3 mr-1" />}
                          
                          {content.duration && (
                            <span>{Math.ceil(content.duration / 60)} perc</span>
                          )}
                        </div>
                        
                        {progress && (
                          <div className="text-xs text-gray-500">
                            {Math.round(progress.completionPercentage)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Összesített haladás</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Teljesítés</span>
                <span>{Math.round(calculateOverallProgress())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-brand-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateOverallProgress()}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <div className="text-gray-500">Befejezett</div>
                  <div className="font-medium">
                    {Object.values(lessonState.contentProgress).filter(p => p.isCompleted).length} / {contents.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Eltöltött idő</div>
                  <div className="font-medium">
                    {Math.round((Date.now() - lessonState.sessionStartTime.getTime()) / 60000)} perc
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {defaultUXSettings.showLearningAnalytics && (
            <Card className="p-4">
              <h4 className="font-medium mb-3">Tanulási elemzés</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Elköteleződés pontszám</span>
                  <span>{lessonState.analytics.engagementScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Interakciók száma</span>
                  <span>{lessonState.analytics.interactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Befejezési sorozat</span>
                  <span>{lessonState.analytics.completionStreak}</span>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card className="p-4 text-center text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p>A jegyzetelés funkció hamarosan elérhető</p>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Gyors segítség</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Billentyűparancsok:</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>Space - Lejátszás/szünet</li>
                  <li>← → - Navigáció</li>
                  <li>F - Teljes képernyő</li>
                  <li>M - Némítás</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Szinkronizálás</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Sync className={cn(
                  "w-4 h-4",
                  syncStatus.isSyncing && "animate-spin"
                )} />
                {syncStatus.isSyncing ? 'Szinkronizálás...' : 'Szinkronizálva'}
              </div>
              <Button variant="outline" size="sm" onClick={forceSync}>
                Kényszerített szinkronizálás
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Resume Dialog */}
      {showResumePrompt && canResume && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <h3 className="text-lg font-medium mb-4">Folytatás ahol abbahagyta</h3>
            <p className="text-gray-600 mb-4">
              Úgy tűnik, korábban már elkezdett dolgozni ezen a lecke. Szeretné folytatni?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={dismissResumePrompt}>
                Újrakezdés
              </Button>
              <Button onClick={() => resumePoint && handleResumeAction(resumePoint)}>
                Folytatás
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{lessonTitle}</h1>
            <p className="text-gray-600">{courseTitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            {defaultUXSettings.showProgressIndicators && (
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateOverallProgress()}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(calculateOverallProgress())}%
                </span>
              </div>
            )}

            {/* Sync status */}
            {defaultUXSettings.syncAcrossDevices && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Sync className={cn(
                  "w-4 h-4",
                  syncStatus.isSyncing && "animate-spin"
                )} />
                {syncStatus.lastSyncTime && (
                  <span>
                    {syncStatus.lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? 'Oldalsáv elrejtése' : 'Oldalsáv megjelenítése'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex">
        {/* Content area */}
        <div 
          ref={mainContentRef}
          className={cn(
            "flex-1 p-6",
            showSidebar && defaultUXSettings.sidebarPosition === 'right' && "pr-6",
            showSidebar && defaultUXSettings.sidebarPosition === 'left' && "pl-6"
          )}
        >
          {currentContent ? renderContent(currentContent) : (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                Nincs elérhető tartalom
              </div>
            </Card>
          )}

          {/* Navigation controls */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => navigateToContent(lessonState.currentContentIndex - 1)}
              disabled={lessonState.currentContentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Előző
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {lessonState.currentContentIndex + 1} / {contents.length}
              </span>
              <Badge variant="outline">
                {currentContent?.type}
              </Badge>
            </div>

            <Button
              variant="outline"
              onClick={() => navigateToContent(lessonState.currentContentIndex + 1)}
              disabled={lessonState.currentContentIndex === contents.length - 1}
              className="gap-2"
            >
              Következő
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div 
            ref={sidebarRef}
            className={cn(
              "w-80 bg-white border-l p-6 overflow-y-auto",
              defaultUXSettings.compactMode && "w-64"
            )}
          >
            {renderSidebar()}
          </div>
        )}
      </div>
    </div>
  )
}