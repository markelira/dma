'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon, BookOpen, Play, Edit, Award } from 'lucide-react'
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
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    label: 'Tanulás folytatása',
    icon: Play,
    href: '/dashboard/courses',
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
  },
]

/**
 * Quick Actions Component
 *
 * Displays 4 action buttons for common student tasks
 * Matches the preview design's clean grid layout
 */
export function QuickActions({
  actions = DEFAULT_ACTIONS,
  isLoading = false,
}: QuickActionsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <div className="mb-4 h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
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
                'flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 p-4 text-center transition-all duration-200',
                action.color || 'bg-gray-50 hover:bg-gray-100',
                'hover:shadow-md hover:scale-105'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium leading-tight">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
