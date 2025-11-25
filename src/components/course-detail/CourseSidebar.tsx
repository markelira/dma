"use client"

import React from 'react'
import { Play, Book, Download, GraduationCap, Clock, Share2, Users, Facebook, Linkedin, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CourseSidebarProps {
  courseData: any
  ctaLabel: string
  onCtaClick: () => void
  isEnrolling: boolean
}

export function CourseSidebar({ courseData, ctaLabel, onCtaClick, isEnrolling }: CourseSidebarProps) {
  // Calculate real course features from courseData
  const totalLessons = courseData.stats?.lessons || 0
  const totalModules = courseData.stats?.modules || 0
  const totalDuration = courseData.stats?.duration || 0
  const totalStudents = courseData.stats?.students || 0
  
  const courseFeatures = [
    { 
      icon: Play, 
      text: `${Math.round(totalDuration / 60)} óra on-demand videó` 
    },
    { 
      icon: Book, 
      text: `${totalLessons} lecke ${totalModules} modulban` 
    },
    { 
      icon: Download, 
      text: `${courseData.resourcesCount || 0} letölthető erőforrás` 
    },
    { 
      icon: GraduationCap, 
      text: courseData.certificate ? "Befejeztési tanúsítvány" : "Nincs tanúsítvány" 
    },
    { 
      icon: Clock, 
      text: "Korlátlan hozzáférés" 
    }
  ]

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" }
  ]

  return (
    <div className="space-y-6">
      {/* Course Summary Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">Tartalom összefoglaló</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Nyelv</span>
            <span className="font-medium">{courseData.language || "Magyar"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Feliratok</span>
            <span className="font-medium">{courseData.subtitles || "Magyar, Angol"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Szint</span>
            <span className="font-medium">{courseData.level || "Kezdő"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Időigény</span>
            <span className="font-medium">{courseData.timeCommitment || "6-8 hét, heti 4-6 óra"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tanúsítvány</span>
            <span className="font-medium">{courseData.certificate ? "Igen, átvihető" : "Nem"}</span>
          </div>
        </div>
      </div>

      {/* Course Features Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">A tartalom tartalmaz:</h3>
        <div className="space-y-3">
          {courseFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <feature.icon className="w-5 h-5 text-[#0f766e]" />
              <span className="text-sm text-gray-700">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share Course Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-gray-600" />
        <h3 className="font-bold">Ossza meg a tartalmat</h3>
        </div>
        <div className="flex gap-2">
          {socialLinks.map((social, index) => (
            <button
              key={index}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <social.icon className="w-4 h-4" />
              <span className="text-sm">{social.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Enrollment CTA Card */}
      <div className="bg-[#0f766e] rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6" />
          <h3 className="font-bold text-lg">Csatlakozzon ma</h3>
        </div>
        <p className="text-sm mb-4 opacity-90">
          Csatlakozzon több mint {totalStudents.toLocaleString()} tanulóhoz, akik már fejlesztik készségeiket ezzel a tartalommal!
        </p>
        <Button 
          onClick={onCtaClick}
          disabled={isEnrolling}
          className="w-full bg-white text-[#0f766e] hover:bg-gray-100"
        >
          {isEnrolling ? 'Betöltés...' : ctaLabel}
        </Button>
      </div>
    </div>
  )
} 