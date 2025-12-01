'use client'

import Link from 'next/link'

export function CtaEditorial() {
  return (
    <section className="w-full bg-gray-900 py-24 md:py-32 overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #E72B36 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, #E72B36 0%, transparent 50%)`
        }} />
      </div>

      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px] relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Small text */}
          <p className="text-[#E72B36] text-sm md:text-base font-medium uppercase tracking-widest mb-6">
            Még mindig itt vagy?
          </p>

          {/* Big headline */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-[-0.02em] mb-6">
            Elég volt a
            <br />
            <span className="text-[#E72B36]">káoszból.</span>
          </h2>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            Vagy építesz rendszert, vagy a rendszer épít le téged.
            <br className="hidden md:block" />
            <span className="text-white font-medium">Válassz okosan.</span>
          </p>

          {/* CTA Button */}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#E72B36] text-white font-semibold text-lg rounded-xl hover:bg-[#c9242e] transition-all duration-200 shadow-lg shadow-[#E72B36]/30 hover:shadow-[#E72B36]/50 hover:scale-105"
          >
            Kezdd el most – 7 nap ingyen
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          {/* Trust signal */}
          <p className="text-gray-500 text-sm mt-6">
            Nincs bankkártya. Nincs kötöttség. Csak eredmények.
          </p>
        </div>
      </div>
    </section>
  )
}
