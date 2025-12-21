'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Menu, X } from 'lucide-react'
import { CompanyDashboardSidebar } from '@/components/company/CompanyDashboardSidebar'
// REMOVED: Duplicate AuthProvider - already wrapped in root layout
// import { AuthProvider } from '@/contexts/AuthContext'
import { FreeTrialModal } from '@/components/subscription/FreeTrialModal'
import { useTrialPopup } from '@/hooks/useTrialPopup'
import Footer from '@/components/landing-home/ui/footer'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companyName, setCompanyName] = useState<string | undefined>()

  // Trial popup state (for company admins without subscription)
  const { shouldShowForAuthUser, hasUsedTrial, isLoading: subscriptionLoading, dismiss: dismissTrial } = useTrialPopup()
  const [showTrialModal, setShowTrialModal] = useState(false)

  // Company admin is determined by role === COMPANY_ADMIN or companyId + companyRole === 'owner' or 'admin'
  const isCompanyAdmin =
    user?.role === 'COMPANY_ADMIN' ||
    user?.role === 'company_admin' || // Support both cases
    (user?.companyId && (user?.companyRole === 'owner' || user?.companyRole === 'admin'))

  // Check if user is a company employee (has companyId and companyRole 'employee')
  const isCompanyEmployee = !!(user?.companyId && user?.companyRole === 'employee')

  useEffect(() => {
    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [CompanyLayout] No user found, redirecting to login')
        router.replace('/login?redirect_to=/company/dashboard')
      } else if (isCompanyEmployee) {
        // Employee safety net: redirect to student dashboard
        console.log('ℹ️ [CompanyLayout] Employee detected, redirecting to student dashboard')
        router.replace('/dashboard')
      } else if (!isCompanyAdmin) {
        // VALIDATION LOG 6: Auth check before redirect
        console.log('🔍 [VALIDATION] CompanyLayout AUTH CHECK:', {
          hasUser: !!user,
          role: user?.role,
          companyId: user?.companyId,
          companyRole: user?.companyRole,
          willRedirect: !isCompanyAdmin,
          timestamp: Date.now()
        });

        console.log('❌ [CompanyLayout] User is not company owner, redirecting. companyId:', user.companyId, 'companyRole:', user.companyRole)
        router.replace('/dashboard')
      }
    }
  }, [user, isLoading, authReady, router, isCompanyAdmin, isCompanyEmployee])

  // Fetch company name
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (user?.companyId) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', user.companyId))
          if (companyDoc.exists()) {
            setCompanyName(companyDoc.data()?.name)
          }
        } catch (error) {
          console.error('Error fetching company name:', error)
        }
      }
    }
    fetchCompanyName()
  }, [user?.companyId])

  // Show trial popup for company admins without subscription
  // Only shows once per session (dismissed state stored in sessionStorage)
  // Never show for employees - they should see CompanyEmployeeNoAccessModal instead
  useEffect(() => {
    if (subscriptionLoading) return

    if (isCompanyAdmin && !isCompanyEmployee && shouldShowForAuthUser) {
      setShowTrialModal(true)
    }
  }, [isCompanyAdmin, isCompanyEmployee, shouldShowForAuthUser, subscriptionLoading])

  // Handle trial modal actions
  const handleTrialStart = () => {
    router.push('/subscribe/start?plan=monthly')
  }

  const handleTrialDismiss = () => {
    dismissTrial()
    setShowTrialModal(false)
  }

  if (!authReady || isLoading || !user || !isCompanyAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-white0" />
          <p className="text-gray-600">
            {!authReady ? 'Hitelesítés inicializálása...' :
             isLoading ? 'Betöltés...' :
             !user ? 'Bejelentkezés szükséges...' :
             'Jogosultság ellenőrzése...'}
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

      {/* Sidebar - Fixed on all screens */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <CompanyDashboardSidebar
          companyName={companyName}
          onNavigate={() => setSidebarOpen(false)}
        />
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

      {/* Main Content - with left margin for fixed sidebar on desktop */}
      <main className="bg-gray-50 p-4 lg:p-6 lg:ml-64 min-w-0 overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <div className="lg:ml-64">
        <Footer border={true} />
      </div>

      {/* Free Trial Modal - Shows for company admins without subscription */}
      <FreeTrialModal
        open={showTrialModal}
        onOpenChange={setShowTrialModal}
        variant="dashboard"
        onStartTrial={handleTrialStart}
        onDismiss={handleTrialDismiss}
        hasUsedTrial={hasUsedTrial}
      />
    </div>
  )
}
