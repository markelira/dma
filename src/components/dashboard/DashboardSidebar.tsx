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
  GraduationCap,
  TrendingUp,
  Settings,
  ChevronRight,
  User,
  Users,
  LogOut,
  Building2,
  CreditCard,
  FolderOpen,
  Star,
  Video,
  Mic
} from 'lucide-react'
import { brandGradient } from '@/lib/design-tokens'

/**
 * DMA Course Platform Dashboard Sidebar
 * 
 * Features:
 * - Learning-focused navigation hierarchy
 * - User context and role-based menus
 * - Clean, professional design
 */

// Base navigation items - Team section is added dynamically based on user's team ownership
const navigationSections = {
  STUDENT: [
    {
      title: null, // No section header for main navigation
      items: [
        { title: 'Kezdőlap', href: '/dashboard', icon: Home },
        { title: 'Saját listám', href: '/dashboard/courses', icon: BookOpen },
      ]
    },
    {
      title: 'Kategóriák',
      items: [
        { title: 'Webinár', href: '/dashboard/webinar', icon: Video },
        { title: 'Akadémia', href: '/dashboard/academia', icon: GraduationCap },
        { title: 'Masterclass', href: '/dashboard/masterclass', icon: Star },
        { title: 'Podcast', href: '/dashboard/podcast', icon: Mic },
      ]
    },
    {
      title: 'Egyéb',
      items: [
        { title: 'Beállítások', href: '/dashboard/settings', icon: Settings },
      ]
    }
  ],
  INSTRUCTOR: [
    {
      title: 'Oktatás',
      items: [
        { title: 'Oktató Dashboard', href: '/instructor/dashboard', icon: Home },
        { title: 'Tartalmaim', href: '/instructor/courses', icon: BookOpen },
        { title: 'Tanulóim', href: '/instructor/students', icon: User },
        { title: 'Tartalom', href: '/instructor/content', icon: FolderOpen },
        { title: 'Elemzések', href: '/instructor/analytics', icon: TrendingUp },
      ]
    },
    {
      title: 'Eszközök',
      items: [
        { title: 'Beállítások', href: '/instructor/settings', icon: Settings },
      ]
    },
    {
      title: 'Diák Nézet',
      items: [
        { title: 'Diák Dashboard', href: '/dashboard', icon: GraduationCap },
      ]
    }
  ],
  ADMIN: [
    {
      title: 'Adminisztráció',
      items: [
        { title: 'Admin Dashboard', href: '/admin/dashboard', icon: Home },
        { title: 'Felhasználók', href: '/admin/users', icon: User },
        { title: 'Tartalmak', href: '/admin/courses', icon: BookOpen },
        { title: 'Elemzések', href: '/admin/analytics', icon: TrendingUp },
        { title: 'Beállítások', href: '/admin/settings', icon: Settings },
      ]
    },
    {
      title: 'Egyéb Nézetek',
      items: [
        { title: 'Oktató Dashboard', href: '/instructor/dashboard', icon: Building2 },
        { title: 'Diák Dashboard', href: '/dashboard', icon: GraduationCap },
      ]
    }
  ]
}


interface NavigationItemProps {
  item: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }
  isActive: boolean
  onNavigate?: () => void
}

interface DashboardSidebarProps {
  onNavigate?: () => void
  companyLogoUrl?: string
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

export function DashboardSidebar({ onNavigate, companyLogoUrl }: DashboardSidebarProps = {}) {
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

  const userRole = user?.role ?? 'STUDENT'
  const baseSections = navigationSections[userRole] || navigationSections.STUDENT

  // Use base sections (Team feature removed - using Company model instead)
  const sections = baseSections

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center group">
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

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {sections.map((section, sectionIndex) => (
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
      <div className="border-t border-gray-200 p-4 pb-8">
        <div className="flex items-center space-x-3 mb-4">
          {user?.role === 'COMPANY_EMPLOYEE' && companyLogoUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-brand-secondary flex-shrink-0">
              <Image
                src={companyLogoUrl}
                alt="Cég logó"
                fill
                className="object-cover"
              />
            </div>
          ) : user?.profilePictureUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-brand-secondary flex-shrink-0">
              <Image
                src={user.profilePictureUrl}
                alt={`${user.firstName} ${user.lastName}`}
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
              {user?.role === 'COMPANY_EMPLOYEE' ? (
                <Building2 className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
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
              className="flex items-center w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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