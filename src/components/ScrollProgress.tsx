'use client'

import { useEffect, useState } from 'react'

/**
 * ScrollProgress component
 * Shows a progress bar at the top of the page as the user scrolls
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrolled / height) * 100
      setProgress(progress)
    }

    window.addEventListener('scroll', updateProgress)
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-brand-secondary to-purple-600 z-50 transition-all duration-150"
      style={{ width: `${progress}%` }}
    />
  )
}
