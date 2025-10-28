'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * UltraMinimalHero - Cluely-inspired minimal hero
 *
 * Design: Clean, centered, lots of white space
 * Color: DMA Navy for accents only
 * Typography: Large, bold, hierarchical
 */
export function UltraMinimalHero() {
  const router = useRouter();

  return (
    <section className="relative bg-white">
      <div className="container mx-auto px-6 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto text-center">

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            Tanulj csapattal,<br />
            <span className="text-primary">haladj gyorsabban</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-12 max-w-2xl mx-auto">
            Korlátlan videó hozzáférés. Korlátlan csapattagok.<br />
            Egy előfizetés, teljes csapat.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-10 py-7 text-lg rounded-lg transition-colors shadow-sm"
              onClick={() => router.push('/register')}
            >
              Próbáld ki ingyen
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-gray-700 hover:text-gray-900 font-semibold px-10 py-7 text-lg"
              onClick={() => router.push('/pricing')}
            >
              Árak megtekintése
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
