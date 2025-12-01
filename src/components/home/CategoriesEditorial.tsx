'use client'

import Link from 'next/link'
import { Users, UserPlus, Megaphone, TrendingUp, Settings } from 'lucide-react'

const categories = [
  {
    id: 'leadership',
    title: 'Vezetés és menedzsment',
    href: '/courses?category=vezetes-es-menedzsment',
    Icon: Users,
  },
  {
    id: 'hr',
    title: 'HR és csapatépítés',
    href: '/courses?category=hr-es-csapatepites',
    Icon: UserPlus,
  },
  {
    id: 'marketing',
    title: 'Marketing és brandépítés',
    href: '/courses?category=marketing-es-pr',
    Icon: Megaphone,
  },
  {
    id: 'sales',
    title: 'Értékesítés és bevételnövelés',
    href: '/courses?category=ertekesites-es-bevetelnoveles',
    Icon: TrendingUp,
  },
  {
    id: 'operations',
    title: 'Működés és rendszerek',
    href: '/courses?category=mukodes-es-rendszerek',
    Icon: Settings,
  },
]

export function CategoriesEditorial() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Header - Editorial Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div className="lg:col-span-7">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 block">
              DMA Masterclass
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-[-0.01em]">
              A Struktúraépítő
              <br />
              <span className="text-[#E72B36]">streaming platform</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed border-l-2 border-gray-300 pl-4 sm:pl-6">
              Itt megtalálsz minden területet és hozzá tartozó tartalmakat, ami egy strukturált cég felépítéséhez szükséges.
            </p>
          </div>
        </div>

        {/* Category Cards - 5 column grid on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group"
            >
              <div className="h-full bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm transition-all duration-300 hover:border-[#E72B36]/30 hover:shadow-lg hover:scale-[1.02] flex flex-col items-center text-center min-h-[140px] sm:min-h-[160px] md:min-h-[200px]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#E72B36]/10 transition-colors">
                  <category.Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-600 group-hover:text-[#E72B36] transition-colors" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 group-hover:text-[#E72B36] transition-colors leading-tight">
                  {category.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
