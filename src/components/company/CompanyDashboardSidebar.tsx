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
  TrendingUp,
  Settings,
  ChevronRight,
  User,
  LogOut,
  Building2,
  GraduationCap,
  Star,
  Video,
  Mic,
  CreditCard,
  X,
  MessageSquare
} from 'lucide-react'

/**
 * Company Dashboard Sidebar
 *
 * Navigation for company admins to manage employees and track progress
 */

const navigationSections = [
  {
    title: null, // No section header for main navigation
    items: [
      { title: 'Kezdőlap', href: '/company/dashboard', icon: Home },
      { title: 'Saját listám', href: '/company/dashboard/my-courses', icon: BookOpen },
    ]
  },
  {
    title: 'Kategóriák',
    items: [
      { title: 'Webinár', href: '/company/dashboard/webinar', icon: Video },
      { title: 'Akadémia', href: '/company/dashboard/academia', icon: GraduationCap },
      { title: 'Masterclass', href: '/company/dashboard/masterclass', icon: Star },
      { title: 'Podcast', href: '/company/dashboard/podcast', icon: Mic },
    ]
  },
  {
    title: 'EGYÉB',
    items: [
      { title: 'Munkatársaim', href: '/company/dashboard/employees', icon: Users },
      { title: 'Számláim', href: '/company/dashboard/billing', icon: CreditCard },
      { title: 'Segítségkérés', href: '/company/dashboard/help-center', icon: MessageSquare },
      { title: 'Beállítások', href: '/company/dashboard/settings', icon: Settings },
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
  companyLogoUrl?: string
  onNavigate?: () => void
  onClose?: () => void
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
            ? 'bg-brand-secondary/5 text-brand-secondary border-l-2 border-brand-secondary'
            : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
        )}
      >
        <div className="flex items-center">
          <Icon className={cn(
            'w-4 h-4 mr-3',
            isActive ? 'text-brand-secondary' : 'text-gray-500'
          )} />
          {item.title}
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
          isActive ? 'opacity-100 text-brand-secondary' : 'text-gray-400'
        )} />
      </Link>
    </motion.div>
  )
}

export function CompanyDashboardSidebar({ companyName, companyLogoUrl, onNavigate, onClose }: CompanyDashboardSidebarProps) {
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
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <Link href="/company/dashboard" className="flex items-center group">
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

        {/* Close button - only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
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
          {companyLogoUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-brand-secondary flex-shrink-0">
              <Image
                src={companyLogoUrl}
                alt={companyName || 'Cég logó'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-secondary flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </motion.div>
          )}
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
