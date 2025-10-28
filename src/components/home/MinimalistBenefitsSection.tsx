'use client';

import React from 'react';
import { Users, Zap, TrendingUp, Shield, MessageCircle, BarChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * MinimalistBenefitsSection - Clean, Corporate Design
 * Single color: DMA Navy, no gradients, clean cards
 */
export function MinimalistBenefitsSection() {
  const benefits = [
    {
      icon: Users,
      title: 'Korlátlan csapattagok',
      description: 'Hívd meg annyi kollégát, amennyit szeretnél. Egyetlen előfizetés, teljes csapat.',
    },
    {
      icon: Zap,
      title: 'Azonnali megosztás',
      description: 'Email címmel azonnal meghívhatsz kollégákat. Nincs limit, nincs plusz költség.',
    },
    {
      icon: TrendingUp,
      title: 'Csapathaladás követés',
      description: 'Lásd, ki melyik kurzuson dolgozik, és mennyit haladt előre a csapatod.',
    },
    {
      icon: BarChart,
      title: 'Közös analitika',
      description: 'Részletes riportok a csapat tanulási aktivitásáról és eredményeiről.',
    },
    {
      icon: MessageCircle,
      title: 'Csapat kommunikáció',
      description: 'Megbeszélések, kérdések és válaszok egy helyen, kurzusonként.',
    },
    {
      icon: Shield,
      title: 'Biztonságos együttműködés',
      description: 'Teljes adatvédelem és biztonságos hozzáférés-kezelés minden csapattagnak.',
    },
  ];

  return (
    <section id="features-section" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Clean Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Csapatfunkciók
          </h2>
          <p className="text-xl text-gray-600">
            Egy előfizetés, korlátlan csapattagokkal. Oszd meg a tudást, haladj gyorsabban.
          </p>
        </div>

        {/* Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-white"
              >
                <CardContent className="p-8 space-y-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Simple Value Prop */}
        <div className="mt-20 bg-white rounded-2xl p-12 border border-gray-200 max-w-4xl mx-auto">
          <div className="text-center space-y-8">
            <h3 className="text-3xl font-bold text-gray-900">
              Spórolj akár milliókat évente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-5xl font-bold text-primary mb-2">15,000 Ft</p>
                <p className="text-gray-600">havi előfizetés</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-gray-900 mb-2">0 Ft</p>
                <p className="text-gray-600">plusz költség</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-gray-400 mb-2">∞</p>
                <p className="text-gray-600">csapattagok</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
