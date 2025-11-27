export const dynamic = 'force-dynamic';

import React from 'react'

export default function LearningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use a simple div wrapper to avoid HTML/body conflicts
  return (
    <div className="min-h-screen bg-gray-100 overflow-hidden">
      {children}
    </div>
  )
}