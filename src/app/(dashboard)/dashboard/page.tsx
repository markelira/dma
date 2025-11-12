'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, BookOpen, Play, CheckCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { ContinueCoursePreview } from '@/components/dashboard/ContinueCoursePreview'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { CourseTable } from '@/components/dashboard/CourseTable'
import { RecommendedCourses } from '@/components/dashboard/RecommendedCourses'
import { useDashboardStats } from '@/hooks/useDashboardStats'

/**
 * DMA Dashboard - Modern Analytics View
 *
 * Features:
 * - Stats overview cards with trends
 * - Learning time chart
 * - Quick action buttons
 * - Course progress table
 * - Recommended courses
 */

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { data: dashboardData, isLoading: statsLoading, error: statsError } = useDashboardStats()

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    }
  }, [user, router])

  // Don't render learning content for admin users
  if (user?.role === 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render learning content for company admin users (prevents hooks from executing)
  if (user?.role === 'COMPANY_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Összes kurzus"
          value={dashboardData?.stats.totalEnrolled ?? 0}
          trend={dashboardData?.trends.totalEnrolledTrend}
          isLoading={statsLoading}
        />
        <StatCard
          icon={Play}
          label="Aktív kurzusok"
          value={dashboardData?.stats.activeInProgress ?? 0}
          trend={dashboardData?.trends.activeInProgressTrend}
          isLoading={statsLoading}
        />
        <StatCard
          icon={CheckCircle}
          label="Befejezett"
          value={dashboardData?.stats.completed ?? 0}
          trend={dashboardData?.trends.completedTrend}
          isLoading={statsLoading}
        />
      </div>

      {/* Error state for stats */}
      {statsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">
            Hiba a statisztikák betöltésekor. Kérjük, próbálja újra később.
          </p>
        </div>
      )}

      {/* Row 2: Continue Course Preview + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Continue Course Preview (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <ContinueCoursePreview />
        </div>

        {/* Quick Actions (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Row 3: Course Table + Recommendations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Course Table (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <CourseTable />
        </div>

        {/* Recommendations (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <RecommendedCourses />
        </div>
      </div>
    </div>
  )
} 