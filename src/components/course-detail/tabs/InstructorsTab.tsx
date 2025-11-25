"use client"

import React from 'react'
import { GraduationCap, Share2, ExternalLink } from 'lucide-react'

interface InstructorsTabProps {
  courseData: any
}

export function InstructorsTab({ courseData }: InstructorsTabProps) {
  // Use real instructor data from courseData
  const instructors = courseData.instructors || []
  
  // If no instructors array, try to use single instructor
  const allInstructors = instructors.length > 0 ? instructors : 
    (courseData.instructor ? [courseData.instructor] : [])

  return (
    <div className="space-y-6">
      {/* Expert Instructors Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-5 h-5 text-[#0f766e]" />
          <h2 className="text-xl font-bold">Szakértő oktatók</h2>
        </div>
        
        <div className="space-y-6">
          {allInstructors.map((instructor: any, index: number) => (
            <div key={instructor.id || index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                {instructor.profilePictureUrl ? (
                  <img 
                    src={instructor.profilePictureUrl} 
                    alt={instructor.firstName || instructor.name}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex-shrink-0"></div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    {instructor.firstName && instructor.lastName 
                      ? `${instructor.firstName} ${instructor.lastName}`
                      : instructor.name || `Oktató ${index + 1}`
                    }
                  </h3>
                  <p className="text-[#0f766e] text-sm mb-3">
                    {instructor.title || instructor.role || 'Oktató'}
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    {instructor.bio || instructor.description || 'Nincs elérhető leírás az oktatóról.'}
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                      <Share2 className="w-4 h-4" />
                      Kapcsolat
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      További információ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {allInstructors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nincs elérhető oktató információ</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
} 