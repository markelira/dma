'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  BarChart3,
  Users,
  Calendar,
  Settings,
  Home,
  Video,
  MessageSquare,
  Award,
  FileText
} from 'lucide-react'

const instructorNavItems = [
  {
    title: 'Dashboard',
    href: '/instructor/dashboard',
    icon: Home
  },
  {
    title: 'Tartalmaim',
    href: '/instructor/courses',
    icon: BookOpen
  },
  {
    title: 'Új tartalom létrehozása',
    href: '/instructor/courses/create',
    icon: Video
  },
  {
    title: 'Diákok',
    href: '/instructor/students',
    icon: Users
  },
  {
    title: 'Elemzések',
    href: '/instructor/analytics',
    icon: BarChart3
  },
  {
    title: 'Értékelések',
    href: '/instructor/reviews',
    icon: MessageSquare
  },
  {
    title: 'Tanúsítványok',
    href: '/instructor/certificates',
    icon: Award
  },
  {
    title: 'Naptár',
    href: '/instructor/calendar',
    icon: Calendar
  },
  {
    title: 'Források',
    href: '/instructor/resources',
    icon: FileText
  },
  {
    title: 'Beállítások',
    href: '/instructor/settings',
    icon: Settings
  }
]

export function InstructorSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Oktató Panel</h2>
        <p className="text-sm text-gray-500">Tartalmak és diákok kezelése</p>
      </div>
      {instructorNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}