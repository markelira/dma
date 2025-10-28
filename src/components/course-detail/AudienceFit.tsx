import React from 'react'
import { Container } from '@/components/layout/container'
import { CheckCircle2, XCircle } from 'lucide-react'

interface AudienceFitProps {
  yesList: string[]
  noList?: string[]
}

export const AudienceFit: React.FC<AudienceFitProps> = ({ yesList, noList = [] }) => {
  if ((!yesList || yesList.length === 0) && (!noList || noList.length === 0)) return null
  return (
    <section id="audience-fit" className="py-24 bg-gray-50">
      <div className="container max-w-none mx-auto">
        <h2 className="heading-2 text-center text-primary mb-8">Neked ajánljuk</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {yesList.length > 0 && (
            <div>
              <h3 className="heading-3 mb-4 flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-6 h-6" /> Ideális, ha
              </h3>
              <ul className="space-y-2 list-disc ml-5 text-gray-700">
                {yesList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {noList.length > 0 && (
            <div>
              <h3 className="heading-3 mb-4 flex items-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" /> Nem ajánlott, ha
              </h3>
              <ul className="space-y-2 list-disc ml-5 text-gray-700">
                {noList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
} 