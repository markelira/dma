"use client"
import React from 'react'
import { Container } from '@/components/layout/container'
import { ShieldCheck, Clock, Award, Users, CheckCircle } from 'lucide-react'

export const PricingGuarantee: React.FC = () => {
  const guarantees = [
    {
      icon: ShieldCheck,
      title: '30 napos garancia',
      description: 'Kérdés nélkül visszatérítjük a tanfolyam díját'
    },
    {
      icon: Clock,
      title: 'Élethosszig tartó hozzáférés',
      description: 'Bármikor, bárhol folytathatja a tanulást'
    },
    {
      icon: Award,
      title: 'Szakmai tanúsítvány',
      description: 'Elismert tanúsítvány minden kurzus után'
    },
    {
      icon: Users,
      title: 'Szakértő támogatás',
      description: '24/7 elérhető mentorok és közösség'
    }
  ]

  return (
    <section id="pricing-guarantee" className="py-32 sm:py-40 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <Container className="max-w-7xl relative">
        <div className="text-center text-white mb-24">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Teljes Garancia
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Kockázatmentes tanulási élmény. Ha nem elégedett, kérdés nélkül visszatérítjük a befizetett összeget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
          {guarantees.map((guarantee, index) => {
            const Icon = guarantee.icon
            return (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">{guarantee.title}</h3>
                <p className="text-white/80 leading-relaxed">{guarantee.description}</p>
              </div>
            )
          })}
        </div>

        {/* Main guarantee highlight */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Miért bíznak bennünk?
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">15,000+ elégedett diák</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">95% elégedettségi arány</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">5+ év tapasztalat</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">ISO 9001 minőségbiztosítás</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-8 text-white text-center">
              <div className="text-4xl font-bold mb-4">30 nap</div>
              <div className="text-xl mb-6">Visszatérítési garancia</div>
              <p className="text-white/90 mb-6">
                Ha bármilyen okból nem elégedett a kurzusokkal, 30 napon belül kérdés nélkül visszatérítjük a teljes befizetett összeget.
              </p>
              <div className="text-sm text-white/70">
                * Minden visszatérítés automatikusan történik
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold">Kockázatmentes próba</span>
          </div>
        </div>
      </Container>
    </section>
  )
} 