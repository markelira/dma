"use client"

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCourse } from '@/hooks/useCourseQueries'

export default function PlayerEntryPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const { data: course, isLoading } = useCourse(courseId)

  useEffect(() => {
    if (!isLoading && course && course.modules?.length) {
      // Find the first available lesson and redirect to player mode
      const firstModule = course.modules[0]
      const firstLesson = firstModule?.lessons?.[0]
      
      if (firstLesson) {
        // Redirect to the player mode for the first lesson
        router.replace(`/courses/${courseId}/player/${firstLesson.id}`)
      } else {
        // No lessons available, redirect back to course page
        router.replace(`/courses/${courseId}`)
      }
    }
  }, [course, isLoading, courseId, router])

  // Show loading state while redirecting
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Lejátszó betöltése...</p>
      </div>
    </div>
  )
}