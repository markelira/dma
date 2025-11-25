'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStripe } from '@/hooks/useStripe';
import { Loader2 } from 'lucide-react';

// Monthly subscription priceId (15,000 HUF/mo)
const MONTHLY_PRICE_ID = 'price_1SNAlsGe8tBqGEXM8vEOVhgY';

export default function SubscribeStartPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, authReady } = useAuth();
  const { createCheckoutSession } = useStripe();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const checkoutInitiated = useRef(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (!authReady || authLoading) return;

    // If not authenticated, redirect to login with return URL
    if (!user) {
      console.log('[SubscribeStart] User not authenticated, redirecting to login');
      const returnUrl = encodeURIComponent('/subscribe/start');
      router.push(`/login?redirect_to=${returnUrl}&subscribeIntent=true`);
      return;
    }

    // Prevent multiple checkout attempts
    if (checkoutInitiated.current) return;
    checkoutInitiated.current = true;

    // User is authenticated - create Stripe checkout session
    const startCheckout = async () => {
      console.log('[SubscribeStart] User authenticated, creating checkout session');
      setIsRedirecting(true);

      try {
        await createCheckoutSession.mutateAsync({
          priceId: MONTHLY_PRICE_ID,
          mode: 'subscription',
          successUrl: `${window.location.origin}/dashboard?subscribed=true`,
          cancelUrl: `${window.location.origin}/?cancelled=true`,
          metadata: {
            source: 'homepage_cta',
            plan: 'monthly'
          }
        });
        // The hook handles redirect to Stripe automatically
        console.log('[SubscribeStart] Checkout session created, redirecting to Stripe...');
      } catch (err) {
        console.error('[SubscribeStart] Checkout error:', err);
        setError('Hiba történt a fizetési oldal betöltésekor. Kérjük próbálja újra.');
        setIsRedirecting(false);
        checkoutInitiated.current = false;
      }
    };

    startCheckout();
  }, [user, authLoading, authReady, router, createCheckoutSession]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Hiba történt
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              checkoutInitiated.current = false;
              window.location.reload();
            }}
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-secondary text-white rounded-lg hover:bg-brand-secondary-hover transition-colors"
          >
            Próbálja újra
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-brand-secondary" />
        <p className="text-gray-600 text-lg">
          {!authReady || authLoading
            ? 'Betöltés...'
            : !user
              ? 'Átirányítás a bejelentkezéshez...'
              : 'Fizetési oldal betöltése...'}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Kérjük, ne zárja be az oldalt
        </p>
      </div>
    </div>
  );
}
