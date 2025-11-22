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
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-52 bg-gray-800 rounded-xl animate-pulse mb-4" />
        <div className="h-24 bg-gray-800 rounded animate-pulse" />
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
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <h2 className="mb-4 text-lg font-bold text-white">
          Tanulás folytatása
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20">
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
          <p className="mb-2 text-sm font-semibold text-white">
            Nincs folyamatban lévő kurzusod
          </p>
          <p className="mb-6 text-sm text-gray-400">
            Kezdj el egy új kurzust vagy folytasd, ahol abbahagytad
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Kurzusok böngészése
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Tanulás folytatása
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
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
            <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-gray-800 cursor-pointer">
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
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700">
                <BookOpen className="h-16 w-16 text-white/80" />
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-transparent hover:from-black/70 hover:via-black/40 transition-all duration-300 group/play">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-blue-600/90 backdrop-blur-sm shadow-xl group-hover/play:scale-110 transition-transform duration-300">
                <Play className="h-9 w-9 text-white fill-white ml-1" />
              </div>
            </div>

            {/* Netflix-style progress bar */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="w-full bg-gray-800/80 h-1">
                <div
                  className="bg-blue-500 h-1 transition-all duration-300"
                  style={{ width: `${currentCourse.progress}%` }}
                />
              </div>
            </div>
          </div>
          </Link>

          {/* Course Info */}
          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                  {currentCourse.courseName}
                </h3>
                <p className="text-sm font-medium text-gray-400">
                  {currentCourse.courseInstructor}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-400">Haladás</span>
                  <span className="font-bold text-white">
                    {currentCourse.progress}% befejezve
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentCourse.progress}%` }}
                  />
                </div>
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
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-all duration-300 w-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
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
