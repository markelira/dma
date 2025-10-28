'use client';

import { PremiumHeader } from "@/components/PremiumHeader";
import { UltraMinimalHero } from "@/components/home/UltraMinimalHero";
import { PremiumFooter } from "@/components/PremiumFooter";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * DMA.hu HOMEPAGE - Ultra Minimal, Cluely-inspired
 *
 * Design System:
 * ✅ Single color: DMA Navy (#2C3E54)
 * ✅ Clean typography with Titillium Web
 * ✅ Ultra minimalist - hero only
 * ✅ Lots of white space
 * ✅ Centered, clean layout
 * ✅ Cluely.com aesthetic
 *
 * Target: Professional teams seeking clean, simple, trustworthy platform
 */
export default function Home() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <PremiumHeader />
        <main className="flex-1">
          {/* Ultra Minimal Hero - Cluely-inspired */}
          <UltraMinimalHero />
        </main>
        <PremiumFooter />
      </div>
    </AuthProvider>
  );
}
