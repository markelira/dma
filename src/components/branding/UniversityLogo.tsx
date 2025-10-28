"use client"
import Image from 'next/image'
import { useState } from 'react'

interface UniversityLogoProps {
  logoUrl?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UniversityLogo({ 
  logoUrl, 
  name, 
  size = 'md', 
  className = '' 
}: UniversityLogoProps) {
  const [imgError, setImgError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-28 h-28 text-4xl', 
    lg: 'w-40 h-40 text-6xl'
  }

  const fallbackContent = (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark rounded-lg ${sizeClasses[size]} ${className}`}>
      <span className="text-white font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )

  if (!logoUrl || imgError) {
    return fallbackContent
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg animate-pulse">
          <div className="text-gray-400 font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        fill
        className="object-contain rounded-lg bg-white p-2"
        onError={() => {
          setImgError(true)
          setIsLoading(false)
        }}
        onLoad={() => setIsLoading(false)}
        priority={size === 'lg'}
      />
    </div>
  )
} 