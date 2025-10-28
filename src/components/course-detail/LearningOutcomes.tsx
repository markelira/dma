import React from 'react'
import { Container } from '@/components/layout/container'

interface LearningOutcomesProps {
  outcomes: string[]
}

export const LearningOutcomes: React.FC<LearningOutcomesProps> = ({ outcomes }) => {
  if (!outcomes || outcomes.length === 0) return null
  return (
    <section id="learning-outcomes" className="py-24 bg-white">
      <div className="container max-w-none mx-auto">
        <h2 className="heading-2 text-center text-primary mb-8">Mit fogsz elsajátítani?</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 max-w-4xl mx-auto list-disc ml-5 text-gray-700">
          {outcomes.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
} 