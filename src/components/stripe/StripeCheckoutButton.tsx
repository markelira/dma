'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStripe } from '@/hooks/useStripe';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripeCheckoutButtonProps {
  courseId?: string;
  priceId?: string;
  mode: 'payment' | 'subscription';
  amount?: number;
  currency?: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export function StripeCheckoutButton({
  courseId,
  priceId,
  mode,
  amount,
  currency = 'HUF',
  title,
  description,
  className,
  variant = 'default',
  size = 'default',
  successUrl,
  cancelUrl,
  metadata
}: StripeCheckoutButtonProps) {
  const { user } = useAuth();
  const { createCheckoutSession, isCreatingCheckout } = useStripe();
  const [error, setError] = useState<string | null>(null);

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
        metadata
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hiba történt a fizetés során';
      setError(errorMessage);
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

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button
        onClick={handleCheckout}
        disabled={isCreatingCheckout || !user}
        variant={variant}
        size={size}
        className={className}
      >
        {isCreatingCheckout ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Betöltés...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {title}
            {amount && (
              <span className="ml-2 font-semibold">
                {formatAmount(amount, currency)}
              </span>
            )}
          </>
        )}
      </Button>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Trust indicators */}
      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Biztonságos fizetés</span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>SSL titkosítás</span>
        </div>
        <div className="flex items-center space-x-1">
          <CreditCard className="h-3 w-3" />
          <span>Visa, Mastercard</span>
        </div>
      </div>
    </div>
  );
}

// Example usage component for course purchase
interface CoursePurchaseButtonProps {
  courseId: string;
  courseTitle: string;
  price: number;
  currency?: string;
  className?: string;
}

export function CoursePurchaseButton({
  courseId,
  courseTitle,
  price,
  currency = 'HUF',
  className
}: CoursePurchaseButtonProps) {
  return (
    <StripeCheckoutButton
      courseId={courseId}
      mode="payment"
      amount={price}
      currency={currency}
      title="Tartalom vásárlása"
      description={`${courseTitle} tartalom megvásárlása és azonnali hozzáférés`}
      className={className}
      size="lg"
      metadata={{
        courseId,
        courseTitle,
        purchaseType: 'course'
      }}
    />
  );
}

// Example usage component for subscription
interface SubscriptionButtonProps {
  priceId: string;
  planName: string;
  price: number;
  currency?: string;
  className?: string;
}

export function SubscriptionButton({
  priceId,
  planName,
  price,
  currency = 'HUF',
  className
}: SubscriptionButtonProps) {
  return (
    <StripeCheckoutButton
      priceId={priceId}
      mode="subscription"
      amount={price}
      currency={currency}
      title={`${planName} előfizetés`}
      description="Havi előfizetés korlátlan hozzáféréssel"
      className={className}
      size="lg"
      metadata={{
        planName,
        subscriptionType: 'monthly'
      }}
    />
  );
}