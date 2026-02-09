'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Get subscription success flag from URL
    const subscriptionSuccess = searchParams.get('subscription_success');

    // If this is a subscription purchase, set welcome popup flag
    if (subscriptionSuccess === 'true') {
      sessionStorage.setItem('showWelcomePopup', 'true');
      console.log('[Payment Success] Welcome popup flag set for subscription purchase');
    }

    setReady(true);
  }, [searchParams]);

  // Auto-redirect to company dashboard after 3 seconds
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      router.push('/vallalkozas/kezdolap');
    }, 3000);
    return () => clearTimeout(timer);
  }, [ready, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          SIKERES FIZETÉS
        </h1>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function SuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Betöltés...</p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<SuccessLoading />}>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
