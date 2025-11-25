'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

/**
 * MinimalistPricingSection - Clean, Professional Pricing
 * Single color: DMA Navy, simple cards, clear pricing
 */
export function MinimalistPricingSection() {
  const router = useRouter();

  const plans = [
    {
      id: 'monthly',
      name: 'Havi előfizetés',
      price: 15000,
      period: '/hó',
      features: ['Korlátlan videók', 'Korlátlan csapattagok', 'Teljes hozzáférés'],
    },
    {
      id: '6-month',
      name: '6 hónapos csomag',
      price: 81000,
      originalPrice: 90000,
      savings: 9000,
      period: '/ 6 hónap',
      popular: true,
      features: ['Minden havi funkció', '10% megtakarítás', 'Prioritás támogatás'],
    },
    {
      id: '12-month',
      name: '12 hónapos csomag',
      price: 158400,
      originalPrice: 180000,
      savings: 21600,
      period: '/ 12 hónap',
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
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Clean Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Egyszerű árazás
          </h2>
          <p className="text-xl text-gray-600">
            Minden csomag tartalmazza az összes funkciót. Válassz fizetési periódust.
          </p>
        </div>

        {/* Clean Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border-2 ${
                plan.popular
                  ? 'border-primary shadow-xl'
                  : 'border-gray-200'
              } hover:border-primary hover:shadow-lg transition-all duration-300 bg-white`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                    Legnépszerűbb
                  </span>
                </div>
              )}

              <CardContent className="p-8 space-y-6">
                {/* Plan Name */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  {plan.originalPrice && (
                    <p className="text-lg text-gray-400 line-through">
                      {formatPrice(plan.originalPrice)}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </p>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-gray-600">
                      Megtakarítás: {formatPrice(plan.savings)}
                    </p>
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
                    plan.popular
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-gray-900 hover:bg-gray-800'
                  } text-white font-bold py-6 text-base rounded-lg`}
                  onClick={() => router.push('/register')}
                >
                  Kezdd el most
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Simple CTA */}
        <div className="text-center mt-16">
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold px-8 py-6 text-base rounded-lg"
            onClick={() => router.push('/pricing')}
          >
            Részletes árazás
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Trial Info */}
        <div className="mt-12 text-center bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto">
          <p className="text-lg text-gray-700">
            <span className="font-bold text-gray-900">7 napos ingyenes próba</span> minden csomaghoz.
            Bármikor lemondható.
          </p>
        </div>
      </div>
    </section>
  );
}
