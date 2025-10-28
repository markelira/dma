'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Play, Users, TrendingUp, Award, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * ConsumerHeroSection - B2C focused hero for DMA.hu MVP
 * Emphasizes: Team collaboration, Netflix-style platform, consumer benefits
 * Removes: B2B2C elements (universities, company size, service models)
 */
export function ConsumerHeroSection() {
  const router = useRouter();

  const scrollToNext = () => {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-[#f8f9fa] via-white to-[#e0f2f1]">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-6 py-16 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">

          {/* LEFT COLUMN - Value Proposition & CTAs */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Eyebrow Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-gray-50 text-primary px-4 py-2 rounded-full text-sm font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="animate-pulse w-2 h-2 bg-primary rounded-full"></span>
              <span>DMA.hu - Videókurzus Platform</span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Tanulj csapattal,{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
                    haladj gyorsabban
                  </span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 8C50 3 100 3 150 8C200 13 250 3 298 8"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2C3E54" />
                        <stop offset="100%" stopColor="#1e2a37" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mt-6 leading-relaxed">
                <span className="font-semibold text-gray-900">Korlátlan videó hozzáférés</span>,
                korlátlan csapattagokkal. Egy előfizetés, minden kollégád ingyen.
              </p>
            </motion.div>

            {/* Value Props */}
            <motion.ul
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-gray-900 font-semibold">Hívd meg a csapatodat</span>
                  <p className="text-gray-600 text-sm">Annyi kollégát, amennyit szeretnél - egyetlen előfizetéssel</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-gray-900 font-semibold">Netflix-stílusú platform</span>
                  <p className="text-gray-600 text-sm">Prémium videókurzusok streaming, bármikor, bárhol</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-gray-900 font-semibold">7 napos ingyenes próba</span>
                  <p className="text-gray-600 text-sm">Kipróbálás nélkül, bármikor lemondható</p>
                </div>
              </li>
            </motion.ul>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                onClick={() => router.push('/register')}
              >
                <span>Próbáld ki ingyen 7 napig</span>
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-gray-50 font-semibold px-8 py-6 text-lg rounded-full"
                onClick={() => router.push('/pricing')}
              >
                Árak megtekintése
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              className="flex flex-wrap items-center gap-6 pt-6 text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900">10,000+</span>
                <span>aktív felhasználó</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900">500+</span>
                <span>videókurzus</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900">4.8/5</span>
                <span>értékelés</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Platform Preview */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            {/* Decorative blob */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-3xl blur-2xl opacity-40 animate-pulse" />

            {/* Platform Preview Card */}
            <div className="relative">
              <motion.div
                className="relative overflow-hidden rounded-2xl shadow-2xl border border-gray-200 bg-white"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/images/dmahero.png"
                  alt="DMA.hu Videókurzus Platform"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform hover:scale-110 transition-transform cursor-pointer shadow-xl">
                    <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
              </motion.div>

              {/* Team Members Indicator */}
              <motion.div
                className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4 border border-gray-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-primary border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                      A
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-cyan-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                      B
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                      C
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs">
                      +5
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Csapatod tanul</p>
                    <p className="text-xs text-gray-600">8 aktív tag ma</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 hover:text-primary transition-colors animate-bounce"
        aria-label="Scroll to features"
      >
        <ChevronDown size={32} />
      </button>
    </section>
  );
}
