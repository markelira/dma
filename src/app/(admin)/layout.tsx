'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Menu, X } from 'lucide-react'
import { AdminDashboardSidebar } from '@/components/admin/AdminDashboardSidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Footer from '@/components/landing-home/ui/footer'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [AdminLayout] No user found, redirecting to login')
        router.replace('/login?redirect_to=/admin')
      } else if (user.role !== 'admin' && user.role !== 'ADMIN') {
        console.log('❌ [AdminLayout] User is not admin, redirecting. User role:', user.role)
        router.replace('/dashboard')
      }
    }
  }, [user, isLoading, authReady, router])

  if (!authReady || isLoading || !user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-[#112a4b]" />
          <p className="text-gray-600">
            {!authReady ? 'Hitelesítés inicializálása...' :
             isLoading ? 'Betöltés...' :
             !user ? 'Bejelentkezés szükséges...' :
             'Admin jogosultság ellenőrzése...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          fixed top-0 left-0 z-50 h-screen w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <AdminDashboardSidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile Menu Button - Floating */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white border border-gray-200 p-2 hover:bg-gray-100 shadow-sm lg:hidden"
      >
        {sidebarOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Main Content Area - offset by sidebar width on desktop */}
      <main className="bg-gray-50 p-4 lg:p-6 lg:ml-64">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <div className="lg:ml-64">
        <Footer border={true} />
      </div>
    </div>
  )
}
