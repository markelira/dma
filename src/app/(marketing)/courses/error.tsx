'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-2">
        We couldn't load the course information. This might be a temporary issue.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Error: {error.message || 'An unexpected error occurred.'}
      </p>
      <Button onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
} 