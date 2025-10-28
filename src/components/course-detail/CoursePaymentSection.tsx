'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCheckoutButton } from '@/components/payment/EnhancedCheckoutButton';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { 
  CreditCard, 
  Crown, 
  Clock, 
  Users, 
  Award, 
  Check,
  Sparkles,
  Gift,
  Calculator,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoursePaymentSectionProps {
  courseId: string;
  courseTitle: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  isEnrolled?: boolean;
  enrollmentCount?: number;
  averageRating?: number;
  estimatedDuration?: number; // in minutes
  features?: string[];
  instructorName?: string;
  certificateIncluded?: boolean;
  lifetimeAccess?: boolean;
  downloadableResources?: boolean;
  mobileAccess?: boolean;
  className?: string;
}

export function CoursePaymentSection({
  courseId,
  courseTitle,
  price,
  originalPrice,
  currency = 'HUF',
  isEnrolled = false,
  enrollmentCount,
  averageRating,
  estimatedDuration,
  features = [],
  instructorName,
  certificateIncluded = true,
  lifetimeAccess = true,
  downloadableResources = true,
  mobileAccess = true,
  className
}: CoursePaymentSectionProps) {
  const { user } = useAuth();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const [activeTab, setActiveTab] = useState('purchase');

  const hasActiveSubscription = subscriptionStatus?.isActive;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercentage = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ó ${mins}p` : `${mins}p`;
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount);
  };

  const courseFeatures = [
    ...(features.length > 0 ? features : [
      'Teljes kurzus hozzáférés',
      'Strukturált tananyag',
      'Gyakorlati feladatok',
      'Közösségi támogatás'
    ]),
    ...(certificateIncluded ? ['Befejezési tanúsítvány'] : []),
    ...(lifetimeAccess ? ['Élethosszig tartó hozzáférés'] : []),
    ...(downloadableResources ? ['Letölthető anyagok'] : []),
    ...(mobileAccess ? ['Mobil hozzáférés'] : [])
  ];

  // If user already enrolled, show access info
  if (isEnrolled) {
    return (
      <Card className={cn("sticky top-4", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <Check className="w-5 h-5" />
            <span>Beiratkozva</span>
          </CardTitle>
          <CardDescription>
            Már hozzáfér ehhez a kurzushoz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <a href={`/courses/${courseId}/learn`}>
              Tanulás folytatása
            </a>
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Kurzus megkezdése vagy folytatása</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has active subscription and course is included
  if (hasActiveSubscription) {
    return (
      <Card className={cn("sticky top-4 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-600">
            <Crown className="w-5 h-5" />
            <span>Előfizetés előny</span>
          </CardTitle>
          <CardDescription>
            Ez a kurzus része az aktív előfizetésének
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
            <a href={`/courses/${courseId}/learn`}>
              <Sparkles className="w-4 h-4 mr-2" />
              Ingyenes hozzáférés
            </a>
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Előfizetés előny - további költség nélkül</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("sticky top-4", className)}>
      <CardHeader className="pb-4">
        <div className="space-y-2">
          {hasDiscount && (
            <Badge variant="destructive" className="w-fit">
              <Gift className="w-3 h-3 mr-1" />
              {discountPercentage}% kedvezmény
            </Badge>
          )}
          
          <div className="flex items-baseline space-x-2">
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(originalPrice!)}
              </span>
            )}
            <span className="text-3xl font-bold">
              {formatPrice(price)}
            </span>
          </div>
        </div>

        {/* Course stats */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {enrollmentCount && (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{enrollmentCount.toLocaleString()} tanuló</span>
            </div>
          )}
          {averageRating && (
            <div className="flex items-center space-x-1">
              <span>⭐</span>
              <span>{averageRating.toFixed(1)}</span>
            </div>
          )}
          {estimatedDuration && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(estimatedDuration)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase">Kurzus vásárlás</TabsTrigger>
            <TabsTrigger value="subscription">Előfizetés</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-4 mt-4">
            <EnhancedCheckoutButton
              courseId={courseId}
              mode="payment"
              title="Kurzus vásárlása"
              discountedPrice={price}
              originalPrice={originalPrice}
              currency={currency}
              features={courseFeatures}
              enrollmentCount={enrollmentCount}
              averageRating={averageRating}
              certificateIncluded={certificateIncluded}
              lifetimeAccess={lifetimeAccess}
              variant="primary"
              size="lg"
              metadata={{
                courseId,
                courseTitle,
                instructorName: instructorName || '',
                purchaseType: 'single_course'
              }}
            />

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Mit kap:</h4>
              <ul className="space-y-2">
                {courseFeatures.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {courseFeatures.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{courseFeatures.length - 5} további előny...
                </p>
              )}
            </div>

            {/* One-time purchase benefits */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-blue-800">
                <Calculator className="w-4 h-4" />
                <span>Egyszeri vásárlás előnyei</span>
              </div>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Nincs havi díj</li>
                <li>• Élethosszig hozzáférés</li>
                <li>• Minden frissítés ingyen</li>
                <li>• Letölthető tartalmak</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Korlátlan hozzáférés</h3>
                <p className="text-sm text-muted-foreground">
                  Hozzáférés az összes kurzushoz és prémium tartalmakhoz
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 border rounded-lg">
                  <div className="text-lg font-bold">5 990 Ft</div>
                  <div className="text-xs text-muted-foreground">/ hónap</div>
                </div>
                <div className="p-3 border rounded-lg bg-purple-50 border-purple-200">
                  <div className="text-lg font-bold text-purple-600">4 790 Ft</div>
                  <div className="text-xs text-purple-600">/ hónap (éves)</div>
                </div>
              </div>

              <Button 
                asChild 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                size="lg"
              >
                <a href="/subscribe">
                  <Crown className="w-4 h-4 mr-2" />
                  Előfizetés választása
                </a>
              </Button>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Előfizetéssel jár:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Korlátlan kurzus hozzáférés</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Új kurzusok automatikusan</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Prémium tartalmak</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Prioritás támogatás</span>
                  </li>
                </ul>
              </div>

              {/* Subscription comparison */}
              <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-purple-800">
                  <Sparkles className="w-4 h-4" />
                  <span>Előfizetés vs. Egyszeri vásárlás</span>
                </div>
                <div className="text-xs text-purple-700 space-y-1">
                  <p>• Csak 2 kurzus vásárlása = 1 havi előfizetés ára</p>
                  <p>• 50+ kurzus azonnal elérhető</p>
                  <p>• Új kurzusok havonta</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Security notice */}
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground pt-4 border-t">
          <Shield className="w-3 h-3" />
          <span>Biztonságos fizetés SSL titkosítással</span>
        </div>

        {/* Money back guarantee */}
        <div className="text-center text-xs text-muted-foreground">
          30 napos pénzvisszafizetési garancia
        </div>

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            A vásárláshoz{' '}
            <a href="/login" className="font-medium text-primary underline">
              jelentkezzen be
            </a>
            {' '}vagy{' '}
            <a href="/register" className="font-medium text-primary underline">
              regisztráljon
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}