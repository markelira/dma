"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface CourseTabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'overview', label: 'Áttekintés' },
  { id: 'curriculum', label: 'Tananyag' },
  { id: 'instructors', label: 'Oktatók' },
  { id: 'reviews', label: 'Értékelések' },
  { id: 'faq', label: 'GYIK' }
]

export function CourseTabNavigation({ activeTab, onTabChange }: CourseTabNavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-[#0f766e] text-[#0f766e]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 