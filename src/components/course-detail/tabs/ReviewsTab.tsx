"use client"

import React from 'react'

interface ReviewsTabProps {
  courseData: any
}

export function ReviewsTab({ courseData }: ReviewsTabProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Értékelések</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">Értékelések betöltése...</p>
        </div>
      </section>
    </div>
  )
} 