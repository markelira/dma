'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Grid, List, Clock, User, Loader2 } from 'lucide-react'
import { useEnrollments } from '@/hooks/useEnrollments'

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'in_progress' | 'completed' | 'not_started'

/**
 * Company Owner - My Enrolled Courses Page
 *
 * Shows the company owner's personal enrolled courses
 * Same logic as user dashboard courses page
 */
export default function CompanyMyCourses() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterType>('all')

  // Fetch all enrollments for the current user (company owner)
  const { data: allEnrollments = [], isLoading } = useEnrollments()

  // Filter enrollments
  const filteredEnrollments = allEnrollments.filter((enrollment) => {
    if (filter === 'all') return true
    return enrollment.status === filter
  })

  // Count by status
  const counts = {
    all: allEnrollments.length,
    in_progress: allEnrollments.filter((e) => e.status === 'in_progress').length,
    completed: allEnrollments.filter((e) => e.status === 'completed').length,
    not_started: allEnrollments.filter((e) => e.status === 'not_started').length,
  }

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Összes' },
    { value: 'in_progress', label: 'Folyamatban' },
    { value: 'completed', label: 'Befejezett' },
    { value: 'not_started', label: 'Nem kezdett' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-white0" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beiratkozásaim</h1>
        <p className="text-gray-500">
          A saját tartalmaid és tanulási előrehaladásod
        </p>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  filter === f.value
                    ? 'bg-brand-secondary text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {f.label}
              <span className="ml-2 text-xs opacity-75">
                ({counts[f.value]})
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-2 rounded transition-colors text-gray-500
              ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`
              p-2 rounded transition-colors text-gray-500
              ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredEnrollments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-secondary/5">
              <BookOpen className="h-10 w-10 text-brand-secondary" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              {filter === 'all' ? 'Még nincs tartalmad' : 'Nincs találat'}
            </h3>
            <p className="mb-6 text-sm text-gray-500 max-w-md">
              {filter === 'all'
                ? 'Kezdj el egy új tartalmat a tartalmak böngészése gombra kattintva'
                : 'Próbálj meg egy másik szűrőt'}
            </p>
            {filter === 'all' && (
              <Link
                href="/company/dashboard/courses"
                className="rounded-lg bg-brand-secondary px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-secondary-hover transition-colors"
              >
                Tartalmak böngészése
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Courses Grid/List */}
      {filteredEnrollments.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          }
        >
          {filteredEnrollments.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/courses/${enrollment.courseId}/learn`}
              className={`
                block rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-md shadow-sm
                ${viewMode === 'list' ? 'flex items-center gap-6' : ''}
              `}
            >
              {/* Course Info */}
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <h3 className="font-bold text-gray-900 mb-1">
                  {enrollment.courseName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
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
                {enrollment.status === 'in_progress' && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-secondary/50 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {enrollment.progress}% befejezve
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                {enrollment.status === 'completed' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Befejezve
                  </span>
                )}

                {enrollment.status === 'not_started' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-500">
                    Még nem kezdett
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
