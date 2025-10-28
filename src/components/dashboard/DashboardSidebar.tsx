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
  GraduationCap,
  TrendingUp,
  Settings,
  ChevronRight,
  User,
  Users,
  LogOut,
  Building2,
  FolderOpen
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

// Navigation items based on user role and learning focus
const navigationSections = {
  STUDENT: [
    {
      title: 'Tanulás',
      items: [
        { title: 'Kezdőlap', href: '/dashboard', icon: Home },
        { title: 'Masterclass', href: '/dashboard/learning', icon: BookOpen },
        { title: '1:1 Meetingek', href: '/dashboard/meetings', icon: Users },
      ]
    }
  ],
  INSTRUCTOR: [
    {
      title: 'Oktatás',
      items: [
        { title: 'Oktató Dashboard', href: '/instructor/dashboard', icon: Home },
        { title: 'Kurzusaim', href: '/instructor/courses', icon: BookOpen },
        { title: 'Tanulóim', href: '/instructor/students', icon: User },
        { title: 'Tartalom', href: '/instructor/content', icon: FolderOpen },
        { title: 'Elemzések', href: '/instructor/analytics', icon: TrendingUp },
      ]
    },
    {
      title: 'Diák Nézet',
      items: [
        { title: 'Diák Dashboard', href: '/dashboard', icon: GraduationCap },
        { title: 'Masterclass', href: '/dashboard/learning', icon: BookOpen },
        { title: '1:1 Meetingek', href: '/dashboard/meetings', icon: Users },
      ]
    }
  ],
  ADMIN: [
    {
      title: 'Adminisztráció',
      items: [
        { title: 'Admin Dashboard', href: '/admin/dashboard', icon: Home },
        { title: 'Felhasználók', href: '/admin/users', icon: User },
        { title: 'Kurzusok', href: '/admin/courses', icon: BookOpen },
        { title: 'Elemzések', href: '/admin/analytics', icon: TrendingUp },
        { title: 'Beállítások', href: '/admin/settings', icon: Settings },
      ]
    },
    {
      title: 'Oktató Nézet',
      items: [
        { title: 'Oktató Dashboard', href: '/instructor/dashboard', icon: Building2 },
      ]
    },
    {
      title: 'Diák Nézet',
      items: [
        { title: 'Diák Dashboard', href: '/dashboard', icon: GraduationCap },
        { title: 'Masterclass', href: '/dashboard/learning', icon: BookOpen },
        { title: '1:1 Meetingek', href: '/dashboard/meetings', icon: Users },
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
            ? 'bg-[#466C95]/10 text-[#466C95] shadow-sm'
            : 'text-gray-700 hover:bg-gray-50'
        )}
      >
        <div className="flex items-center">
          <Icon className={cn(
            'w-4 h-4 mr-3',
            isActive ? 'text-[#466C95]' : 'text-gray-500'
          )} />
          {item.title}
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
          isActive ? 'opacity-100 text-[#466C95]' : 'text-gray-400'
        )} />
      </Link>
    </motion.div>
  )
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps = {}) {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col">
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
  const sections = navigationSections[userRole] || navigationSections.STUDENT

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with DMA branding */}
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
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
          <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#466C95] transition-colors">
            DMA
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {sections.map((section, sectionIndex) => (
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
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: brandGradient }}
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
              href="/dashboard/profile"
              onClick={onNavigate}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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