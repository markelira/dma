import React from 'react'
import { Rocket, TrendingUp, Clock, GraduationCap } from 'lucide-react'
import { University } from '@/types'
import { API_BASE_URL } from '@/constants'
import Image from 'next/image'

interface Props {
  universities?: University[]
}

export const CourseUSPSection: React.FC<Props> = ({ universities = [] }) => {
  // Create a duplicated logos list so we can build an infinite marquee-style scroll.
  const logos = universities.slice(0, 12) // take a few more if available
  const scrollingLogos = [...logos, ...logos] // duplicate for seamless loop

  const benefits: { icon: JSX.Element; label: string; hint: string; bgColor: string }[] = [
    { icon: <Rocket className="w-8 h-8 text-primary" />, label: 'Gyakorlati Eredmények', hint: 'Valós projektek, azonnali haszon', bgColor: 'bg-blue-50 bg-opacity-40' },
    { icon: <TrendingUp className="w-8 h-8 text-primary" />, label: 'Karrierváltás', hint: 'Kurzusok keresett szerepekhez', bgColor: 'bg-green-50 bg-opacity-40' },
    { icon: <Clock className="w-8 h-8 text-primary" />, label: 'Rugalmas Hozzáférés', hint: 'Tanulj a saját tempódban', bgColor: 'bg-yellow-50 bg-opacity-40' },
    { icon: <GraduationCap className="w-8 h-8 text-primary" />, label: 'Vezető Egyetemek', hint: 'Top magyar partnerek', bgColor: 'bg-pink-50 bg-opacity-40' },
  ]

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Abstract background illustration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.06)_0%,transparent_40%),radial-gradient(circle_at_80%_30%,rgba(167,139,250,0.05)_0%,transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Main text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
              A Következő Áttörés <span className="text-primary">Már Holnap</span> Kezdődhet.
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 mb-8">
              Az DMA átalakítja a tudásodat <strong>valódi karrierlehetőségekké</strong>, a legjobb magyar egyetemek szakértelmével.
            </p>
          </div>

          {/* Right column - Benefit cards */}
          {/* Negative top margin on large screens so first card aligns with headline mid-line */}
          <div className="space-y-6 lg:-mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className={`group flex items-center gap-4 p-4 ${b.bgColor} rounded-xl shadow-sm hover:shadow-md transition-all ring-1 ring-black/5 reveal`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="benefit-icon transition-transform duration-200">
                    {b.icon}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {b.label}
                    </span>
                    <span className="block opacity-0 group-hover:opacity-100 text-xs text-gray-500 mt-1 transition-opacity">
                      {b.hint}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Partner logos – infinite scroll */}
            {logos.length > 0 && (
              <div className="relative overflow-hidden mt-8">
                <div className="flex gap-8 logos-scroll whitespace-nowrap">
                  {scrollingLogos.map((u, idx) => {
                    const backendBase = API_BASE_URL.replace(/\/?api$/, '')
                    const logoSrc = u.logoUrl && !u.logoUrl.startsWith('http') ? backendBase + u.logoUrl : u.logoUrl
                    return (
                      <div
                        key={u.id ? `${u.id}-${idx}` : idx}
                        className="w-24 h-10 flex-shrink-0 transition-all duration-300 flex items-center justify-center"
                        title={u.name}
                      >
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={u.name}
                            width={96}
                            height={40}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">{u.name}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="#kategoriak-felfedezese"
            className="inline-block px-8 py-3 rounded-full bg-primary text-white font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary animate-cta-pulse"
          >
            Fedezd fel a kategóriákat
          </a>
        </div>
      </div>

      {/* Reveal animation */}
      <style jsx>{`
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .reveal {
          opacity: 0;
          animation: slideUp 0.6s ease forwards;
        }
        /* Benefit icon pop */
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .group:hover .benefit-icon {
          animation: pop 0.35s ease;
        }

        /* Infinite scroll for partner logos */
        @keyframes scrollLeft {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .logos-scroll {
          animation: scrollLeft 25s linear infinite;
        }
        .logos-scroll:hover {
          animation-play-state: paused;
        }

        /* CTA quick pulse on mount */
        @keyframes pulseOnce {
          0% { transform: scale(1); }
          30% { transform: scale(1.05); }
          60% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        .animate-cta-pulse {
          animation: pulseOnce 1.4s ease-in-out 0.4s both;
        }
      `}</style>
    </section>
  )
} 