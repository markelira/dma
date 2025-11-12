"use client"

import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { usePlayerData } from '@/hooks/usePlayerData'
import { useLesson } from '@/hooks/useLessonQueries'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useLessonProgress } from '@/hooks/useLessonProgress'
import { useAuthStore } from '@/stores/authStore'
import { PlayerLayout } from '@/components/course-player/PlayerLayout'
import { useEffect } from 'react'

export default function PlayerPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string }
  const router = useRouter()
  const { user, authReady, isAuthenticated } = useAuthStore()

  // Debug log
  console.log('🎬 Player Page - courseId:', courseId, 'lessonId:', lessonId)
  console.log('🎬 Player Page - Auth status:', { authReady, isAuthenticated, hasUser: !!user })

  const { data: playerData, isLoading: playerLoading, error: playerError } = usePlayerData(courseId, lessonId)
  const course = playerData?.course
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId, courseId)
  const { data: subStatus } = useSubscriptionStatus()
  const progressMutation = useLessonProgress()

  // Debug log
  console.log('🎬 Player Page - Data status:', {
    playerLoading,
    lessonLoading,
    hasCourse: !!course,
    hasLesson: !!lesson,
    playerError: playerError?.message,
    lessonError: lessonError?.message
  })

  const hasSub = subStatus?.hasActiveSubscription ?? false

  // Check auth status first
  if (!authReady) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Autentikáció inicializálása...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  // Hard block: Check subscription status
  if (subStatus && !hasSub) {
    const returnUrl = `/courses/${courseId}/player/${lessonId}`;
    router.push(`/pricing?reason=subscription_required&returnTo=${encodeURIComponent(returnUrl)}`);
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Átirányítás az előfizetés oldalra...</p>
        </div>
      </div>
    );
  }

  // Auto-redirect if course/lesson not found
  // Only redirect after both queries have finished loading
  useEffect(() => {
    // Wait for both to finish loading
    if (playerLoading || lessonLoading) return
    
    // Only check after loading is complete
    if (!playerLoading && !lessonLoading) {
      // Check for missing data
      if (!course && !playerError) {
        console.error('Player: Course not found, redirecting to /courses')
        router.push('/courses')
        return
      }
      
      if (!lesson && !lessonError) {
        console.error('Player: Lesson not found, redirecting to course page')
        router.push(`/courses/${courseId}`)
        return
      }
    }
  }, [playerLoading, lessonLoading, course, lesson, courseId, router, playerError, lessonError])

  // Show loading state
  if (playerLoading || lessonLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Lecke betöltése...</p>
        </div>
      </div>
    )
  }

  // Show error if there was an error loading
  if (playerError || lessonError) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Hiba történt a betöltés során</h2>
          <p className="text-gray-300 mb-4">
            {playerError?.message || lessonError?.message || 'Ismeretlen hiba'}
          </p>
          <button 
            onClick={() => router.push('/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Vissza a kurzusokhoz
          </button>
        </div>
      </div>
    )
  }

  // Show error if data missing after loading
  if (!playerLoading && !lessonLoading && (!course || !lesson)) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Tartalom nem található</h2>
          <p className="text-gray-300 mb-4">A kért lecke vagy kurzus nem érhető el.</p>
          <button 
            onClick={() => router.push('/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Vissza a kurzusokhoz
          </button>
        </div>
      </div>
    )
  }

  const modules = course?.modules || []

  // Calculate navigation
  const flatLessons = modules.flatMap((m: any) =>
    (m.lessons as any[]).sort((a: any, b: any) => a.order - b.order).map((l: any) => ({ 
      ...l, 
      moduleId: m.id, 
      moduleOrder: m.order 
    }))
  )
  const currentIndex = flatLessons.findIndex((l: any) => l.id === lessonId)
  const nextLesson = currentIndex < flatLessons.length-1 ? flatLessons[currentIndex+1] : null

  const handleProgress = (percentage: number, time: number, analytics?: any) => {
    if (percentage < 5) return
    
    // Send progress to backend
    progressMutation.mutate({ lessonId, watchPercentage: percentage, timeSpent: time })
    
    // Enhanced analytics logging for player mode
    if (analytics && analytics.engagementEvents.length > 0) {
      console.log('🎥 Player Analytics:', {
        mode: 'dedicated_player',
        sessionId: analytics.sessionId,
        courseId,
        lessonId,
        totalEvents: analytics.engagementEvents.length,
        progressMarkers: analytics.progressMarkers.length,
        watchTime: time,
        engagementScore: analytics.engagementEvents.length / Math.max(1, Math.floor(time / 60)) // events per minute
      })
    }
  }

  const handleEnded = () => {
    // Mark as complete
    progressMutation.mutate({ lessonId, watchPercentage: 100 })
    
    // Auto-advance to next lesson in player mode
    if (course?.autoplayNext && nextLesson) {
      setTimeout(() => {
        router.push(`/courses/${courseId}/player/${nextLesson.id}`)
      }, 2000) // 2 second delay for better UX
    }
  }

  return (
    <PlayerLayout
      course={course}
      lesson={lesson}
      playerData={playerData}
      modules={modules}
      currentLessonId={lessonId}
      userId={user?.uid}
      onProgress={handleProgress}
      onEnded={handleEnded}
      hasSubscription={hasSub}
    />
  )
}