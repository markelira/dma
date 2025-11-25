'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon, BookOpen, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: LucideIcon
  href: string
  color?: string
}

interface QuickActionsProps {
  actions?: QuickAction[]
  isLoading?: boolean
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    label: 'Kurzusok böngészése',
    icon: BookOpen,
    href: '/courses',
    color: 'bg-brand-secondary/20 text-brand-secondary hover:bg-brand-secondary/30',
  },
  {
    label: 'Tanulás folytatása',
    icon: Play,
    href: '/dashboard/courses',
    color: 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
  },
]

/**
 * Quick Actions Component - Dark Theme
 *
 * Displays action buttons for common student tasks
 */
export function QuickActions({
  actions = DEFAULT_ACTIONS,
  isLoading = false,
}: QuickActionsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
        <div className="mb-4 h-6 w-32 bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 gap-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-20 rounded-lg bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#1a1a1a] p-6 border border-gray-800">
      <h2 className="mb-4 text-sm font-bold text-gray-400 uppercase tracking-wide">
        Gyors műveletek
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={index}
              href={action.href}
              className={cn(
                'flex items-center gap-4 rounded-lg border border-gray-800 p-4 transition-all duration-200',
                action.color || 'bg-gray-800/50 hover:bg-gray-800',
                'hover:border-gray-700'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-200">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
