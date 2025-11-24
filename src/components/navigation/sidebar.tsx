'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  History, 
  UserCircle, 
  Settings,
  ShieldCheck,
  Users,
  FolderKanban,
  Tags,
  BarChart3,
  UserCheck,
  FileText,
  Activity,
  Database,
  Bell,
  CreditCard,
  GraduationCap,
  Calendar,
  PieChart,
  LogOut,
} from 'lucide-react'

import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

// Logout handler
async function handleLogout() {
  try {
    await signOut(auth)
  } catch (_) {}
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-storage')
    window.location.href = '/login'
  }
}

const sidebarNavItems = {
  STUDENT: [
    { title: 'Vezérlőpult', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Beiratkozásaim', href: '/dashboard/my-courses', icon: BookOpen },
    { title: 'Bizonyítványaim', href: '/dashboard/certificates', icon: Award },
    { title: 'Vásárlásaim', href: '/dashboard/orders', icon: History },
    { title: 'Profilom', href: '/dashboard/profile', icon: UserCircle },
  ],
  ADMIN: [
    { title: 'Admin Vezérlőpult', href: '/admin/dashboard', icon: ShieldCheck },
    { title: 'Analitika', href: '/admin/analytics', icon: BarChart3 },
    { title: 'Felhasználók Kezelése', href: '/admin/users', icon: Users },
    { title: 'Szerepkörök Kezelése', href: '/admin/roles', icon: UserCheck },
    { title: 'Tartalmak Kezelése', href: '/admin/courses', icon: FolderKanban },
    { title: 'Új tartalom', href: '/admin/courses/create', icon: BookOpen },
    { title: 'Kategóriák Kezelése', href: '/admin/categories', icon: Tags },
    { title: 'Beiratkozások', href: '/admin/enrollments', icon: GraduationCap },
    { title: 'Fizetések', href: '/admin/payments', icon: CreditCard },
    { title: 'Értesítések', href: '/admin/notifications', icon: Bell },
    { title: 'Audit Napló', href: '/admin/audit-log', icon: FileText },
    { title: 'Rendszer Állapot', href: '/admin/system-status', icon: Activity },
    { title: 'Adatbázis Kezelés', href: '/admin/database', icon: Database },
    { title: 'Rendszer Beállítások', href: '/admin/settings', icon: Settings },
    { title: 'Egyetemek Kezelése', href: '/admin/universities', icon: GraduationCap },
  ],
  INSTRUCTOR: [
    { title: 'Oktatói Vezérlőpult', href: '/instructor/dashboard', icon: LayoutDashboard },
    { title: 'Tartalmaim', href: '/instructor/courses', icon: BookOpen },
    { title: 'Hallgatóim', href: '/instructor/students', icon: Users },
    { title: 'Analitika', href: '/instructor/analytics', icon: BarChart3 },
    { title: 'Beiratkozások', href: '/instructor/enrollments', icon: GraduationCap },
    { title: 'Beállítások', href: '/instructor/settings', icon: Settings },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, authReady } = useAuthStore()

  if (!authReady) {
    return (
      <div className="h-full py-4 px-3 space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-full bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  const userRole = user?.role ?? 'STUDENT'

  const navItems =
    userRole === 'ADMIN'
      ? sidebarNavItems.ADMIN
      : userRole === 'INSTRUCTOR'
      ? sidebarNavItems.INSTRUCTOR
      : sidebarNavItems.STUDENT

  const getRoleTitle = () => {
    switch (userRole) {
      case 'ADMIN':
        return 'Adminisztráció'
      case 'INSTRUCTOR':
        return 'Oktatói Panel'
      default:
        return 'Fiókom'
    }
  }

  return (
    <div className="h-full space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          {getRoleTitle()}
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => {
            const ItemIcon = item.icon
            const itemTitle = item.title
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-start rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <ItemIcon className="mr-2 h-4 w-4" />
                {itemTitle}
              </Link>
            )
          })}
        </div>
      </div>
      {/* Logout button */}
      {user && (
        <div className="px-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-start rounded-lg px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Kijelentkezés
          </button>
        </div>
      )}
    </div>
  )
} 