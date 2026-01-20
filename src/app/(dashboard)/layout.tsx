'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Footer from '@/components/landing-home/ui/footer'

export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | undefined>()

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

    // Check for pending email verification - user shouldn't be in dashboard
    if (typeof window !== 'undefined') {
      const pendingVerification = sessionStorage.getItem('pendingEmailVerification')
      if (pendingVerification) {
        console.log('⚠️ [DIAGNOSTIC] DashboardLayout: Found pending email verification, redirecting to register')
        router.replace('/register')
        return
      }
    }

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
      } else if (user.role?.toUpperCase() === 'COMPANY_ADMIN') {
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

  // Fetch company logo for COMPANY_EMPLOYEE users
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (user?.role === 'COMPANY_EMPLOYEE' && user.companyId) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', user.companyId))
          if (companyDoc.exists()) {
            setCompanyLogoUrl(companyDoc.data()?.logoUrl)
          }
        } catch (error) {
          console.error('Error fetching company logo:', error)
        }
      }
    }
    fetchCompanyLogo()
  }, [user?.role, user?.companyId])

  if (!authReady || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-white0" />
          <p className="text-gray-600">
            {!authReady ? 'Hitelesítés inicializálása...' :
             isLoading ? 'Betöltés...' :
             'Bejelentkezés szükséges...'}
          </p>
        </div>
      </div>
    )
  }

  // FIXED: Removed duplicate AuthProvider wrapper - root layout already provides auth
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
        <DashboardSidebar onNavigate={() => setSidebarOpen(false)} companyLogoUrl={companyLogoUrl} />
      </aside>

      {/* Mobile Menu Button - Floating, moves right when sidebar open */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-[60] rounded-lg bg-white border border-gray-200 p-2 hover:bg-gray-100 shadow-sm lg:hidden transition-all duration-300
          ${sidebarOpen ? 'top-4 left-[220px]' : 'top-4 left-4'}
        `}
      >
        {sidebarOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Main Content Area - offset by sidebar width on desktop */}
      <main className="bg-gray-50 p-4 lg:p-6 lg:ml-64 min-h-screen overflow-y-auto">
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