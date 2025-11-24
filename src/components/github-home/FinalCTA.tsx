'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AnimatedGlobe } from './shared/AnimatedGlobe';
import { GradientText } from './shared/GradientText';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#0D1117]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117] via-blue-950/10 to-[#0D1117]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-blue-600/10 rounded-full blur-[150px]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px] py-24 lg:py-32">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Animated Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-8"
          >
            <AnimatedGlobe size="xl" />
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-6 max-w-4xl"
          >
            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-white">A hely bárkinek</span>
              <br />
              <span className="text-white">bárhonnan, hogy</span>
              <br />
              <GradientText
                from="from-blue-400"
                via="via-purple-500"
                to="to-pink-500"
              >
                bármit megtanuljon
              </GradientText>
            </h2>

            <p className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto">
              Kezdd el a tanulást ma. Csatlakozz 56,000+ hallgatóhoz.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="group bg-white text-black hover:bg-gray-100 text-base px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-semibold"
            >
              Kezdd el ingyen
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 text-base px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-semibold"
            >
              Kapcsolat
            </Button>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 pt-16"
          >
            <a href="#" className="hover:text-gray-300 transition-colors">Platform</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Tartalmak</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Árazás</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Dokumentáció</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Támogatás</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Karrier</a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
