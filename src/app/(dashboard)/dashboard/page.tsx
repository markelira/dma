'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { MyCoursesSection } from '@/components/dashboard/MyCoursesSection'
import { ContinueLearningSection } from '@/components/dashboard/ContinueLearningSection'
import { Loader2, BookOpen } from 'lucide-react'

/**
 * DMA Dashboard - My Courses
 *
 * Simplified dashboard focused on user's accessible courses
 * - With active subscription: Access to all courses
 * - Shows progress and continue learning section
 */

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Kurzusaim
            </h1>
          </div>
          <p className="text-gray-600">
            Üdvözöljük, {user?.firstName || 'Felhasználó'}! Folytassa a tanulást, ahol abbahagyta.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <div className="space-y-8">
          {/* Continue Learning Section */}
          <ContinueLearningSection data={null} isLoading={false} />

          {/* My Courses Overview */}
          <MyCoursesSection data={null} isLoading={false} />
        </div>
      </div>
    </div>
  )
} 