'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStripe } from '@/hooks/useStripe';
import { useAuth } from '@/hooks/useAuth';
import { 
  Loader2, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock,
  Users,
  Award,
  Sparkles,
  Lock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface EnhancedCheckoutButtonProps {
  courseId?: string;
  priceId?: string;
  mode: 'payment' | 'subscription';
  
  // Course/Product details
  title: string;
  originalPrice?: number;
  discountedPrice?: number;
  currency?: string;
  
  // Features and benefits
  features?: string[];
  enrollmentCount?: number;
  averageRating?: number;
  certificateIncluded?: boolean;
  lifetimeAccess?: boolean;
  
  // UI customization
  variant?: 'default' | 'primary' | 'premium';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  
  // Callbacks
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function EnhancedCheckoutButton({
  courseId,
  priceId,
  mode,
  title,
  originalPrice,
  discountedPrice,
  currency = 'HUF',
  features = [],
  enrollmentCount,
  averageRating,
  certificateIncluded,
  lifetimeAccess,
  variant = 'default',
  size = 'default',
  className,
  successUrl,
  cancelUrl,
  metadata,
  onSuccess,
  onError
}: EnhancedCheckoutButtonProps) {
  const { user } = useAuth();
  const { createCheckoutSession, isCreatingCheckout } = useStripe();
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const finalPrice = discountedPrice || originalPrice;
  const hasDiscount = originalPrice && discountedPrice && originalPrice > discountedPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice! - discountedPrice!) / originalPrice!) * 100)
    : 0;

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setError(null);

    try {
      const currentUrl = window.location.origin;
      const defaultSuccessUrl = courseId 
        ? `${currentUrl}/courses/${courseId}/learn?success=true`
        : `${currentUrl}/dashboard?success=true`;
      const defaultCancelUrl = courseId 
        ? `${currentUrl}/courses/${courseId}?cancelled=true`
        : `${currentUrl}?cancelled=true`;

      await createCheckoutSession.mutateAsync({
        courseId,
        priceId,
        mode,
        successUrl: successUrl || defaultSuccessUrl,
        cancelUrl: cancelUrl || defaultCancelUrl,
        metadata: {
          ...metadata,
          source: 'enhanced_checkout_button',
          variant,
          hasDiscount: hasDiscount.toString()
        }
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hiba történt a fizetés során';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Checkout error:', err);
    }
  };

  const formatAmount = (amount?: number, currency = 'HUF') => {
    if (!amount) return '';
    
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg';
      case 'premium':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl';
      default:
        return '';
    }
  };

  const getPriceDisplay = () => {
    if (!finalPrice) return null;

    return (
      <div className="flex items-center space-x-2">
        {hasDiscount && (
          <Badge variant="destructive" className="text-xs">
            -{discountPercentage}%
          </Badge>
        )}
        <div className="flex items-baseline space-x-2">
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatAmount(originalPrice, currency)}
            </span>
          )}
          <span className="text-lg font-bold">
            {formatAmount(finalPrice, currency)}
          </span>
        </div>
      </div>
    );
  };

  const getFeatureBadges = () => {
    const badges = [];
    
    if (certificateIncluded) {
      badges.push(
        <Badge key="cert" variant="secondary" className="text-xs">
          <Award className="w-3 h-3 mr-1" />
          Tanúsítvány
        </Badge>
      );
    }
    
    if (lifetimeAccess) {
      badges.push(
        <Badge key="lifetime" variant="secondary" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Élethosszig
        </Badge>
      );
    }
    
    if (enrollmentCount && enrollmentCount > 100) {
      badges.push(
        <Badge key="popular" variant="secondary" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {enrollmentCount}+ tanuló
        </Badge>
      );
    }

    return badges;
  };

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{title}</CardTitle>
            {getPriceDisplay()}
          </div>
          {variant === 'premium' && (
            <Sparkles className="w-6 h-6 text-purple-600" />
          )}
        </div>
        
        {/* Feature badges */}
        {getFeatureBadges().length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {getFeatureBadges()}
          </div>
        )}

        {/* Rating and enrollment info */}
        {(averageRating || enrollmentCount) && (
          <CardDescription className="flex items-center space-x-4 text-xs">
            {averageRating && (
              <span className="flex items-center">
                ⭐ {averageRating.toFixed(1)}
              </span>
            )}
            {enrollmentCount && enrollmentCount <= 100 && (
              <span className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {enrollmentCount} tanuló
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main CTA Button */}
        <Button
          onClick={handleCheckout}
          disabled={isCreatingCheckout || !user}
          size={size}
          className={cn("w-full", getVariantStyles())}
        >
          {isCreatingCheckout ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Betöltés...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {mode === 'subscription' ? 'Előfizetés indítása' : 'Vásárlás most'}
            </>
          )}
        </Button>

        {/* Features list */}
        {features.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? 'Kevesebb' : 'Részletek'} ▼
            </button>
            
            {showDetails && (
              <ul className="space-y-1 text-sm">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Trust indicators */}
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Biztonságos</span>
          </div>
          <div className="flex items-center space-x-1">
            <Lock className="h-3 w-3" />
            <span>SSL titkosítás</span>
          </div>
          <div className="flex items-center space-x-1">
            <CreditCard className="h-3 w-3" />
            <span>Visa, Mastercard</span>
          </div>
        </div>

        {/* Additional info for subscriptions */}
        {mode === 'subscription' && (
          <p className="text-xs text-muted-foreground text-center">
            Bármikor lemondható. Első hónap után {formatAmount(finalPrice, currency)}/hó.
          </p>
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <Alert>
            <AlertDescription className="text-center">
              A vásárláshoz először{' '}
              <a href="/login" className="font-medium underline">
                jelentkezzen be
              </a>
              {' '}vagy{' '}
              <a href="/register" className="font-medium underline">
                regisztráljon
              </a>
              .
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Preset variants for common use cases
export function CourseCheckoutButton(props: Omit<EnhancedCheckoutButtonProps, 'mode'>) {
  return <EnhancedCheckoutButton {...props} mode="payment" />;
}

export function SubscriptionCheckoutButton(props: Omit<EnhancedCheckoutButtonProps, 'mode'>) {
  return <EnhancedCheckoutButton {...props} mode="subscription" />;
}

export function PremiumCheckoutButton(props: Omit<EnhancedCheckoutButtonProps, 'variant'>) {
  return <EnhancedCheckoutButton {...props} variant="premium" />;
}