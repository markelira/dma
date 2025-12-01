'use client'

import { Calendar, Award, Target } from 'lucide-react'

const benefits = [
  {
    id: 'experience',
    title: '20 év tapasztalat',
    description: '2005 óta azon dolgozunk, hogy a magyar KKV cégekből a legjobb munkahelyek váljanak.',
    Icon: Calendar,
  },
  {
    id: 'methods',
    title: 'Bevált módszerek',
    description: 'Mentoraink nemzetközi kutatásokra és bevált gyakorlatokra építve segítenek kialakítani a rendszereket.',
    Icon: Award,
  },
  {
    id: 'results',
    title: 'Elérhető eredmények',
    description: 'Tartalmainkkal elvezetünk téged, hogy vállalkozásod végre strukturált és önjáró legyen.',
    Icon: Target,
  },
]

export function BenefitsEditorial() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">

        {/* Header - Centered */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-[-0.01em] mb-6">
            Miért bízz bennünk?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Ismerj meg minket, hogy tudd miért leszünk mi a megfelelő útitársad a következő kalandjaidhoz!
          </p>
        </div>

        {/* Three columns with vertical lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.id}
              className={`
                relative px-4 sm:px-6 md:px-10 lg:px-12 py-8 sm:py-10 md:py-0
                ${index !== 0 ? 'md:border-l border-gray-300' : ''}
                ${index !== benefits.length - 1 ? 'border-b md:border-b-0 border-gray-300' : ''}
              `}
            >
              {/* Large decorative number */}
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#E72B36]/10 leading-none absolute top-0 right-4 md:right-8 select-none">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#E72B36]/10 flex items-center justify-center mb-6">
                <benefit.Icon className="w-7 h-7 md:w-8 md:h-8 text-[#E72B36]" />
              </div>

              {/* Content */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-[-0.01em]">
                {benefit.title}
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
