'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

const features = [
  'Teljes hozzáférés 150+ struktúraépítő tartalomhoz',
  'Több mint 200 órányi azonnal alkalmazható, működő rendszer',
  '5 munkatárs díjmentes hozzáadása',
  'Hetente frissülő tartalmak',
  'Bármikor lemondható',
  '7 napos ingyenes kipróbálás',
]

export function PricingEditorial() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Header - Editorial Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div className="lg:col-span-7">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 block">
              Hozzáférés
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-[-0.01em]">
              Fedezd fel 7 napig
              <br />
              <span className="text-[#E72B36]">teljesen ingyen</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed border-l-2 border-gray-300 pl-4 sm:pl-6">
              Vágj bele a kalandba és fedezd fel a 150+ cégépítési tartalmat, hogy vállalkozásod végre strukturált és önjáró legyen.
            </p>
          </div>
        </div>

        {/* Pricing Card - Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-lg relative">
            {/* Card */}
            <div className="relative bg-gray-900 rounded-3xl overflow-hidden">
              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 md:p-10">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    Teljes hozzáférés
                  </h3>
                  <p className="text-gray-400">
                    Egyéni és céges előfizetés – 1 előfizetéssel 5 kollégát adhatsz hozzá a csapatodhoz, és mindenki hozzáfér az összes tartalomhoz.
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6 sm:mb-8">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                    14.990 Ft
                  </span>
                  <span className="text-lg sm:text-xl text-gray-400">/hó</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/20 mb-6 sm:mb-8" />

                {/* Features */}
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#E72B36] flex-shrink-0 mt-0.5" />
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Divider */}
                <div className="h-px bg-white/20 mb-6 sm:mb-8" />

                {/* CTA Button */}
                <Link
                  href="/pricing"
                  className="block w-full py-4 px-6 bg-white text-gray-900 font-semibold text-center rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Kezdd el ingyen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
