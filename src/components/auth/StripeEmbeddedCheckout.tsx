'use client';

import { useEffect, useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, AlertCircle, Shield, Lock, CheckCircle } from 'lucide-react';

// Monthly subscription price ID (14,990 HUF/mo with 7-day trial)
const MONTHLY_PRICE_ID = 'price_1SdoIlGe8tBqGEXM2uyTAihs';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  pendingEmployees: Array<{ email: string; firstName: string; lastName: string }>;
}

interface StripeEmbeddedCheckoutProps {
  userId: string;
  email: string;
  registrationData?: RegistrationData;
  onComplete: () => void;
  onError: (error: string) => void;
}

interface CheckoutSessionResponse {
  success: boolean;
  data?: {
    sessionId: string;
    clientSecret: string;
    url: string;
    uiMode: string;
  };
  error?: string;
}

// Interface for savePendingRegistration Cloud Function
interface SavePendingRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  currentStep: 1 | 2 | 3;
  pendingEmployees: Array<{ email: string; firstName: string; lastName: string }>;
  stripeSessionId?: string;
  stripeCustomerId?: string;
}

export function StripeEmbeddedCheckout({
  userId,
  email,
  registrationData,
  onComplete,
  onError
}: StripeEmbeddedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const createCheckoutSession = httpsCallable<any, CheckoutSessionResponse>(
        functions,
        'createCheckoutSession'
      );

      const result = await createCheckoutSession({
        priceId: MONTHLY_PRICE_ID,
        mode: 'subscription',
        uiMode: 'embedded',
        returnUrl: `${window.location.origin}/register?payment_complete=true`,
        metadata: {
          userId,
          email,
          source: 'registration_flow'
        }
      });

      if (!result.data.success || !result.data.data?.clientSecret) {
        throw new Error(result.data.error || 'Nem sikerült létrehozni a fizetési munkamenetet');
      }

      // Save Stripe session ID to pending registration for recovery
      const sessionId = result.data.data.sessionId;
      if (sessionId && registrationData) {
        try {
          const savePendingFn = httpsCallable<SavePendingRegistrationInput, { success: boolean }>(
            functions,
            'savePendingRegistration'
          );
          await savePendingFn({
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            email: registrationData.email,
            phone: registrationData.phone,
            companyName: registrationData.companyName,
            currentStep: 3,
            pendingEmployees: registrationData.pendingEmployees,
            stripeSessionId: sessionId
          });
          console.log('[StripeEmbeddedCheckout] Saved session ID to pending registration:', sessionId);
        } catch (saveErr) {
          // Log but don't fail - session can still be recovered via webhook
          console.error('[StripeEmbeddedCheckout] Failed to save session ID:', saveErr);
        }
      }

      return result.data.data.clientSecret;
    } catch (err: any) {
      console.error('[StripeEmbeddedCheckout] Error creating session:', err);
      throw err;
    }
  }, [userId, email, registrationData]);

  useEffect(() => {
    fetchClientSecret()
      .then(secret => {
        setClientSecret(secret);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Hiba történt a fizetési oldal betöltésekor');
        setIsLoading(false);
        onError(err.message);
      });
  }, [fetchClientSecret, onError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-secondary" />
        <p className="text-gray-600">Fizetési oldal betöltése...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Hiba történt
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchClientSecret()
              .then(secret => {
                setClientSecret(secret);
                setIsLoading(false);
              })
              .catch(err => {
                setError(err.message);
                setIsLoading(false);
              });
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Újrapróbálás
        </button>
      </div>
    );
  }

  // No client secret
  if (!clientSecret) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Trial info banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-800">7 napos ingyenes próbaidőszak</h4>
            <p className="text-sm text-green-700 mt-1">
              Az első 7 napban nem vonunk le összeget. Bármikor lemondható a próbaidőszak alatt.
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Embedded Checkout */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            onComplete: () => {
              console.log('[StripeEmbeddedCheckout] Payment completed');
              onComplete();
            }
          }}
        >
          <EmbeddedCheckout className="min-h-[400px]" />
        </EmbeddedCheckoutProvider>
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>SSL titkosítás</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>PCI DSS megfelelő</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          <span>Stripe által védett</span>
        </div>
      </div>
    </div>
  );
}
