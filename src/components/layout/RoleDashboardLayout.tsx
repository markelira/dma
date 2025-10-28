'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/navigation/sidebar'
import { AppBreadcrumb } from '@/components/navigation/breadcrumb'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * Reusable dashboard wrapper that gates access to authenticated users and
 * renders a simple responsive grid skeleton common to all roles.
 *
 * Role-specific dashboards (Student/Instructor/Admin) can wrap their inner
 * content with this component so we maintain consistent spacing & layout.
 */
export function RoleDashboardLayout({ children, className }: Props) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // After auth load, ensure user is on the correct dashboard root
  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role
      if (role === 'INSTRUCTOR' && pathname.startsWith('/dashboard')) {
        router.replace('/instructor/dashboard')
      }
      if (role === 'ADMIN' && pathname.startsWith('/dashboard')) {
        router.replace('/admin/dashboard')
      }
      if (role === 'STUDENT' && pathname.startsWith('/instructor')) {
        router.replace('/dashboard')
      }
    }
  }, [isLoading, user, pathname, router])

  // Redirect when unauthenticated (edge-case: hydration versus client) – the
  // navbar guard will normally handle this but we keep a safety net here.
  if (!isLoading && !isAuthenticated) {
    if (typeof window !== 'undefined') router.push('/login')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting…</p>
      </div>
    )
  }

  // Global loading skeleton while auth state hydrates
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      <aside className="fixed top-12 z-30 -ml-1 hidden h-[calc(100vh-3rem)] w-full shrink-0 md:sticky md:block">
        <Sidebar />
      </aside>
      <main
        className={cn(
          'flex w-full flex-col overflow-hidden py-8',
          className
        )}
      >
        <AppBreadcrumb />
        {children}
      </main>
    </div>
  )
} 