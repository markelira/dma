'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Menu, X } from 'lucide-react'
import { CompanyDashboardSidebar } from '@/components/company/CompanyDashboardSidebar'
import { AuthProvider } from '@/contexts/AuthContext'
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

  // Company admin is determined by role === COMPANY_ADMIN or companyId + companyRole === 'owner' or 'admin'
  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN' ||
    (user?.companyId && (user?.companyRole === 'owner' || user?.companyRole === 'admin'))

  useEffect(() => {
    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [CompanyLayout] No user found, redirecting to login')
        router.replace('/login?redirect_to=/company/dashboard')
      } else if (!isCompanyAdmin) {
        console.log('❌ [CompanyLayout] User is not company owner, redirecting. companyId:', user.companyId, 'companyRole:', user.companyRole)
        router.replace('/dashboard')
      }
    }
  }, [user, isLoading, authReady, router, isCompanyAdmin])

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

  return (
    <AuthProvider>
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
        <main className="min-h-screen bg-gray-50 p-4 lg:p-6 lg:ml-64 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
