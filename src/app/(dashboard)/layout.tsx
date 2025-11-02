'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar'

export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [DashboardLayout] No user found, redirecting to login')
        // Only redirect if we're not already on the login page to prevent loops
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          router.replace('/login?redirect_to=/dashboard')
        }
      } else if (user.role === 'COMPANY_ADMIN') {
        console.log('🏢 [DashboardLayout] COMPANY_ADMIN user, redirecting to company dashboard')
        router.replace('/company/dashboard')
      }
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
    <div className="min-h-screen bg-white">
      <DashboardNavbar />
      <main className="bg-gray-50">
        {children}
      </main>
    </div>
  )
}