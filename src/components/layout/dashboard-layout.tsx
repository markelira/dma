'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * DMA Dashboard Layout - Foundation Layer 2
 * 
 * Enhanced Coursera-style layout with:
 * - Full-height left sidebar navigation
 * - Main content area for dashboard pages
 * - Responsive design and loading states
 * - Mandatory authentication integration
 */

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  // Authentication redirect logic (enhanced by middleware)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  // Loading state for authentication
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
          <p className="text-sm text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar Navigation - Coursera Style */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <DashboardSidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Content Container */}
        <div className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
} 