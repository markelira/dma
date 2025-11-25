'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlatformPreview } from './components/PlatformPreview';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FFFAF5] pt-20 pb-12 md:pt-24 md:pb-16">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-dma-cream via-white to-dma-cream/50 opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center space-x-2 bg-dma-red/10 text-dma-red px-4 py-2 rounded-full text-sm font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span>✨</span>
              <span>Korlátlan csapattagok</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Tanulj csapattal,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-dma-red to-dma-red-hover">
                haladj gyorsabban
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Korlátlan videó hozzáférés, korlátlan csapattagokkal.
              Egy előfizetés, minden kollégád ingyen.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-dma-red text-white font-bold rounded-full shadow-lg hover:bg-dma-red-hover hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Próbáld ki ingyen 7 napig
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-dma-navy font-bold rounded-full border-2 border-dma-navy hover:bg-dma-navy hover:text-white transition-all duration-300 text-lg"
              >
                Árak megtekintése
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              className="flex flex-wrap items-center gap-6 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">10,000+</span>
                <span className="text-gray-600">felhasználó</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">500+</span>
                <span className="text-gray-600">tartalom</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">4.8/5</span>
                <span className="text-gray-600">értékelés</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Platform Preview */}
          <motion.div
            className="relative lg:pl-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <PlatformPreview />
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-dma-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-dma-navy/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
