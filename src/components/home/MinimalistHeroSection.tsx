'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

/**
 * MinimalistHeroSection - Clean, Corporate, Professional
 * Single color: DMA Navy (#2C3E54)
 * Minimalist design, no decorations, clean typography
 */
export function MinimalistHeroSection() {
  const router = useRouter();

  return (
    <section className="relative bg-white">
      <div className="container mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">

          {/* LEFT COLUMN - Clean Typography */}
          <div className="space-y-8">
            {/* Simple Badge */}
            <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-gray-600">DMA.hu Videókurzus Platform</span>
            </div>

            {/* Clean Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                Tanulj csapattal,
                <br />
                <span className="text-primary">haladj gyorsabban</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Korlátlan videó hozzáférés, korlátlan csapattagokkal.
                Egy előfizetés, teljes csapat.
              </p>
            </div>

            {/* Clean Feature List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-gray-700">Korlátlan csapattagok egyetlen előfizetéssel</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-gray-700">Prémium videókurzusok streaming</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-gray-700">7 napos ingyenes próba</span>
              </div>
            </div>

            {/* Simple CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 text-base rounded-lg transition-colors"
                onClick={() => router.push('/register')}
              >
                Próbáld ki ingyen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-6 text-base rounded-lg"
                onClick={() => router.push('/pricing')}
              >
                Árak megtekintése
              </Button>
            </div>

            {/* Simple Stats */}
            <div className="flex items-center gap-8 pt-6 text-sm text-gray-500 border-t border-gray-200">
              <div>
                <span className="block text-2xl font-bold text-gray-900">10,000+</span>
                <span>aktív felhasználó</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900">500+</span>
                <span>videókurzus</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900">4.8/5</span>
                <span>értékelés</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Clean Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <Image
                src="/images/dmahero.png"
                alt="DMA.hu Platform"
                width={600}
                height={400}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
