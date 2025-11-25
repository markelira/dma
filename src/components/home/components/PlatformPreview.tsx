'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FloatingCard } from './FloatingCard';

export function PlatformPreview() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Device Mockup */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Phone/Tablet Frame */}
        <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
          <div className="bg-white rounded-[2rem] overflow-hidden aspect-[9/16] md:aspect-[4/3]">
            {/* Screen Content - Placeholder for now */}
            <div className="w-full h-full bg-gradient-to-br from-dma-navy to-dma-navy-hover flex items-center justify-center">
              <div className="text-white text-center p-8">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2">DMA Platform</h3>
                <p className="text-sm opacity-80">Tartalom előnézet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Course Cards */}
        <FloatingCard delay={0} className="absolute -top-8 -right-8 hidden md:block">
          <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100 w-48">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-dma-red to-dma-red-hover rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  Marketing Alapok
                </p>
                <p className="text-xs text-gray-500">75% kész</p>
              </div>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard delay={1.5} className="absolute -bottom-8 -left-8 hidden md:block">
          <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100 w-48">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-dma-navy to-dma-navy-light rounded-lg flex items-center justify-center text-white font-bold">
                D
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  Design Masterclass
                </p>
                <p className="text-xs text-gray-500">Új</p>
              </div>
            </div>
          </div>
        </FloatingCard>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dma-cream/50 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
      </motion.div>
    </div>
  );
}

