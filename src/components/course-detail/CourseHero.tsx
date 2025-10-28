import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Users, Star, Clock, Award, Info, ExternalLink } from 'lucide-react'
import { API_BASE_URL } from '@/constants'
import Link from 'next/link'

interface StatItem {
  id: 'modules' | 'lessons' | 'students'
  label: string
  value: string | number
  icon: React.ReactNode
}

interface CourseHeroProps {
  title: string
  subtitle: string
  imageUrl: string
  stats: {
    modules: number
    lessons: number
    students: number
  }
  ctaLabel: string
  onCtaClick: () => void
  isPlus?: boolean
  courseType?: 'DRAFT' | 'PUBLISHED' | 'SOON' | 'ARCHIVED' | 'FREE' | 'PAID'
  instructor?: {
    firstName: string
    lastName: string
    profilePictureUrl?: string
    title?: string
    bio?: string
    institution?: string
  }
  university?: {
    name: string
    logoUrl?: string
    slug?: string
  }
  instructorUniversity?: {
    name: string
    logoUrl?: string
    role?: string
    slug?: string
  }
  courseDetails?: {
    series?: number
    rating?: number
    reviews?: number
    level?: string
    duration?: string
    pace?: string
    certificate?: boolean
  }
}

export const CourseHero: React.FC<CourseHeroProps> = ({
  title,
  subtitle,
  imageUrl,
  stats,
  ctaLabel,
  onCtaClick,
  isPlus,
  courseType,
  instructor,
  university,
  instructorUniversity,
  courseDetails,
}) => {
  const statItems: StatItem[] = [
    {
      id: 'modules',
      label: 'modul',
      value: stats.modules,
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'lessons',
      label: 'lecke',
      value: stats.lessons,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'students',
      label: 'tanuló',
      value: stats.students.toLocaleString('hu-HU'),
      icon: <Users className="w-5 h-5" />,
    },
  ]

  // University logo URL handling
  const backendBase = API_BASE_URL.replace(/\/?api$/, '')
  const getUniversityLogoSrc = (logoUrl?: string) => {
    if (!logoUrl) return undefined
    return !logoUrl.startsWith('http') ? backendBase + logoUrl : logoUrl
  }

  return (
    <section className="py-12 bg-gradient-to-b from-[#f8f9fa] to-[#e0f2f1] relative overflow-hidden">
      {/* Subtle background shapes like in the screenshot */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-20 w-64 h-64 bg-teal-100/20 rounded-full blur-2xl"></div>
      
      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Content */}
          <div className="max-w-4xl">
            {/* Top left - University/Institution Logo - Apple Glass Effect */}
            {(university || instructorUniversity) && (
              <div className="mb-6">
                <div className="relative">
                  {/* Apple-style glass effect */}
                  <div className="bg-white/12 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/25 bg-gradient-to-br from-white/15 via-white/10 to-white/5">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-40"></div>
                    
                    {/* Content */}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(university?.logoUrl || instructorUniversity?.logoUrl) ? (
                          <img 
                            src={getUniversityLogoSrc(university?.logoUrl || instructorUniversity?.logoUrl)} 
                            alt={university?.name || instructorUniversity?.name}
                            className="w-10 h-10 rounded-lg object-contain drop-shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">🏛️</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800 drop-shadow-sm">
                            {university?.name || instructorUniversity?.name}
                          </span>
                        </div>
                      </div>
                      {(university?.slug || instructorUniversity?.slug) && (
                        <Link 
                          href={`/universities/${university?.slug || instructorUniversity?.slug}`}
                          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition-colors group"
                        >
                          <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-xs">Egyetem oldal</span>
                        </Link>
                      )}
                    </div>
                    
                    {/* Subtle border highlight */}
                    <div className="absolute inset-0 rounded-2xl border border-white/15 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content Block - Left Aligned - Replicated from reference */}
            <div className="space-y-6">
              {/* Course Title - Replicated typography from reference */}
              <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight max-w-5xl tracking-tight">
                {title}
              </h1>
              
              {/* Course Description - Replicated styling from reference */}
              <p className="text-lg text-gray-700 max-w-4xl leading-relaxed">
                {subtitle}
              </p>
              
              {/* Instructor Information - Replicated layout from reference */}
              {instructor && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">G</span>
                  </div>
                  <span className="text-gray-700 text-sm">
                    oktató: <span className="text-teal-600 underline font-medium">{instructor.firstName} {instructor.lastName}</span>
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                      NÉPSZERŰ OKTATÓ
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full flex items-center gap-1">
                      <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                      ÚJ AI-készségek
                    </span>
                  </div>
                </div>
              )}
              
              {/* Enrollment Call to Action - Replicated from reference */}
              <div className="space-y-3">
                {/* Primary CTA Button - Replicated styling */}
                <Button 
                  onClick={onCtaClick} 
                  className="w-full md:w-auto px-8 py-4 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Jelentkezzen ingyen
                </Button>
                
                {/* Button Sub-Text - Replicated from reference */}
                <div className="text-sm text-gray-500">
                  Kezdés: {new Date().toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}.
                </div>
                
                {/* Enrollment Count - Replicated from reference */}
                <div className="text-base font-medium text-gray-900">
                  {stats.students.toLocaleString('hu-HU')} tanuló már jelentkezett
                </div>
                
                {/* Plus Inclusion - Replicated from reference */}
                {process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTION === 'true' && isPlus && (
                  <div className="text-sm text-gray-700">
                    Tartalmazza a következőt: <span className="font-bold text-teal-600">DMA Plus</span> • 
                    <span className="text-teal-600 underline cursor-pointer"> További információ</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Course Thumbnail */}
          <div className="relative lg:sticky lg:top-8">
            <div className="relative group">
              {/* Thumbnail Container with Blending - Reduced by 40% */}
              <div className="relative w-full h-56 lg:h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                {/* Background Gradient Overlay for Blending */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-transparent to-teal-50/30 z-10"></div>
                
                {/* Course Image */}
                <Image 
                  src={imageUrl} 
                  alt={title} 
                  fill 
                  priority 
                  sizes="(min-width: 1024px) 50vw, 100vw" 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Subtle Overlay for Better Blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent z-20"></div>
                
                {/* Course Type Badge - Match CourseCard design */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-30">
                  {process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTION === 'true' && isPlus ? (
                    <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      DMA Plus
                    </span>
                  ) : (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      Ingyenes
                    </span>
                  )}
                </div>
              </div>
              
              {/* Floating Stats Cards - Apple Glass Effect */}
              <div className="absolute -bottom-4 left-4 right-4 z-30">
                <div className="relative">
                  {/* Glass effect with Apple-style design */}
                  <div className="bg-white/8 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 bg-gradient-to-br from-white/12 via-white/8 to-white/4">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30"></div>
                    
                    {/* Content with enhanced contrast */}
                    <div className="relative grid grid-cols-3 gap-4">
                      {statItems.map((item) => (
                        <div key={item.id} className="text-center group">
                          <div className="flex items-center justify-center text-teal-600 mb-2 group-hover:scale-110 transition-transform duration-200">
                            {item.icon}
                          </div>
                          <div className="text-sm font-bold text-gray-900 drop-shadow-sm">{item.value}</div>
                          <div className="text-xs text-gray-700 font-medium">{item.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Subtle border highlight */}
                    <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 