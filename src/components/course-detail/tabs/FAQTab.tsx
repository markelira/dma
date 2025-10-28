"use client"

import React from 'react'

interface FAQTabProps {
  courseData: any
}

export function FAQTab({ courseData }: FAQTabProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Gyakran Ismételt Kérdések</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">GYIK betöltése...</p>
        </div>
      </section>
    </div>
  )
} 