import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';

interface BillingPortalResponse {
  success: boolean;
  url?: string;
  error?: string;
  isCompanyEmployee?: boolean;
}

/**
 * Hook for managing Stripe Billing Portal access
 *
 * Features:
 * - Opens Stripe Customer Portal for billing management
 * - Handles individual and company admin users
 * - Shows appropriate error messages for company employees
 */
export function useBillingPortal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Open the Stripe Billing Portal
   * @param returnUrl Optional custom return URL after portal session
   */
  const openBillingPortal = useCallback(async (returnUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const createBillingPortalSession = httpsCallable<
        { returnUrl?: string },
        BillingPortalResponse
      >(functions, 'createBillingPortalSession');

      const result = await createBillingPortalSession({
        returnUrl: returnUrl || window.location.href,
      });

      if (result.data.success && result.data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = result.data.url;
      } else {
        const errorMessage = result.data.error || 'Hiba történt a számlázási portál megnyitása közben';
        setError(errorMessage);

        // Show appropriate toast based on error type
        if (result.data.isCompanyEmployee) {
          toast.error('Hozzáférés megtagadva', {
            description: errorMessage,
          });
        } else {
          toast.error('Hiba', {
            description: errorMessage,
          });
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ismeretlen hiba történt';
      setError(errorMessage);
      toast.error('Hiba', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    openBillingPortal,
    isLoading,
    error,
  };
}
