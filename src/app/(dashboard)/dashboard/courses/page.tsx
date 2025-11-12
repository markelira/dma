'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Filter, Grid, List, Search } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useEnrollments } from '@/hooks/useEnrollments'
import { Clock, User } from 'lucide-react'

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'in_progress' | 'completed' | 'not_started'

/**
 * Dashboard Courses Page
 *
 * Displays all enrolled courses with filtering and view options
 */
export default function DashboardCoursesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterType>('all')

  // Fetch all enrollments
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kurzusaim</h1>
        <p className="text-gray-600">
          Kezeld és folytasd a kurzusaidat egy helyen
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
        <div className="flex gap-1 border border-gray-300 rounded-lg p-1 bg-white">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-2 rounded transition-colors
              ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}
            `}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`
              p-2 rounded transition-colors
              ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}
            `}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEnrollments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <BookOpen className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {filter === 'all' ? 'Még nincs kurzusod' : 'Nincs találat'}
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            {filter === 'all'
              ? 'Kezdj el egy új kurzust a böngészés gombra kattintva'
              : 'Próbálj meg egy másik szűrőt'}
          </p>
          {filter === 'all' && (
            <Link
              href="/courses"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Kurzusok böngészése
            </Link>
          )}
        </div>
      )}

      {/* Courses Grid/List */}
      {!isLoading && filteredEnrollments.length > 0 && (
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
                block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-md hover:border-blue-200
                ${viewMode === 'list' ? 'flex items-center gap-6' : ''}
              `}
            >
              {/* Course Info */}
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <h3 className="font-semibold text-gray-900 mb-1">
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
                    <Progress value={enrollment.progress} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {enrollment.progress}% befejezve
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                {enrollment.status === 'completed' && (
                  <Badge className="bg-green-100 text-green-700">
                    Befejezve
                  </Badge>
                )}

                {enrollment.status === 'not_started' && (
                  <Badge variant="outline">Még nem kezdett</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
