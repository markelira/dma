'use client'

import { useState } from 'react'
import { UniversityLogo } from '@/components/branding/UniversityLogo'
import { MapPin, Users, Star, GraduationCap, Phone, Mail, ExternalLink, Play, Award, TrendingUp } from 'lucide-react'

interface UniversityData {
  id: string
  name: string
  logoUrl?: string | null
  description?: string | null
  website?: string | null
  phone?: string | null
  address?: string | null
  courseCount: number
  studentCount: number
  totalEnrollments: number
  backgroundImageUrl?: string | null
  videoUrl?: string | null
  foundedYear?: number
  rating?: number
  accreditationCount?: number
  employmentRate?: number
  internationalStudents?: number
}

interface PremiumHeroSectionProps {
  university: UniversityData
}

export function PremiumHeroSection({ university }: PremiumHeroSectionProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Calculate some premium stats
  const avgRating = university.rating || 4.5
  const employmentRate = university.employmentRate || 92
  const internationalRate = ((university.internationalStudents || 150) / university.studentCount * 100).toFixed(0)

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {/* Video Background */}
        {showVideo && university.videoUrl ? (
          <div className="absolute inset-0">
            <iframe
              src={university.videoUrl}
              className="w-full h-full object-cover"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <>
            {/* Image Background */}
            {university.backgroundImageUrl && !imageError ? (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${university.backgroundImageUrl})` }}
                onError={() => setImageError(true)}
              />
            ) : (
              // Fallback gradient background
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-accent" />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            
            {/* Animated geometric shapes */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -left-12 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }} />
            </div>
          </>
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Content - University Info */}
            <div className="lg:col-span-8 text-white space-y-6">
              {/* University Logo & Name */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <UniversityLogo 
                    logoUrl={university.logoUrl} 
                    name={university.name}
                    size="lg"
                    className="ring-4 ring-white/20 backdrop-blur-sm bg-white/10 rounded-2xl"
                  />
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight tracking-tight">
                    {university.name}
                  </h1>
                  
                  {/* Quick Info Bar */}
                  <div className="flex flex-wrap items-center gap-4 text-lg">
                    {university.address && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4" />
                        <span>{university.address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Users className="w-4 h-4" />
                      <span>{university.studentCount.toLocaleString('hu-HU')} hallgató</span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{avgRating}/5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {university.description && (
                <p className="text-xl leading-relaxed text-white/90 max-w-3xl">
                  {university.description}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button className="group bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all duration-300 flex items-center gap-3 hover:scale-105 shadow-xl">
                  <GraduationCap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Programok felfedezése
                </button>
                
                {university.phone && (
                  <button className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-3 hover:scale-105">
                    <Phone className="w-5 h-5 group-hover:ring-2 group-hover:ring-white/50 group-hover:rounded-full transition-all" />
                    Kapcsolat
                  </button>
                )}

                {university.website && (
                  <button className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-3 hover:scale-105">
                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Weboldal
                  </button>
                )}
              </div>

              {/* Video Play Button */}
              {university.videoUrl && !showVideo && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="group flex items-center gap-3 text-white/80 hover:text-white transition-colors pt-4"
                >
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                  <span className="text-lg font-medium">Bemutató videó megtekintése</span>
                </button>
              )}
            </div>

            {/* Right Content - Quick Stats Panel */}
            <div className="lg:col-span-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-6">
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Gyors áttekintés</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Courses */}
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">{university.courseCount}</div>
                    <div className="text-white/70 text-sm">Kurzusok</div>
                  </div>

                  {/* Graduates */}
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">{university.totalEnrollments}</div>
                    <div className="text-white/70 text-sm">Beiratkozások</div>
                  </div>

                  {/* Employment Rate */}
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">{employmentRate}%</div>
                    <div className="text-white/70 text-sm">Elhelyezkedés</div>
                  </div>

                  {/* International */}
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">{internationalRate}%</div>
                    <div className="text-white/70 text-sm">Nemzetközi</div>
                  </div>
                </div>

                {/* Founded Year */}
                {university.foundedYear && (
                  <div className="text-center pt-2 border-t border-white/20">
                    <div className="text-white/80 text-sm">Alapítva</div>
                    <div className="text-xl font-bold text-white">{university.foundedYear}</div>
                  </div>
                )}

                {/* Accreditations */}
                {university.accreditationCount && (
                  <div className="flex items-center justify-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium text-sm">
                      {university.accreditationCount} akkreditáció
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}