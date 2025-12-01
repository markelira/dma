'use client'

import Link from 'next/link'
import { Trophy, Video, GraduationCap, Mic } from 'lucide-react'

const features = [
  {
    id: 'masterclass',
    title: 'Masterclass',
    description: 'Összegyűjtöttük neked a főbb tematikákat, hogy Masterclassokban fedezd fel a cégépítési rendszereket.',
    href: '/masterclass',
    Icon: Trophy,
  },
  {
    id: 'webinar',
    title: 'Webinár',
    description: 'Szakértő Mentorok folyamatosan ellátnak tartalmakkal, amiket élőben rögzítettünk.',
    href: '/webinar',
    Icon: Video,
  },
  {
    id: 'akademia',
    title: 'Akadémia',
    description: 'Lépésről lépésre fedezheted fel a rendszereket zéró bullshittel.',
    href: '/akademia',
    Icon: GraduationCap,
  },
  {
    id: 'podcast',
    title: 'Podcast',
    description: 'A Gondolkozz Rendszerben podcast adásainkban kiemelkedő cégvezetőkkel tárunk fel izgalmas témákat, hogy strukturált céget építhess.',
    href: '/podcast',
    Icon: Mic,
  },
]

// Header component for the Tartalmak section
export function TartalmakHeader() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] pt-24 md:pt-32 pb-12 md:pb-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 block">
              Tartalmak
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-[-0.01em]">
              Fedezd fel, ami
              <br />
              <span className="text-[#E72B36]">máshol nem elérhető!</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed border-l-2 border-gray-300 pl-6">
              Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudsz.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeaturesEditorial() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] pb-24 md:pb-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Masterclass - Large card (2 cols) */}
          <Link
            href={features[0].href}
            className="group md:col-span-2 lg:col-span-2 row-span-1"
          >
            <div className="h-full bg-gray-900 rounded-2xl p-8 md:p-10 lg:p-12 transition-all duration-300 hover:bg-gray-800 hover:scale-[1.02] flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#E72B36]/20 flex items-center justify-center mb-6 group-hover:bg-[#E72B36]/30 transition-colors">
                  <Trophy className="w-8 h-8 md:w-10 md:h-10 text-[#E72B36]" />
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-[-0.01em]">
                  {features[0].title}
                </h3>
                <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-md">
                  {features[0].description}
                </p>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                  Felfedezés
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* Webinár - Small card (1 col) */}
          <Link
            href={features[1].href}
            className="group"
          >
            <div className="h-full bg-white border border-gray-200 rounded-2xl p-8 md:p-10 transition-all duration-300 hover:border-[#E72B36]/30 hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#E72B36]/10 flex items-center justify-center mb-6 group-hover:bg-[#E72B36]/20 transition-colors">
                  <Video className="w-7 h-7 md:w-8 md:h-8 text-[#E72B36]" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 tracking-[-0.01em] group-hover:text-[#E72B36] transition-colors">
                  {features[1].title}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {features[1].description}
                </p>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 text-gray-900 font-medium group-hover:gap-4 group-hover:text-[#E72B36] transition-all">
                  Felfedezés
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* Akadémia - Small card (1 col) */}
          <Link
            href={features[2].href}
            className="group"
          >
            <div className="h-full bg-white border border-gray-200 rounded-2xl p-8 md:p-10 transition-all duration-300 hover:border-[#E72B36]/30 hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#E72B36]/10 flex items-center justify-center mb-6 group-hover:bg-[#E72B36]/20 transition-colors">
                  <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-[#E72B36]" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 tracking-[-0.01em] group-hover:text-[#E72B36] transition-colors">
                  {features[2].title}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {features[2].description}
                </p>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 text-gray-900 font-medium group-hover:gap-4 group-hover:text-[#E72B36] transition-all">
                  Felfedezés
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* Podcast - Large card (2 cols) */}
          <Link
            href={features[3].href}
            className="group md:col-span-2 lg:col-span-2"
          >
            <div className="h-full bg-gray-900 rounded-2xl p-8 md:p-10 lg:p-12 transition-all duration-300 hover:bg-gray-800 hover:scale-[1.02] flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#E72B36]/20 flex items-center justify-center mb-6 group-hover:bg-[#E72B36]/30 transition-colors">
                  <Mic className="w-8 h-8 md:w-10 md:h-10 text-[#E72B36]" />
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-[-0.01em]">
                  {features[3].title}
                </h3>
                <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-lg">
                  {features[3].description}
                </p>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                  Felfedezés
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

        </div>

      </div>
    </section>
  )
}
