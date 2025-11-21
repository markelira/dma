'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import { Play, Clock, BookOpen, ChevronRight } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Continue Course Preview Component
 *
 * Displays the user's most recently accessed in-progress course
 * with a preview and call-to-action to continue learning
 */
export function ContinueCoursePreview() {
  const { data: enrollments = [], isLoading } = useEnrollments('in_progress')
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null)
  const [fetchingLesson, setFetchingLesson] = useState(false)

  // Get the most recently accessed course
  const currentCourse = enrollments[0]

  // Fetch first lesson if currentLessonId is not available
  useEffect(() => {
    const fetchFirstLesson = async () => {
      if (!currentCourse || currentCourse.currentLessonId || fetchingLesson) return

      setFetchingLesson(true)
      try {
        const courseRef = doc(db, 'courses', currentCourse.courseId)
        const courseSnap = await getDoc(courseRef)

        if (!courseSnap.exists()) {
          setFetchingLesson(false)
          return
        }

        const courseData = courseSnap.data()

        // Check if course has modules in the document
        if (courseData.modules && courseData.modules.length > 0) {
          const firstModule = courseData.modules.sort((a: any, b: any) => a.order - b.order)[0]
          if (firstModule.lessons && firstModule.lessons.length > 0) {
            const firstLesson = firstModule.lessons.sort((a: any, b: any) => a.order - b.order)[0]
            setFirstLessonId(firstLesson.id)
            setFetchingLesson(false)
            return
          }
        }

        // Otherwise, fetch from modules subcollection
        const modulesSnapshot = await getDocs(
          query(collection(db, 'courses', currentCourse.courseId, 'modules'), orderBy('order', 'asc'))
        )

        if (!modulesSnapshot.empty) {
          const firstModuleDoc = modulesSnapshot.docs[0]
          const lessonsSnapshot = await getDocs(
            query(
              collection(db, 'courses', currentCourse.courseId, 'modules', firstModuleDoc.id, 'lessons'),
              orderBy('order', 'asc')
            )
          )

          if (!lessonsSnapshot.empty) {
            setFirstLessonId(lessonsSnapshot.docs[0].id)
          }
        } else {
          // Fallback: fetch from direct lessons subcollection
          const lessonsSnapshot = await getDocs(
            query(collection(db, 'courses', currentCourse.courseId, 'lessons'), orderBy('order', 'asc'))
          )

          if (!lessonsSnapshot.empty) {
            setFirstLessonId(lessonsSnapshot.docs[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching first lesson:', error)
      } finally {
        setFetchingLesson(false)
      }
    }

    fetchFirstLesson()
  }, [currentCourse, fetchingLesson])

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-52 bg-gray-100 rounded-xl animate-pulse mb-4" />
        <div className="h-24 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  // Determine the lesson URL
  const lessonId = currentCourse?.currentLessonId || firstLessonId
  const playerUrl = lessonId
    ? `/courses/${currentCourse?.courseId}/player/${lessonId}`
    : `/courses/${currentCourse?.courseId}`

  // If no in-progress courses, show empty state
  if (!currentCourse) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Tanulás folytatása
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Nincs folyamatban lévő kurzusod
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Kezdj el egy új kurzust vagy folytasd, ahol abbahagytad
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Kurzusok böngészése
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Tanulás folytatása
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Összes →
          </Link>
        </div>
      </div>

      {/* Course Preview */}
      <div className="p-6">
        <div className="flex flex-col gap-6">
          {/* Course Image/Thumbnail */}
          <Link href={playerUrl} className="block">
            <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-gray-100 shadow-sm cursor-pointer">
            {currentCourse.thumbnailUrl ? (
              <Image
                src={currentCourse.thumbnailUrl}
                alt={currentCourse.courseName}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to placeholder on error
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            ) : (
              /* Fallback content when thumbnail doesn't exist */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                <BookOpen className="h-16 w-16 text-white/80" />
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-black/20 to-transparent hover:from-black/50 hover:via-black/30 transition-all duration-300 group/play">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white shadow-xl group-hover/play:scale-110 transition-transform duration-300">
                <Play className="h-9 w-9 text-blue-600 fill-blue-600 ml-1" />
              </div>
            </div>
          </div>
          </Link>

          {/* Course Info */}
          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                  {currentCourse.courseName}
                </h3>
                <p className="text-sm font-medium text-gray-600">
                  {currentCourse.courseInstructor}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Haladás</span>
                  <span className="font-bold text-gray-900">
                    {currentCourse.progress}% befejezve
                  </span>
                </div>
                <Progress value={currentCourse.progress} className="h-3" />
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                {currentCourse.lastAccessedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Legutóbb: {currentCourse.lastAccessedAt.toLocaleDateString('hu-HU', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

          {/* CTA Button */}
          <Link
            href={playerUrl}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-sm font-bold text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 w-full shadow-md hover:shadow-lg"
          >
            <Play className="h-5 w-5" />
            Tanulás folytatása
          </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
