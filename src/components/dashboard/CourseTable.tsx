'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, User } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'

type TabType = 'in_progress' | 'completed'

/**
 * Course Table Component
 *
 * Displays user's courses in a tabbed table format
 * Fetches real enrollment data from Firestore
 */
export function CourseTable() {
  const [activeTab, setActiveTab] = useState<TabType>('in_progress')

  // Fetch enrollments for the active tab
  const { data: enrollments = [], isLoading } = useEnrollments(activeTab)

  const filteredCourses = enrollments

  // Fetch counts for all statuses
  const { data: inProgressEnrollments = [] } = useEnrollments('in_progress')
  const { data: completedEnrollments = [] } = useEnrollments('completed')

  const inProgressCount = inProgressEnrollments.length
  const completedCount = completedEnrollments.length

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] border border-gray-800">
        <div className="border-b border-gray-800 p-4">
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-3" />
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-gray-800">
      {/* Header with Tabs */}
      <div className="border-b border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Kurzusaim</h2>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${
                activeTab === 'in_progress'
                  ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            Folyamatban
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-800 text-xs">
              {inProgressCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${
                activeTab === 'completed'
                  ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            Befejezett
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-800 text-xs">
              {completedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="p-4">
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-500">
              {activeTab === 'in_progress'
                ? 'Nincs folyamatban lévő kurzusod'
                : 'Még nem fejeztél be egyetlen kurzust sem'}
            </p>
            <Link
              href="/courses"
              className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Böngészd a kurzusokat →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCourses.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.courseId}`}
                className="block rounded-lg border border-gray-800 p-4 transition-all hover:border-gray-700 hover:bg-gray-800/50"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate mb-1">
                      {enrollment.courseName}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{enrollment.courseInstructor}</span>
                      </div>
                      {enrollment.lastAccessedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {enrollment.lastAccessedAt.toLocaleDateString('hu-HU', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {activeTab === 'in_progress' && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {enrollment.progress}% kész
                        </p>
                      </div>
                    )}

                    {activeTab === 'completed' && (
                      <Badge variant="default" className="bg-green-900/50 text-green-400 border-green-800">
                        Befejezve
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
