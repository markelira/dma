'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()

  // Company admin is determined by companyId + companyRole === 'owner'
  const isCompanyAdmin = user?.companyId && user?.companyRole === 'owner'

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

  if (!authReady || isLoading || !user || !isCompanyAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-blue-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Background blur shapes */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" aria-hidden="true"></div>
      <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-purple-100/20 rounded-full blur-2xl" aria-hidden="true"></div>

      {children}
    </div>
  )
}
