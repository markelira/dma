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

  useEffect(() => {
    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [CompanyLayout] No user found, redirecting to login')
        router.replace('/login?redirect_to=/company/dashboard')
      } else if (user.role !== 'COMPANY_ADMIN') {
        console.log('❌ [CompanyLayout] User is not COMPANY_ADMIN, redirecting. User role:', user.role)
        router.replace('/dashboard')
      }
    }
  }, [user, isLoading, authReady, router])

  if (!authReady || isLoading || !user || user.role !== 'COMPANY_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-teal-600" />
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

  return <>{children}</>
}
