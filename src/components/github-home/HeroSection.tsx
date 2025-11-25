'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AnimatedGlobe } from './shared/AnimatedGlobe';
import { GradientText } from './shared/GradientText';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#0D1117]">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/20 via-purple-950/10 to-[#0D1117]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-secondary/10 rounded-full blur-[120px]" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px] py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                Csatlakozz 50,000+ tanulóhoz
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl lg:text-6xl font-bold leading-tight"
            >
              <span className="text-white">Tanulj új</span>
              <br />
              <span className="text-white">készségeket</span>
              <br />
              <GradientText
                from="from-brand-secondary"
                via="via-purple-500"
                to="to-pink-500"
                className="inline-block"
              >
                innen
              </GradientText>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg lg:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0"
            >
              Fejleszd készségeidet videók, projektek és csapatmunka révén.
              Kezdj el ma tanulni korlátlan hozzáféréssel.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              {/* Primary CTA */}
              <Button
                size="lg"
                className="group bg-white text-black hover:bg-gray-100 text-base px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-bold"
              >
                Kezdd el ingyen
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Secondary CTA */}
              <Button
                size="lg"
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 text-base px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-bold"
              >
                Árak megtekintése
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap gap-8 justify-center lg:justify-start pt-8 border-t border-gray-800"
            >
              <div>
                <div className="text-2xl font-bold text-white">56,000+</div>
                <div className="text-sm text-gray-500">Hallgató</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">200+</div>
                <div className="text-sm text-gray-500">Tartalom</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-sm text-gray-500">Értékelés</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Animated globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative hidden lg:flex justify-center items-center"
          >
            <AnimatedGlobe size="xl" />

            {/* Floating cards around globe */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute top-20 left-0 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4 shadow-2xl max-w-[200px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-secondary/50 to-purple-500" />
                <div>
                  <div className="text-xs text-gray-400">Éppen tanul</div>
                  <div className="text-sm font-bold text-white">3,429 hallgató</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="absolute bottom-20 right-0 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4 shadow-2xl max-w-[200px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
                <div>
                  <div className="text-xs text-gray-400">Ma befejezett</div>
                  <div className="text-sm font-bold text-white">892 tartalom</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0D1117] to-transparent" />
    </section>
  );
}
