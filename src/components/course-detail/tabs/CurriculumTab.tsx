"use client"

import React, { useState } from 'react'
import { Book, Play, ChevronDown, ChevronRight } from 'lucide-react'

interface CurriculumTabProps {
  courseData: any
}

export function CurriculumTab({ courseData }: CurriculumTabProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // DEBUGGING: Log what courseData contains
  console.log('🔍 [CurriculumTab] Received courseData:', {
    hasModules: !!courseData.modules,
    modulesType: typeof courseData.modules,
    modulesLength: courseData.modules?.length || 0,
    courseDataKeys: Object.keys(courseData || {}),
    fullCourseData: courseData
  });

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  // Use real modules from courseData
  const modules = courseData.modules || []
  console.log('🔍 [CurriculumTab] Processed modules:', modules.length, 'modules');
  modules.forEach((module: any, index: number) => {
    console.log(`🔍 [CurriculumTab] Module ${index + 1}:`, {
      id: module.id,
      title: module.title,
      lessonsCount: module.lessons?.length || 0,
      moduleKeys: Object.keys(module || {})
    });
  });
  
  // Calculate total lessons and duration
  const totalLessons = modules.reduce((sum: number, module: any) => {
    return sum + (Array.isArray(module.lessons) ? module.lessons.length : 0)
  }, 0)
  
  const totalDuration = modules.reduce((sum: number, module: any) => {
    const moduleLessons = Array.isArray(module.lessons) ? module.lessons : []
    const moduleDuration = moduleLessons.reduce((lessonSum: number, lesson: any) => {
      return lessonSum + (lesson.duration || 10) // Default 10 minutes per lesson
    }, 0)
    return sum + moduleDuration
  }, 0)

  // Format duration helper
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours} óra ${mins > 0 ? `${mins} perc` : ''}`.trim()
    }
    return `${mins} perc`
  }

  return (
    <div className="space-y-6">
      {/* Course Content Header */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-[#0f766e]" />
          <h2 className="text-xl font-semibold">A kurzus tartalma</h2>
        </div>
        <p className="text-gray-600 mb-6">{totalLessons} lecke • {formatDuration(totalDuration)}</p>
        
        {/* Modules */}
        <div className="space-y-4">
          {modules.map((module: any, moduleIndex: number) => {
            const moduleLessons = Array.isArray(module.lessons) ? module.lessons : []
            const moduleDuration = moduleLessons.reduce((sum: number, lesson: any) => {
              return sum + (lesson.duration || 10)
            }, 0)
            
            return (
              <div key={module.id || moduleIndex} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleModule(module.id || moduleIndex.toString())}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#0f766e]/10 text-[#0f766e] rounded-full flex items-center justify-center text-sm font-medium">
                      {moduleIndex + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{module.title || `Modul ${moduleIndex + 1}`}</h3>
                      <p className="text-sm text-gray-500">{moduleLessons.length} lecke • {formatDuration(moduleDuration)}</p>
                    </div>
                  </div>
                  {expandedModules.has(module.id || moduleIndex.toString()) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {expandedModules.has(module.id || moduleIndex.toString()) && (
                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="space-y-2">
                      {moduleLessons.map((lesson: any, lessonIndex: number) => (
                        <div key={lesson.id || lessonIndex} className="flex items-center gap-3 py-2">
                          <Play className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 flex-1">{lesson.title || `Lecke ${lessonIndex + 1}`}</span>
                          <span className="text-xs text-gray-500">{lesson.duration ? `${lesson.duration} perc` : '10 perc'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {modules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nincs elérhető tananyag</p>
          </div>
        )}
      </section>
    </div>
  )
} 