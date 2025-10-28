'use client';

import React from 'react';
import { Users, Zap, TrendingUp, Shield, MessageCircle, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

/**
 * TeamBenefitsSection - Highlights team collaboration features
 * Key differentiator: Unlimited team members with single subscription
 */
export function TeamBenefitsSection() {
  const benefits = [
    {
      icon: Users,
      title: 'Korlátlan csapattagok',
      description: 'Hívd meg annyi kollégát, amennyit szeretnél. Egyetlen előfizetés, teljes csapat.',
      gradient: 'from-teal-500 to-teal-700',
    },
    {
      icon: Zap,
      title: 'Azonnali megosztás',
      description: 'Email címmel azonnal meghívhatsz kollégákat. Nincs limit, nincs plusz költség.',
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      icon: TrendingUp,
      title: 'Csapathaladás követés',
      description: 'Lásd, ki melyik kurzuson dolgozik, és mennyit haladt előre a csapatod.',
      gradient: 'from-purple-500 to-purple-700',
    },
    {
      icon: BarChart,
      title: 'Közös analitika',
      description: 'Részletes riportok a csapat tanulási aktivitásáról és eredményeiről.',
      gradient: 'from-orange-500 to-cyan-700',
    },
    {
      icon: MessageCircle,
      title: 'Csapat kommunikáció',
      description: 'Megbeszélések, kérdések és válaszok egy helyen, kurzusonként.',
      gradient: 'from-green-500 to-green-700',
    },
    {
      icon: Shield,
      title: 'Biztonságos együttműködés',
      description: 'Teljes adatvédelem és biztonságos hozzáférés-kezelés minden csapattagnak.',
      gradient: 'from-blue-500 to-red-700',
    },
  ];

  return (
    <section id="features-section" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-2 bg-gray-50 text-primary rounded-full text-sm font-semibold mb-4">
            Csapatfunkciók
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Tanulj együtt a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
              csapatoddal
            </span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Egy előfizetés, korlátlan csapattagokkal. Oszd meg a tudást, haladj gyorsabban, spórolj nagyot.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-gray-200 hover:shadow-lg hover:border-red-200 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6 space-y-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
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
              </motion.div>
            );
          })}
        </div>

        {/* Team Value Proposition */}
        <motion.div
          className="mt-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 lg:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Spórolj akár milliókat évente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <p className="text-4xl font-bold text-primary mb-2">15,000 Ft</p>
                <p className="text-gray-600">havi előfizetés</p>
                <p className="text-sm text-gray-500 mt-2">Korlátlan tagokkal</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <p className="text-4xl font-bold text-gray-900 mb-2">0 Ft</p>
                <p className="text-gray-600">plusz költség</p>
                <p className="text-sm text-gray-500 mt-2">Minden további tagért</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <p className="text-4xl font-bold text-dma-gold mb-2">∞</p>
                <p className="text-gray-600">csapattagok</p>
                <p className="text-sm text-gray-500 mt-2">Nincs limit</p>
              </div>
            </div>
            <p className="text-gray-700 text-lg mt-6">
              Más platformokon 10 fő után már <span className="font-bold text-gray-600 line-through">150,000 Ft/hó</span> lenne.
              DMA.hu-nál <span className="font-bold text-primary">mindig csak 15,000 Ft/hó</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
