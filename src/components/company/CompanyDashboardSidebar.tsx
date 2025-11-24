'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'motion/react'
import {
  Home,
  BookOpen,
  Users,
  TrendingUp,
  Settings,
  ChevronRight,
  User,
  LogOut,
  Building2,
  GraduationCap
} from 'lucide-react'

/**
 * Company Dashboard Sidebar
 *
 * Navigation for company admins to manage employees and track progress
 */

const navigationSections = [
  {
    title: 'Cég kezelése',
    items: [
      { title: 'Vezérlőpult', href: '/company/dashboard', icon: Home },
      { title: 'Alkalmazottak', href: '/company/dashboard/employees', icon: Users },
      { title: 'Kurzusok', href: '/company/dashboard/courses', icon: BookOpen },
      { title: 'Haladás', href: '/company/dashboard/progress', icon: TrendingUp },
    ]
  },
  {
    title: 'Saját tanulás',
    items: [
      { title: 'Beiratkozásaim', href: '/company/dashboard/my-courses', icon: GraduationCap },
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

interface CompanyDashboardSidebarProps {
  companyName?: string
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
            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
            : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
        )}
      >
        <div className="flex items-center">
          <Icon className={cn(
            'w-4 h-4 mr-3',
            isActive ? 'text-blue-600' : 'text-gray-500'
          )} />
          {item.title}
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
          isActive ? 'opacity-100 text-blue-600' : 'text-gray-400'
        )} />
      </Link>
    </motion.div>
  )
}

export function CompanyDashboardSidebar({ companyName, onNavigate }: CompanyDashboardSidebarProps) {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
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
      {/* Header with Company branding */}
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/company/dashboard" className="flex items-center space-x-3 group">
          <motion.div
            className="relative w-10 h-10 flex-shrink-0"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src="/images/navbar-logo.png"
              alt="DMA logo"
              fill
              className="object-contain"
              sizes="40px"
              priority
            />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
              DMA
            </span>
            <span className="text-xs text-gray-500">Cég vezérlőpult</span>
          </div>
        </Link>
      </div>

      {/* Company Name */}
      {companyName && (
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium truncate">{companyName}</span>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
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
            className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <User className="w-4 h-4 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
            <Link
              href="/dashboard/settings"
              onClick={onNavigate}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Profil beállítások
            </Link>
          </motion.div>

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
