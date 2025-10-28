'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  GraduationCap,
  Award,
  User,
  Settings,
  Bell,
  Compass,
  TrendingUp,
  Calendar,
  Heart
} from 'lucide-react'

const studentNavItems = [
  {
    title: 'Főoldal',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Kurzusaim',
    href: '/dashboard/my-learning',
    icon: BookOpen
  },
  {
    title: 'Böngészés',
    href: '/dashboard/browse',
    icon: Compass
  },
  {
    title: 'Karrierutak',
    href: '/dashboard/career',
    icon: TrendingUp
  },
  {
    title: 'Diplomáim',
    href: '/dashboard/degrees',
    icon: GraduationCap
  },
  {
    title: 'Tanúsítványok',
    href: '/dashboard/certificates',
    icon: Award
  },
  {
    title: 'Kedvencek',
    href: '/dashboard/favorites',
    icon: Heart
  },
  {
    title: 'Naptár',
    href: '/dashboard/calendar',
    icon: Calendar
  },
  {
    title: 'Értesítések',
    href: '/dashboard/notifications',
    icon: Bell
  },
  {
    title: 'Profil',
    href: '/dashboard/profile',
    icon: User
  },
  {
    title: 'Beállítások',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export function StudentSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="flex flex-col gap-1 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Tanulói Panel</h2>
          <p className="text-sm text-gray-500">Fejlődj minden nap</p>
        </div>
        
        {studentNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-teal-50 text-teal-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                isActive ? "text-teal-600" : "text-gray-500"
              )} />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}