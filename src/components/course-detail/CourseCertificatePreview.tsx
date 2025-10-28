"use client"

import React from 'react'
import { Check, Star, Award, Share2, Download, Eye, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CourseCertificatePreviewProps {
  courseData: any
  onCtaClick: () => void
}

export function CourseCertificatePreview({ courseData, onCtaClick }: CourseCertificatePreviewProps) {
  const skills = [
    "Digitális marketing alapok",
    "Közösségi média stratégiák",
    "SEO optimalizálás",
    "Google Ads kampányok",
    "Weboldal elemzés",
    "Tartalom marketing"
  ]

  const careerOutcomes = [
    {
      title: "Digitális Marketing Szakember",
      salary: "400,000 - 800,000 Ft/hó",
      demand: "Magas kereslet"
    },
    {
      title: "Közösségi Média Menedzser",
      salary: "350,000 - 700,000 Ft/hó",
      demand: "Növekvő terület"
    },
    {
      title: "SEO Szakember",
      salary: "450,000 - 900,000 Ft/hó",
      demand: "Stabil kereslet"
    }
  ]

  return (
    <section className="bg-gradient-to-br from-[#0f766e]/5 to-[#0f766e]/10 py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="w-8 h-8 text-[#0f766e]" />
            <h2 className="text-3xl font-bold text-gray-900">
              Tanúsítvány és karrierlehetőségek
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sajátítsa el a készségeket és szerezze meg a tanúsítványt, amely elismeri a tudását
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#0f766e]/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#0f766e] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Befejeztési Tanúsítvány</h3>
                <p className="text-sm text-gray-600">DMA Platform</p>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Ez a tanúsítvány igazolja, hogy</p>
                  <p className="font-semibold text-gray-900 mb-4">[Hallgató Neve]</p>
                  <p className="text-sm text-gray-600 mb-2">sikeresen elvégezte a kurzust</p>
                  <h4 className="font-bold text-lg text-[#0f766e] mb-4">{courseData.title}</h4>
                  <p className="text-xs text-gray-500">Kiadás dátuma: {new Date().toLocaleDateString('hu-HU')}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button className="flex-1 bg-[#0f766e] hover:bg-[#0f766e]/90">
                  <Eye className="w-4 h-4 mr-2" />
                  Előnézet
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Megosztás
                </Button>
              </div>
            </div>
          </div>

          {/* Skills Checklist */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-[#0f766e]" />
                <h3 className="text-xl font-bold text-gray-900">Sajátítandó készségek</h3>
              </div>
              
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#0f766e]/10 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#0f766e]" />
                    </div>
                    <span className="text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-[#0f766e]/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#0f766e]" />
                  <span className="font-semibold text-gray-900">Kurzus statisztikák</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Átlagos értékelés</p>
                    <p className="font-bold text-gray-900">4.8/5 ⭐</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sikeres befejezés</p>
                    <p className="font-bold text-gray-900">94%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Career Outcomes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 text-[#0f766e]" />
                <h3 className="text-xl font-bold text-gray-900">Karrierlehetőségek</h3>
              </div>
              
              <div className="space-y-4">
                {careerOutcomes.map((outcome, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{outcome.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{outcome.salary}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">{outcome.demand}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button 
                  onClick={onCtaClick}
                  className="w-full bg-[#0f766e] hover:bg-[#0f766e]/90 text-lg py-3"
                >
                  Kezdje el a tanulást most
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Tanúsítvány automatikusan elérhető a kurzus befejezése után
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 