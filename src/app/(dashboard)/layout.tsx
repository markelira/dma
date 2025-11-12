'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { AuthProvider } from '@/contexts/AuthContext'

export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    console.log('🔍 [DIAGNOSTIC] DashboardLayout auth check', {
      authReady,
      isLoading,
      hasUser: !!user,
      userId: user?.id,
      userRole: user?.role,
      willCheckAuth: authReady && !isLoading,
      timestamp: Date.now()
    })

    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [DIAGNOSTIC] DashboardLayout: authReady && !isLoading && !user - REDIRECTING TO LOGIN', {
          pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          willRedirect: typeof window !== 'undefined' && !window.location.pathname.startsWith('/login'),
          timestamp: Date.now()
        })
        // Only redirect if we're not already on the login page to prevent loops
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          router.replace('/login?redirect_to=/dashboard')
        }
      } else if (user.role === 'COMPANY_ADMIN') {
        console.log('🏢 [DIAGNOSTIC] DashboardLayout: COMPANY_ADMIN user, redirecting to company dashboard')
        router.replace('/company/dashboard')
      } else {
        console.log('✅ [DIAGNOSTIC] DashboardLayout: User present, rendering dashboard', {
          userId: user.id,
          userRole: user.role,
          timestamp: Date.now()
        })
      }
    } else {
      console.log('⏳ [DIAGNOSTIC] DashboardLayout: Waiting for auth', {
        authReady,
        isLoading,
        hasUser: !!user,
        timestamp: Date.now()
      })
    }
  }, [user, isLoading, authReady, router])

  if (!authReady || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">
            {!authReady ? 'Hitelesítés inicializálása...' :
             isLoading ? 'Betöltés...' :
             'Bejelentkezés szükséges...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside
          className={`
            fixed top-0 left-0 z-50 h-screen w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0 lg:shadow-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Top Bar with Mobile Menu Button */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>

            {/* Top Bar Content */}
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900">
                  Szia, {user?.firstName || 'Felhasználó'}!
                </h2>
                <p className="text-sm text-gray-500">
                  Folytasd a tanulást, ahol abbahagytad
                </p>
              </div>

              {/* Search and notifications can be added here */}
              <div className="flex items-center gap-3">
                {/* Placeholder for future search/notifications */}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}