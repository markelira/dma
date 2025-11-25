"use client"

import React from 'react'
import { Clock, BookOpen, Target } from 'lucide-react'

interface LessonOverviewTabProps {
  lesson: any
  course: any
}

export const LessonOverviewTab: React.FC<LessonOverviewTabProps> = ({ lesson, course }) => {
  // Format duration from seconds to readable format
  const formatDuration = (seconds: number) => {
    if (!seconds) return null
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours} óra ${remainingMinutes} perc`
    }
    return `${minutes} perc ${remainingSeconds} mp`
  }

  const duration = lesson?.duration || lesson?.videoDuration

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Lesson Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {lesson?.title || 'Lecke címe'}
          </h2>
          {duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
        </div>

        {/* Lesson Description */}
        <div className="prose prose-gray max-w-none">
          {lesson?.description ? (
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {lesson.description}
            </div>
          ) : (
            <div className="text-gray-500 italic flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Nincs elérhető leírás ehhez a leckéhez</span>
            </div>
          )}
        </div>

        {/* Additional metadata if available */}
        {(lesson?.objectives || lesson?.keyPoints) && (
          <div className="border-t pt-6">
            {lesson?.objectives && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-brand-secondary" />
                  <h3 className="text-lg font-bold text-gray-900">Tanulási célok</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {lesson.objectives.map((objective: string, index: number) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {lesson?.keyPoints && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-brand-secondary" />
                  <h3 className="text-lg font-bold text-gray-900">Kulcsfontosságú pontok</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {lesson.keyPoints.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
