'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { motion } from 'motion/react'
import {
  Home,
  BookOpen,
  Users,
  Settings,
  ChevronRight,
  User,
  LogOut,
  FolderTree,
  UserCog,
  Building2,
  Activity,
  FileSearch,
  AlertTriangle,
  Shield
} from 'lucide-react'

/**
 * Admin Dashboard Sidebar
 *
 * Features:
 * - Admin-focused navigation hierarchy
 * - Blue accent color (#112a4b)
 * - Consistent with user/company dashboard design
 */

const navigationSections = [
  {
    title: null, // No section header for main navigation
    items: [
      { title: 'Vezérlőpult', href: '/admin/dashboard', icon: Home },
    ]
  },
  {
    title: 'Adminisztráció',
    items: [
      { title: 'Felhasználók', href: '/admin/users', icon: Users },
      { title: 'Tartalmak', href: '/admin/courses', icon: BookOpen },
      { title: 'Kategóriák', href: '/admin/categories', icon: FolderTree },
      { title: 'Célközönségek', href: '/admin/target-audiences', icon: Users },
      { title: 'Oktatók', href: '/admin/instructors', icon: UserCog },
      { title: 'Egyetemek', href: '/admin/universities', icon: Building2 },
    ]
  },
  {
    title: 'Rendszer',
    items: [
      { title: 'Rendszer állapot', href: '/admin/system-status', icon: Activity },
      { title: 'Audit napló', href: '/admin/audit-log', icon: FileSearch },
      { title: 'Támogatási jegyek', href: '/admin/reports', icon: AlertTriangle },
    ]
  },
  {
    title: 'Egyéb',
    items: [
      { title: 'Beállítások', href: '/admin/settings', icon: Settings },
    ]
  }
]

interface NavigationItemProps {
  item: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }
  isActive: boolean
  onNavigate?: () => void
}

interface AdminDashboardSidebarProps {
  onNavigate?: () => void
}

function NavigationItem({ item, isActive, onNavigate }: NavigationItemProps) {
  const Icon = item.icon

  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all group',
          isActive
            ? 'bg-[#112a4b]/5 text-[#112a4b] border-l-2 border-[#112a4b]'
            : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
        )}
      >
        <div className="flex items-center">
          <Icon className={cn(
            'w-4 h-4 mr-3',
            isActive ? 'text-[#112a4b]' : 'text-gray-500'
          )} />
          {item.title}
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
          isActive ? 'opacity-100 text-[#112a4b]' : 'text-gray-400'
        )} />
      </Link>
    </motion.div>
  )
}

export function AdminDashboardSidebar({ onNavigate }: AdminDashboardSidebarProps = {}) {
  const pathname = usePathname()
  const { user, isLoading: loading, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/admin/dashboard" className="flex items-center group">
          <motion.div
            className="relative w-28 h-8 flex-shrink-0"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src="/images/dma-logo.png"
              alt="DMA logo"
              fill
              className="object-contain object-left"
              sizes="112px"
              priority
            />
          </motion.div>
        </Link>
      </div>

      {/* Admin Badge */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-2 text-[#112a4b]" />
          <span className="font-medium text-[#112a4b]">Admin Panel</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavigationItem
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#112a4b] flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <User className="w-4 h-4 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Szia, {user?.firstName}!
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Kijelentkezés
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
