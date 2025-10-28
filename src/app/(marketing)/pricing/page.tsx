'use client';

import { PremiumHeader } from "@/components/PremiumHeader";
import { SubscriptionPlans } from "@/components/payment/SubscriptionPlans";
import { PremiumFooter } from "@/components/PremiumFooter";
import { AuthProvider } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Pricing Page - Full subscription plans with detailed features
 * Uses the complete SubscriptionPlans component with all DMA.hu pricing
 */
export default function PricingPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <PremiumHeader />
        <main className="py-16">
          {/* Page Header */}
          <motion.div
            className="container mx-auto px-6 text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold mb-4">
              Egyszerű, átlátható árazás
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Válassza ki az Önnek{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-800">
                megfelelő előfizetést
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Minden csomag tartalmazza az összes funkciót. Hosszabb előfizetéssel többet spórolhat.
            </p>

            {/* Key value props */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                <span>7 napos ingyenes próba</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                <span>Korlátlan csapattagok</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                <span>Bármikor lemondható</span>
              </div>
            </div>
          </motion.div>

          {/* Full Subscription Plans Component */}
          <div className="container mx-auto px-6">
            <SubscriptionPlans />
          </div>

          {/* Additional Value Section */}
          <motion.div
            className="container mx-auto px-6 mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-8 lg:p-12">
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 text-center">
                  Miért válassza a DMA.hu-t?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Gyakorlati tudás</h3>
                    <p className="text-gray-600 text-sm">
                      Videókurzusok szakértőktől, valós projektekkel és azonnali alkalmazhatósággal.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-4xl mb-3">👥</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Csapat együttműködés</h3>
                    <p className="text-gray-600 text-sm">
                      Korlátlan tagok egyetlen előfizetéssel. Tanuljatok együtt, haladjatok gyorsabban.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-4xl mb-3">💰</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Legjobb ár-érték arány</h3>
                    <p className="text-gray-600 text-sm">
                      Spóroljon akár 12%-ot éves előfizetéssel. Nincs rejtett költség.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
        <PremiumFooter />
      </div>
    </AuthProvider>
  );
}
