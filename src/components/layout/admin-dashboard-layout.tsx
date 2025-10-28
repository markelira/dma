'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/navigation/sidebar'
import { AppBreadcrumb } from '@/components/navigation/breadcrumb'
// Remove invalid import - use string literals for role checking
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function AdminDashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, authReady } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Enhanced logging for debugging admin access
    console.log('🔍 [AdminLayout] Auth state:', {
      user: user ? { email: user.email, role: user.role, id: user.id } : null,
      isLoading,
      authReady
    })

    if (authReady && !isLoading) {
      if (!user) {
        console.log('❌ [AdminLayout] No user found, redirecting to login')
        router.replace('/login?redirect_to=/admin/dashboard')
      } else if (user.role !== 'admin') {
        console.log('❌ [AdminLayout] User role is not admin:', user.role, 'redirecting to dashboard')
        router.replace('/dashboard')
      } else {
        console.log('✅ [AdminLayout] Admin access granted for:', user.email)
      }
    }
  }, [user, isLoading, authReady, router])

  if (!authReady || isLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {!authReady ? 'Hitelesítés inicializálása...' : 
             isLoading ? 'Betöltés...' : 
             !user ? 'Bejelentkezés szükséges...' : 
             'Hozzáférés ellenőrzése...'}
          </p>
          {user && user.role !== 'admin' && (
            <p className="text-red-600 text-sm mt-2">
              Admin jogosultság szükséges. Jelenlegi szerep: {user.role}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <aside className="fixed top-12 z-30 -ml-1 hidden h-[calc(100vh-3rem)] w-full shrink-0 md:sticky md:block">
          <Sidebar />
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-8">
          <AppBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  )
} 