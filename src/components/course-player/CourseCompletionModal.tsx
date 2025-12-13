'use client'

/**
 * Course Completion Celebration Modal
 *
 * Full-screen modal with confetti animation that appears
 * when a user completes 90% of a course. Dynamic messaging based on course type.
 */

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { CheckCircle, X as CloseIcon } from 'lucide-react'
import { CourseType } from '@/types'

interface CourseCompletionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Course title to display */
  courseTitle: string
  /** Course ID for navigation */
  courseId: string
  /** Course type for dynamic messaging */
  courseType?: CourseType
  /** Callback when modal is dismissed */
  onDismiss: () => void
}

/**
 * Fire confetti animation
 */
function fireConfetti() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10001 }

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

/**
 * Get dynamic title based on course type
 */
function getCompletionTitle(courseType?: CourseType): string {
  switch (courseType) {
    case 'WEBINAR':
      return 'Sikeresen befejezted a Webinárt!'
    case 'MASTERCLASS':
      return 'Sikeresen befejezted a Masterclass-t!'
    case 'ACADEMIA':
      return 'Sikeresen befejezted az Akadémiát!'
    case 'PODCAST':
      return 'Sikeresen befejezted a Podcast-ot!'
    default:
      return 'Sikeresen befejezted a kurzust!'
  }
}

/**
 * Get dynamic content type label
 */
function getContentTypeLabel(courseType?: CourseType): string {
  switch (courseType) {
    case 'WEBINAR':
      return 'Befejezett Webinár:'
    case 'MASTERCLASS':
      return 'Befejezett Masterclass:'
    case 'ACADEMIA':
      return 'Befejezett Akadémia:'
    case 'PODCAST':
      return 'Befejezett Podcast:'
    default:
      return 'Befejezett kurzus:'
  }
}

export function CourseCompletionModal({
  isOpen,
  courseTitle,
  courseId,
  courseType,
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

  // Handle going back to homepage
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
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative z-[10000] w-full max-w-md mx-4">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-brand-secondary/50 to-brand-secondary opacity-20 blur-2xl rounded-3xl" />

        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 z-10 rounded-full p-1.5 bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Bezárás"
          >
            <CloseIcon className="h-5 w-5 text-white" />
          </button>

          {/* Header with gradient */}
          <div className="bg-gradient-to-t from-brand-secondary to-brand-secondary/50 px-6 pt-10 pb-8 text-center">
            {/* Success icon with animation */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-in zoom-in duration-500 delay-150">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Congratulations text */}
            <h2
              id="completion-title"
              className="text-2xl font-bold text-white tracking-tight mb-2 animate-in slide-in-from-bottom duration-500 delay-200"
            >
              Gratulálunk! 🎉
            </h2>
            <p className="text-white/80 text-base animate-in slide-in-from-bottom duration-500 delay-300">
              {getCompletionTitle(courseType)}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Course title */}
            <div>
              <p className="text-center text-gray-500 text-sm">
                {getContentTypeLabel(courseType)}
              </p>
              <p className="text-center text-gray-900 font-bold mt-1 line-clamp-2">
                {courseTitle}
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGoToHome}
              className="w-full h-14 text-lg font-bold bg-brand-secondary hover:bg-brand-secondary-hover text-white rounded-xl shadow-lg shadow-brand-secondary/30 hover:shadow-brand-secondary/40 transition-all tracking-tight"
            >
              Vissza a kezdőlapra
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCompletionModal
