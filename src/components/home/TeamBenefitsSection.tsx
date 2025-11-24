'use client';

import { motion } from 'framer-motion';
import { AnimatedSection } from './components/AnimatedSection';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '👥',
    title: 'Korlátlan csapattagok',
    description: 'Egy előfizetés, akárhány kollégád. Nincs extra költség.',
  },
  {
    icon: '📊',
    title: 'Közös haladás követése',
    description: 'Láthatod, ki melyik tartalmat csinálja, és hol tart a csapat.',
  },
  {
    icon: '💬',
    title: 'Csapat kommunikáció',
    description: 'Beszéljétek meg a tanultakat, oszd meg az észrevételeket.',
  },
  {
    icon: '🔒',
    title: 'Biztonságos együttműködés',
    description: 'Minden adat védett, GDPR-kompatibilis.',
  },
];

export function TeamBenefitsSection() {
  return (
    <AnimatedSection className="py-20 md:py-32 bg-gradient-to-br from-[#FFFAF5] via-white to-dma-navy/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <div className="inline-flex items-center space-x-2 bg-dma-red/10 text-dma-red px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <span>Csapatfunkciók</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Tanulj együtt a csapatoddal,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-dma-red to-dma-red-hover">
                  korlátlan tagokkal
                </span>
              </h2>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-dma-red/10 to-dma-red/5 rounded-xl flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Interactive Card */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
              {/* Team Dashboard Mockup */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Csapat áttekintés
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-dma-navy to-dma-navy-light rounded-full flex items-center justify-center text-white font-semibold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Csapattag {i}
                          </p>
                          <p className="text-xs text-gray-500">
                            {i === 1 ? 'Marketing Alapok - 75%' : i === 2 ? 'Design Masterclass - 45%' : 'Új tag'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Chart */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    Csapat haladása
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Tartalmak</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-dma-red to-dma-red-hover h-2 rounded-full"
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-dma-red to-dma-red-hover text-white rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold">150,000 Ft/hó</div>
                <div className="text-xs opacity-90">
                  Megtakarítás más
                  <br />
                  platformokhoz képest
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
