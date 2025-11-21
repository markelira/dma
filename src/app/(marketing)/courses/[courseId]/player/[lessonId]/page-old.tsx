"use client"

import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { usePlayerData } from '@/hooks/usePlayerData'
import { useLesson, fetchLesson } from '@/hooks/useLessonQueries'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useLessonProgress } from '@/hooks/useLessonProgress'
import { useEnrollmentTracking } from '@/hooks/useEnrollmentTracking'
import { useAuthStore } from '@/stores/authStore'
import { PlayerLayout } from '@/components/course-player/PlayerLayout'
import { PlayerSkeleton } from '@/components/course-player/PlayerSkeleton'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function PlayerPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string }
  const router = useRouter()
  const { user, authReady, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [showAutoAdvance, setShowAutoAdvance] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const { data: playerData, isLoading: playerLoading, error: playerError } = usePlayerData(courseId, lessonId)
  const course = playerData?.course
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId, courseId)
  const { data: subStatus } = useSubscriptionStatus()
  const progressMutation = useLessonProgress()
  const { trackLessonAccess } = useEnrollmentTracking()

  const hasSub = subStatus?.hasActiveSubscription ?? false

  // Calculate navigation (do this before any returns to avoid hooks order issues)
  const modules = course?.modules || []
  const flatLessons = modules.flatMap((m: any) =>
    (m.lessons as any[]).sort((a: any, b: any) => a.order - b.order).map((l: any) => ({
      ...l,
      moduleId: m.id,
      moduleOrder: m.order
    }))
  )
  const currentIndex = flatLessons.findIndex((l: any) => l.id === lessonId)
  const nextLesson = currentIndex < flatLessons.length-1 ? flatLessons[currentIndex+1] : null

  // Auto-redirect if course/lesson not found - MUST be before any early returns
  useEffect(() => {
    if (!authReady || !isAuthenticated) return
    if (playerLoading || lessonLoading) return

    if (!playerLoading && !lessonLoading) {
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
  }, [authReady, isAuthenticated, playerLoading, lessonLoading, course, lesson, courseId, router, playerError, lessonError])

  // Preload next lesson data for smooth transitions - MUST be before any early returns
  useEffect(() => {
    if (nextLesson && course) {
      queryClient.prefetchQuery({
        queryKey: ['lesson', nextLesson.id, courseId],
        queryFn: () => fetchLesson(nextLesson.id, courseId),
        staleTime: 5 * 60 * 1000, // Match useLesson's staleTime
      })
    }
  }, [nextLesson, courseId, queryClient, course])

  // Track lesson access for enrollment - MUST be before any early returns
  useEffect(() => {
    if (!authReady || !isAuthenticated) return
    if (playerLoading || lessonLoading) return
    if (!course || !lesson) return

    // Track the lesson access in enrollment
    trackLessonAccess(courseId, lessonId)
  }, [authReady, isAuthenticated, playerLoading, lessonLoading, course, lesson, courseId, lessonId, trackLessonAccess])

  // Auto-advance countdown - MUST be before any early returns
  useEffect(() => {
    if (!showAutoAdvance || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push(`/courses/${courseId}/player/${nextLesson!.id}`)
          setShowAutoAdvance(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showAutoAdvance, countdown, router, courseId, nextLesson])

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

  // Show loading state with skeleton
  if (playerLoading || lessonLoading) {
    return <PlayerSkeleton />
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

  const handleProgress = (percentage: number, time: number, analytics?: any) => {
    if (percentage < 5) return
    
    // Send progress to backend
    progressMutation.mutate({ lessonId, watchPercentage: percentage, timeSpent: time })
  }

  const handleEnded = () => {
    // Mark as complete
    progressMutation.mutate({ lessonId, watchPercentage: 100 })

    // Show auto-advance UI if next lesson exists
    if (course?.autoplayNext !== false && nextLesson) {
      setShowAutoAdvance(true)
      setCountdown(5)
    }
  }

  const cancelAutoAdvance = () => {
    setShowAutoAdvance(false)
    setCountdown(5)
  }

  return (
    <>
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

      {/* Auto-advance countdown overlay */}
      {showAutoAdvance && nextLesson && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Lecke befejezve!</h3>
              <p className="text-gray-600">Következő lecke indítása {countdown} másodperc múlva...</p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Következő:</p>
              <p className="font-semibold text-gray-900">{nextLesson.title}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelAutoAdvance}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={() => router.push(`/courses/${courseId}/player/${nextLesson.id}`)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Indítás most
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}