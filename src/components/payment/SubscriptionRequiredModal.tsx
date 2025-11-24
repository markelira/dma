'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedCheckoutButton } from './EnhancedCheckoutButton';
import {
  Check,
  Star,
  Zap,
  Crown,
  Users,
  Clock,
  Shield,
  Award,
  Sparkles,
  X as CloseIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  originalPrice?: number;
  currency: string;
  interval: 'month' | 'year';
  popular?: boolean;
  premium?: boolean;
  features: PlanFeature[];
  limits: {
    courses?: number | 'unlimited';
    certificates?: boolean;
    support?: 'basic' | 'priority' | 'premium';
    downloads?: boolean;
    mobileAccess?: boolean;
  };
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Havi előfizetés',
    description: 'Havi rugalmas előfizetés',
    priceId: 'price_1SNAlsGe8tBqGEXM8vEOVhgY',
    price: 15000,
    currency: 'HUF',
    interval: 'month',
    features: [
      { name: 'Korlátlan videó hozzáférés', included: true },
      { name: 'Összes akadémiai sorozat', included: true },
      { name: 'Korlátlan csapattagok', included: true },
      { name: 'Előrehaladás nyomon követése', included: true },
      { name: 'Mobil és asztali hozzáférés', included: true },
      { name: 'Tanúsítványok', included: true }
    ],
    limits: {
      courses: 'unlimited',
      certificates: true,
      support: 'priority',
      downloads: true,
      mobileAccess: true
    }
  },
  {
    id: '6-month',
    name: '6 hónapos csomag',
    description: 'Félévs és spórolj 10%-ot',
    priceId: 'price_1SNAlsGe8tBqGEXMrzFW59z5',
    price: 81000,
    originalPrice: 90000,
    currency: 'HUF',
    interval: 'month',
    popular: true,
    features: [
      { name: 'Korlátlan videó hozzáférés', included: true },
      { name: 'Összes akadémiai sorozat', included: true },
      { name: 'Korlátlan csapattagok', included: true },
      { name: 'Előrehaladás nyomon követése', included: true },
      { name: 'Mobil és asztali hozzáférés', included: true },
      { name: 'Tanúsítványok', included: true }
    ],
    limits: {
      courses: 'unlimited',
      certificates: true,
      support: 'priority',
      downloads: true,
      mobileAccess: true
    }
  },
  {
    id: '12-month',
    name: '12 hónapos csomag',
    description: 'Éves előfizetés és spórolj 12%-ot',
    priceId: 'price_1SNAlsGe8tBqGEXMR98t1RJX',
    price: 158400,
    originalPrice: 180000,
    currency: 'HUF',
    interval: 'month',
    premium: true,
    features: [
      { name: 'Korlátlan videó hozzáférés', included: true },
      { name: 'Összes akadémiai sorozat', included: true },
      { name: 'Korlátlan csapattagok', included: true },
      { name: 'Előrehaladás nyomon követése', included: true },
      { name: 'Mobil és asztali hozzáférés', included: true },
      { name: 'Tanúsítványok', included: true }
    ],
    limits: {
      courses: 'unlimited',
      certificates: true,
      support: 'premium',
      downloads: true,
      mobileAccess: true
    }
  }
];

interface SubscriptionRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName?: string;
  returnTo?: string;
}

export function SubscriptionRequiredModal({
  open,
  onOpenChange,
  courseName,
  returnTo
}: SubscriptionRequiredModalProps) {
  const formatPrice = (price: number, originalPrice: number | undefined, currency: string) => {
    const formatter = new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    });

    return {
      amount: formatter.format(price),
      originalAmount: originalPrice ? formatter.format(originalPrice) : null,
      savings: originalPrice ? originalPrice - price : 0,
      savingsPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
    };
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'monthly':
        return <Clock className="w-5 h-5" />;
      case '6-month':
        return <Zap className="w-5 h-5" />;
      case '12-month':
        return <Crown className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getPlanCardStyles = (plan: SubscriptionPlan) => {
    if (plan.premium) {
      return 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50';
    }
    if (plan.popular) {
      return 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50';
    }
    return 'border-border';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Előfizetés szükséges
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {courseName ? (
              <>
                A <span className="font-semibold text-foreground">{courseName}</span> tartalomhoz való hozzáféréshez aktív előfizetés szükséges.
              </>
            ) : (
              'A tartalmakhoz való hozzáféréshez aktív előfizetés szükséges.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Benefits highlight */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900">Miért érdemes előfizetni?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Korlátlan hozzáférés <strong>MINDEN</strong> tartalomhoz</li>
                  <li>• 7 napos ingyenes próbaidőszak</li>
                  <li>• Bármikor lemondható</li>
                  <li>• Tanúsítványok minden elvégzett tartalomhoz</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionPlans.map((plan) => {
              const pricing = formatPrice(plan.price, plan.originalPrice, plan.currency);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md",
                    getPlanCardStyles(plan)
                  )}
                >
                  {/* Badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-0.5 text-xs font-medium rounded-bl-lg">
                      <Star className="w-3 h-3 inline mr-1" />
                      Legnépszerűbb
                    </div>
                  )}
                  {plan.premium && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 text-xs font-medium rounded-bl-lg">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Prémium
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      plan.premium ? "bg-purple-100 text-purple-600" :
                      plan.popular ? "bg-blue-100 text-blue-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {getPlanIcon(plan.id)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{plan.name}</h4>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2">
                      {pricing.originalAmount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {pricing.originalAmount}
                        </span>
                      )}
                      <span className="text-2xl font-bold">
                        {pricing.amount}
                      </span>
                    </div>
                    {plan.id === 'monthly' && (
                      <p className="text-xs text-muted-foreground">/hónap</p>
                    )}
                    {plan.id === '6-month' && (
                      <div className="space-y-1 mt-1">
                        <p className="text-xs text-muted-foreground">6 hónapra egyszerre</p>
                        {pricing.savingsPercent > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            -{pricing.savingsPercent}% megtakarítás
                          </Badge>
                        )}
                      </div>
                    )}
                    {plan.id === '12-month' && (
                      <div className="space-y-1 mt-1">
                        <p className="text-xs text-muted-foreground">12 hónapra egyszerre</p>
                        {pricing.savingsPercent > 0 && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            -{pricing.savingsPercent}% megtakarítás
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-4 text-xs">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature.name}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <EnhancedCheckoutButton
                    priceId={plan.priceId}
                    mode="subscription"
                    title={`${plan.name} előfizetés`}
                    discountedPrice={plan.price}
                    originalPrice={plan.originalPrice}
                    currency={plan.currency}
                    variant={plan.premium ? 'premium' : plan.popular ? 'primary' : 'default'}
                    features={plan.features.filter(f => f.included).map(f => f.name)}
                    metadata={{
                      planId: plan.id,
                      planName: plan.name,
                      interval: 'month',
                      returnTo: returnTo || ''
                    }}
                    className="w-full text-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center flex-wrap gap-4 pt-2 text-xs text-muted-foreground border-t">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>30 napos garancia</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>10,000+ felhasználó</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Tanúsított tartalmak</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
