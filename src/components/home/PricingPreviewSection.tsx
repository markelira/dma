'use client';

import React from 'react';
import { Check, Crown, Zap, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

/**
 * PricingPreviewSection - Quick pricing overview on homepage
 * Drives users to /pricing for full SubscriptionPlans component
 */
export function PricingPreviewSection() {
  const router = useRouter();

  const plans = [
    {
      id: 'monthly',
      name: 'Havi előfizetés',
      price: 15000,
      period: '/hó',
      icon: Clock,
      color: 'gray',
      features: ['Korlátlan videók', 'Korlátlan csapattagok', 'Mobil & Desktop'],
    },
    {
      id: '6-month',
      name: '6 hónapos csomag',
      price: 81000,
      originalPrice: 90000,
      savings: 9000,
      savingsPercent: 10,
      period: '/ 6 hónap',
      icon: Zap,
      color: 'blue',
      popular: true,
      features: ['Minden havi előfizetés', '10% megtakarítás', 'Prioritás támogatás'],
    },
    {
      id: '12-month',
      name: '12 hónapos csomag',
      price: 158400,
      originalPrice: 180000,
      savings: 21600,
      savingsPercent: 12,
      period: '/ 12 hónap',
      icon: Crown,
      color: 'purple',
      premium: true,
      features: ['Minden 6 hónapos funkció', '12% megtakarítás', 'Prémium támogatás'],
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-2 bg-gray-50 text-primary rounded-full text-sm font-semibold mb-4">
            Egyszerű árazás
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Válassz csomagot,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
              spórolj többet
            </span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Minden csomag tartalmazza az összes funkciót. A különbség csak a fizetési periódusban van.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gray-500 text-white px-4 py-1 text-xs font-semibold">
                      Legnépszerűbb
                    </Badge>
                  </div>
                )}

                {/* Premium Badge */}
                {plan.premium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-4 py-1 text-xs font-semibold">
                      Legjobb érték
                    </Badge>
                  </div>
                )}

                <Card
                  className={`h-full ${
                    plan.popular
                      ? 'border-blue-300 shadow-xl scale-105'
                      : plan.premium
                      ? 'border-purple-300 shadow-lg'
                      : 'border-gray-200'
                  } hover:shadow-2xl transition-all duration-300`}
                >
                  <CardContent className="p-8 space-y-6">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          plan.color === 'blue'
                            ? 'bg-blue-100'
                            : plan.color === 'purple'
                            ? 'bg-purple-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            plan.color === 'blue'
                              ? 'text-blue-600'
                              : plan.color === 'purple'
                              ? 'text-purple-600'
                              : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2">
                      {plan.originalPrice && (
                        <p className="text-lg text-gray-400 line-through">
                          {formatPrice(plan.originalPrice)}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <p className="text-4xl font-bold text-gray-900">
                          {formatPrice(plan.price)}
                        </p>
                        <span className="text-gray-600">{plan.period}</span>
                      </div>
                      {plan.savings && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            plan.premium ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          Spórolj {formatPrice(plan.savings)} ({plan.savingsPercent}%)
                        </Badge>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-gray-700">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className={`w-full ${
                        plan.popular || plan.premium
                          ? 'bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary'
                          : 'bg-gray-900 hover:bg-gray-800'
                      } text-white font-semibold py-6 text-base`}
                      onClick={() => router.push('/register')}
                    >
                      Kezdd el most
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* View Full Pricing CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            variant="outline"
            size="lg"
            className="group border-2 border-primary text-primary hover:bg-gray-50 font-semibold px-8 py-6 text-base"
            onClick={() => router.push('/pricing')}
          >
            Részletes árazás megtekintése
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* 7-day trial highlight */}
        <motion.div
          className="mt-12 text-center bg-gray-50 rounded-2xl p-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-lg text-gray-800">
            <span className="font-bold text-primary">7 napos ingyenes próba</span> minden csomaghoz.
            Nincs kötelezettség, bármikor lemondható.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
