'use client'

import Link from 'next/link'

export function WhyDMASection() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">

        {/* Header - Asymmetric with pull quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24 md:mb-32">
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-[-0.01em]">
              Még több ok, hogy miért
              <br />
              <span className="text-gray-400">ez lesz életed utazása</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 italic border-l-2 border-gray-300 pl-4 sm:pl-6">
              "Nem tanfolyamokat adunk, hanem működő rendszereket."
            </p>
          </div>
        </div>

        {/* Feature 1 - Left aligned with large number */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 md:mb-28">
          <div className="lg:col-span-2 flex items-start">
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-[#E72B36] leading-none select-none tracking-tight">
              01
            </span>
          </div>
          <div className="lg:col-span-6 lg:col-start-4">
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-[-0.01em]">
                Exkluzív kalandok.
              </h3>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
                Webinárok, Akadémiák, Podcastek és Masterclassok szakértő Mentoroktól.
              </p>
            </div>
          </div>
        </div>

        {/* Feature 2 - Right aligned with big number accent */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 md:mb-28">
          <div className="lg:col-span-5 lg:col-start-2 order-2 lg:order-1">
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-[-0.01em]">
                Azonnal alkalmazható.
              </h3>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
                150+ tartalom, amik működő rendszereket adnak a kezedbe, és már holnap használhatod.
              </p>
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-8 flex items-center justify-center lg:justify-end order-1 lg:order-2">
            <div className="relative">
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-[#E53935] leading-none">
                150+
              </span>
              <span className="absolute -bottom-2 right-0 text-sm md:text-base text-gray-500 font-medium">
                tartalom
              </span>
            </div>
          </div>
        </div>

        {/* Feature 3 - Full width dark accent block */}
        <div className="relative mb-20 md:mb-28">
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-10 md:p-16 lg:p-20">
            <div className="max-w-3xl">
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#E72B36] leading-none select-none mb-6 block tracking-tight">
                03
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-[-0.01em]">
                Nincs bullshit.
              </h3>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl">
                Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Fedezd fel 7 napig ingyen
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
