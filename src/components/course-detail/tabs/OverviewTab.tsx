"use client"

import React from 'react'
import { Check, Star, Clock, Calendar, Users, BarChart3 } from 'lucide-react'

interface OverviewTabProps {
  courseData: any
}

export function OverviewTab({ courseData }: OverviewTabProps) {
  // Use real course data for highlights (fallback to defaults if not available)
  const highlights = courseData.highlights || [
    "Deep understanding of the most important theoretical and practical foundations of the field",
    "Ability to solve real problems effectively and creatively",
    "Comprehensive knowledge of modern methodologies and tools",
    "Practical skills that can be immediately applied in professional settings",
    "Understanding of industry best practices and current trends",
    "Confidence to take on complex challenges in the field"
  ]

  // Calculate real statistics from courseData
  const totalDuration = courseData.stats.duration || 0
  const totalModules = courseData.stats.modules || 0
  const totalStudents = courseData.stats.students || 0
  const averageRating = courseData.stats.rating || 0

  const stats = [
    { 
      icon: Clock, 
      label: "Összesen", 
      value: totalDuration > 0 ? `${Math.round(totalDuration / 60)} óra` : "0 óra" 
    },
    { 
      icon: Calendar, 
      label: "Modulok", 
      value: `${totalModules} modul` 
    },
    { 
      icon: Users, 
      label: "Tanulók", 
      value: totalStudents.toLocaleString() 
    },
    { 
      icon: Star, 
      label: "Értékelés", 
      value: averageRating > 0 ? `${averageRating.toFixed(1)}/5` : "Nincs értékelés" 
    }
  ]

  // Use real testimonials if available, otherwise show placeholder
  const testimonials = courseData.testimonials || courseData.reviews || [
    {
      name: "Kovács Péter",
      role: "Marketing menedzser",
      rating: 5,
      quote: "Ez a tartalom teljesen átalakította a szakmai megközelítésemet. A gyakorlati feladatok és valós példák rendkívül hasznosak voltak. Már az első hét után tudtam alkalmazni a tanultakat a munkámban."
    },
    {
      name: "Szabó Anna",
      role: "Projekt koordinátor",
      rating: 5,
      quote: "Kiváló oktatók, kiváló tartalom. A képzés tökéletes egyensúlyt teremt az elméleti alapok és a gyakorlati alkalmazások között. Minden forintot megért, sőt többet is!"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Highlights Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-[#0f766e]" />
          <h2 className="text-xl font-semibold">Kiemelések</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((highlight: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#0f766e] mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-sm">{highlight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Course Statistics Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-[#0f766e]" />
          <h2 className="text-xl font-semibold">Tartalom statisztikák</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <stat.icon className="w-6 h-6 text-[#0f766e] mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="font-semibold text-lg">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Amit mások mondanak</h2>
        <div className="space-y-6">
          {testimonials.map((testimonial: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <span className="text-sm text-gray-500">{testimonial.role}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{testimonial.quote}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
} 