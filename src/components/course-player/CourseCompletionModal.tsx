'use client'

/**
 * Course Completion Celebration Modal
 *
 * Full-screen modal with confetti animation that appears
 * when a user completes a course. Offers navigation options.
 */

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { CheckCircle, BookOpen, Home, ArrowLeft } from 'lucide-react'

interface CourseCompletionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Course title to display */
  courseTitle: string
  /** Course ID for navigation */
  courseId: string
  /** Callback when modal is dismissed */
  onDismiss: () => void
}

/**
 * Fire confetti animation
 */
function fireConfetti() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    // Left side burst
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    })

    // Right side burst
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    })
  }, 250)
}

export function CourseCompletionModal({
  isOpen,
  courseTitle,
  courseId,
  onDismiss,
}: CourseCompletionModalProps) {
  const router = useRouter()

  // Fire confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is visible
      const timer = setTimeout(() => {
        fireConfetti()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onDismiss])

  // Navigation handlers
  const handleGoToCourse = useCallback(() => {
    onDismiss()
    router.push(`/courses/${courseId}`)
  }, [onDismiss, router, courseId])

  const handleGoToDashboard = useCallback(() => {
    onDismiss()
    router.push('/dashboard')
  }, [onDismiss, router])

  const handleGoToHome = useCallback(() => {
    onDismiss()
    router.push('/')
  }, [onDismiss, router])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onDismiss()
      }
    },
    [onDismiss]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-brand-secondary/50 via-brand-secondary to-indigo-600 px-6 py-8 text-center">
            {/* Success icon */}
            <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-500 delay-150">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>

            {/* Congratulations text */}
            <h2
              id="completion-title"
              className="text-2xl font-bold text-white mb-2 animate-in slide-in-from-bottom duration-500 delay-200"
            >
              Gratulálunk! 🎉
            </h2>
            <p className="text-brand-secondary-light animate-in slide-in-from-bottom duration-500 delay-300">
              Sikeresen befejezted a kurzust!
            </p>
          </div>

          {/* Course title */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-center text-gray-600 text-sm">Befejezett kurzus:</p>
            <p className="text-center text-gray-900 font-bold mt-1 line-clamp-2">
              {courseTitle}
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleGoToCourse}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-secondary hover:bg-brand-secondary-hover text-white font-medium rounded-xl transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Vissza a kurzushoz
            </button>

            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
            >
              <BookOpen className="w-5 h-5" />
              Kurzusaim
            </button>

            <button
              onClick={handleGoToHome}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
            >
              <Home className="w-5 h-5" />
              Főoldal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCompletionModal
