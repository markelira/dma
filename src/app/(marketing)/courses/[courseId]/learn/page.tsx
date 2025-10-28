// src/app/courses/[courseId]/learn/page.tsx
"use client"

import React, { useEffect } from 'react'
import { useCourse } from '@/hooks/useCourseQueries'
import { useParams, useRouter } from 'next/navigation'

export default function CourseLearnPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const { data: course, isLoading } = useCourse(courseId)

  useEffect(() => {
    if (!isLoading && course && course.modules?.length) {
      // Find the first available lesson and redirect to it
      const firstModule = course.modules[0]
      const firstLesson = firstModule?.lessons?.[0]
      
      if (firstLesson) {
        // Redirect to the specific lesson page using the player route
        router.replace(`/courses/${courseId}/player/${firstLesson.id}`)
      }
    }
  }, [course, isLoading, courseId, router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-primary">Kurzus betöltése...</p>
    </div>
  )
} 