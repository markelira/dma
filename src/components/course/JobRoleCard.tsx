import React from 'react'
import Image from 'next/image'
import { JobRole } from '@/hooks/useJobRoles'

interface Props {
  role: JobRole & { description?: string; image?: string; medianSalary?: string }
}

export const JobRoleCard: React.FC<Props> = ({ role }) => {
  const imgSrc = role.image || `https://source.unsplash.com/featured/400x300?${encodeURIComponent(role.title)}`
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl transition-transform hover:scale-[1.02] hover:shadow-lg flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative h-36 bg-gray-100 w-full">
        <Image src={imgSrc} alt={role.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain p-4" />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-2 text-base line-clamp-2">{role.title}</h3>
        {role.description && (
          <p className="text-muted text-sm line-clamp-3 mb-4">{role.description}</p>
        )}
        {role.medianSalary && (
          <p className="text-sm font-medium text-primary mt-auto">Medián fizetés: {role.medianSalary}</p>
        )}
      </div>
    </div>
  )
} 