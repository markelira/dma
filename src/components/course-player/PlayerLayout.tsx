"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { LessonContentRenderer } from '@/components/lesson/LessonContentRenderer'
import { CourseNavigationSidebar } from './CourseNavigationSidebar'
import { LessonTabs } from './LessonTabs'
import { LearningCompanionPanel } from './LearningCompanionPanel'
import { PlayerHeader } from './PlayerHeader'
import { ReportIssueDialog } from './ReportIssueDialog'
import { Button } from '@/components/ui/button'
import { playerComponents } from '@/lib/course-player-design-system'
import { useTranslation } from '@/hooks/useTranslation'
import { useToast } from '@/hooks/use-toast'

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
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showReportIssueDialog, setShowReportIssueDialog] = useState(false)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [isDownloadingResources, setIsDownloadingResources] = useState(false)

  // Calculate navigation
  const flatLessons = useMemo(() => {
    return modules.flatMap((m: any) =>
      (m.lessons as any[])
        .sort((a: any, b: any) => a.order - b.order)
        .map((l: any) => ({
          ...l,
          moduleId: m.id,
          moduleOrder: m.order,
          moduleTitle: m.title
        }))
    )
  }, [modules])

  const currentIndex = flatLessons.findIndex((l: any) => l.id === currentLessonId)
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null

  // Calculate course progress
  const courseStats = useMemo(() => {
    const totalLessons = flatLessons.length
    const completedLessons = flatLessons.filter(
      (l: any) =>
        l.progress?.completed || (l.progress?.watchPercentage ?? 0) >= 90
    ).length
    const overallProgress =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return { totalLessons, completedLessons, overallProgress }
  }, [flatLessons])

  // Find current module
  const currentModule = modules.find((m: any) =>
    m.lessons.some((l: any) => l.id === currentLessonId)
  )

  // Learning outcomes - use from lesson data or fallback to placeholders
  const learningOutcomes = lesson?.learningOutcomes || [
    t('placeholders.learningOutcome1'),
    t('placeholders.learningOutcome2'),
    t('placeholders.learningOutcome3')
  ]

  const locked = !hasSubscription && lesson?.subscriptionTier === 'PREMIUM'

  const handleLessonClick = (lessonId: string) => {
    router.push(`/courses/${course.id}/player/${lessonId}`)
  }

  const handleMarkComplete = async () => {
    if (isMarkingComplete) return

    setIsMarkingComplete(true)
    try {
      const markLessonComplete = httpsCallable(functions, 'markLessonComplete')
      const result = await markLessonComplete({
        lessonId: currentLessonId,
        courseId: course.id,
        timeSpent: lesson.duration || 0,
        analytics: {
          sessionId: `session_${Date.now()}`,
        }
      })

      const data = result.data as any

      if (data.success) {
        // Update local progress
        onProgress(100, lesson.duration || 0)

        // Show success message
        toast({
          title: data.data?.courseCompleted ? 'Gratulálunk!' : 'Lecke befejezve!',
          description: data.message,
          variant: 'default',
        })

        // If course completed, you might want to redirect or show celebration
        if (data.data?.courseCompleted) {
          setTimeout(() => {
            router.push(`/courses/${course.id}`)
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
      toast({
        title: 'Hiba történt',
        description: 'Nem sikerült befejezettnek jelölni a leckét. Próbáld újra!',
        variant: 'destructive',
      })
    } finally {
      setIsMarkingComplete(false)
    }
  }

  const handleDownloadResources = async () => {
    if (isDownloadingResources) return

    setIsDownloadingResources(true)
    try {
      const getResourceDownloadUrls = httpsCallable(functions, 'getResourceDownloadUrls')
      const result = await getResourceDownloadUrls({
        lessonId: currentLessonId,
        courseId: course.id,
      })

      const data = result.data as any

      if (data.success && data.resources) {
        const availableResources = data.resources.filter((r: any) => r.available)

        if (availableResources.length === 0) {
          toast({
            title: 'Nincs elérhető forrás',
            description: 'Ehhez a leckéhez jelenleg nincsenek letölthető források.',
            variant: 'default',
          })
          return
        }

        // Download all resources
        availableResources.forEach((resource: any, index: number) => {
          setTimeout(() => {
            const link = document.createElement('a')
            link.href = resource.downloadUrl
            link.download = resource.title || `resource_${index + 1}`
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }, index * 500) // Stagger downloads by 500ms
        })

        toast({
          title: 'Források letöltése',
          description: `${availableResources.length} forrás letöltése elindult...`,
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Error downloading resources:', error)
      toast({
        title: 'Hiba történt',
        description: 'Nem sikerült letölteni a forrásokat. Próbáld újra!',
        variant: 'destructive',
      })
    } finally {
      setIsDownloadingResources(false)
    }
  }

  const handleReportIssue = () => {
    setShowReportIssueDialog(true)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PlayerHeader
        courseTitle={course?.title || 'Course'}
        courseId={course?.id}
        moduleTitle={currentModule?.title}
        lessonTitle={lesson?.title || 'Lesson'}
        overallProgress={courseStats.overallProgress}
      />

      {/* Main Content Area - 3 Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Course Navigation */}
        {showLeftSidebar && (
          <CourseNavigationSidebar
            course={course}
            currentLessonId={currentLessonId}
            onLessonClick={handleLessonClick}
            onClose={() => setShowLeftSidebar(false)}
            className="hidden lg:block"
          />
        )}

        {/* Main Content Column */}
        <main className="flex-1 overflow-y-auto" role="main">
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Video Player / Content Area */}
            {!locked && lesson && (
              <div className={playerComponents.card}>
                <div className="bg-black rounded-t-lg overflow-hidden">
                  <LessonContentRenderer
                    lesson={lesson}
                    playerData={playerData}
                    courseId={course.id}
                    userId={userId}
                    onProgress={onProgress}
                    onCompleted={onEnded}
                    hasAccess={hasSubscription}
                  />
                </div>
              </div>
            )}

            {locked && (
              <div className={`${playerComponents.card} p-12 text-center`}>
                <div className="max-w-md mx-auto">
                  <div
                    className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"
                  >
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('subscription.required')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t('subscription.message')}
                  </p>
                  <Button onClick={() => router.push(`/courses/${course.id}`)}>
                    {t('subscription.viewPlans')}
                  </Button>
                </div>
              </div>
            )}

            {/* Lesson Tabs */}
            {!locked && (
              <LessonTabs lesson={lesson} learningOutcomes={learningOutcomes} />
            )}

            {/* Bottom Navigation */}
            {!locked && (
              <div className={`${playerComponents.card} p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    {prevLesson && (
                      <Button
                        variant="outline"
                        onClick={() => handleLessonClick(prevLesson.id)}
                        className="gap-2"
                      >
                        <ChevronLeft size={16} />
                        <div className="text-left hidden sm:block">
                          <div className="text-xs text-gray-500">{t('navigation.previous')}</div>
                          <div className="text-sm font-medium truncate max-w-[200px]">
                            {prevLesson.title}
                          </div>
                        </div>
                        <span className="sm:hidden">{t('navigation.previous')}</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 text-center px-4">
                    <div className="text-sm text-gray-600">
                      {t('navigation.lessonCounter', { current: currentIndex + 1, total: flatLessons.length })}
                    </div>
                  </div>

                  <div>
                    {nextLesson && (
                      <Button
                        onClick={() => handleLessonClick(nextLesson.id)}
                        className="gap-2"
                      >
                        <div className="text-right hidden sm:block">
                          <div className="text-xs opacity-90">{t('navigation.next')}</div>
                          <div className="text-sm font-medium truncate max-w-[200px]">
                            {nextLesson.title}
                          </div>
                        </div>
                        <span className="sm:hidden">{t('navigation.next')}</span>
                        <ChevronRight size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Panel - Learning Companion */}
        {showRightPanel && !locked && (
          <LearningCompanionPanel
            lesson={lesson}
            courseProgress={courseStats.overallProgress}
            totalLessons={courseStats.totalLessons}
            completedLessons={courseStats.completedLessons}
            learningOutcomes={learningOutcomes}
            onMarkComplete={handleMarkComplete}
            onDownloadResources={handleDownloadResources}
            onReportIssue={handleReportIssue}
            className="hidden xl:block"
          />
        )}
      </div>

      {/* Report Issue Dialog */}
      <ReportIssueDialog
        open={showReportIssueDialog}
        onOpenChange={setShowReportIssueDialog}
        lessonId={currentLessonId}
        courseId={course.id}
        lessonTitle={lesson?.title}
        courseTitle={course?.title}
      />

      {/* Mobile Sidebar Overlay */}
      {showLeftSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowLeftSidebar(false)}
        >
          <div className="h-full" onClick={(e) => e.stopPropagation()}>
            <CourseNavigationSidebar
              course={course}
              currentLessonId={currentLessonId}
              onLessonClick={(lessonId) => {
                handleLessonClick(lessonId)
                setShowLeftSidebar(false)
              }}
              onClose={() => setShowLeftSidebar(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Menu Toggle (Bottom Right FAB) */}
      <button
        onClick={() => setShowLeftSidebar(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#0066CC] text-white rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-[#0052A3] transition-colors"
        aria-label={t('navigation.openCourseMenu')}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  )
}
