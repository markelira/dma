"use client"

import React from 'react'
import Link from 'next/link'
import { Module, Lesson } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  courseId: string
  modules: Module[]
  currentLessonId: string
  hasSubscription: boolean
}

export const LessonSidebar: React.FC<Props> = ({ courseId, modules, currentLessonId, hasSubscription }) => {
  const router = useRouter()
  return (
    <aside className="w-full md:w-64 border-r bg-gray-50 h-full overflow-y-auto p-4 space-y-4">
      {modules.sort((a,b)=>a.order-b.order).map(module => (
        <div key={module.id} className="">
          <h3 className="text-sm font-bold text-gray-700 mb-2">{module.title}</h3>
          <ul className="space-y-1">
            {module.lessons.sort((a,b)=>a.order-b.order).map(lesson => {
              const locked = !hasSubscription && (module.status === 'PAID' || (module as any).subscriptionTier === 'PREMIUM')
              return (
                <li key={lesson.id}>
                  {locked ? (
                    <div className="px-2 py-1 text-gray-400 text-xs">{lesson.title}</div>
                  ) : (
                    <Link href={`/courses/${courseId}/player/${lesson.id}`} className={`block px-2 py-1 text-sm rounded ${lesson.id===currentLessonId? 'bg-primary/10 text-primary font-medium': 'text-gray-600 hover:bg-gray-100'}`}>{lesson.title}</Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
} 