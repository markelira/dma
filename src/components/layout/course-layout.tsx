'use client'

import React from 'react'
// We will create a dedicated CourseSidebar component later
// import { CourseSidebar } from '@/components/navigation/course-sidebar'

interface CourseLayoutProps {
  children: React.ReactNode
}

export function CourseLayout({ children }: CourseLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Navbar provided by root layout */}
      <div className="flex-1 flex flex-col pb-10 w-full">
        {children}
      </div>
    </div>
  )
} 