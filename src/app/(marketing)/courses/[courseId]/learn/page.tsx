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
    if (!isLoading && course) {
      // Find the first available lesson
      // Try modules structure first
      let firstLesson = null

      if (course.modules?.length) {
        const firstModule = course.modules[0]
        firstLesson = firstModule?.lessons?.[0]
      }

      // Fallback to direct lessons array
      if (!firstLesson && course.lessons?.length) {
        firstLesson = course.lessons[0]
      }

      if (firstLesson) {
        // Redirect to the specific lesson page using the player route
        router.replace(`/courses/${courseId}/player/${firstLesson.id}`)
      } else {
        // No lessons found, redirect to course detail page
        router.replace(`/courses/${courseId}`)
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