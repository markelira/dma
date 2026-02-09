'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook for handling "Start Free Trial" CTA button logic
 *
 * Returns a function that:
 * - Redirects to /regisztracio if user is not logged in
 * - Redirects to /subscribe/start?plan=monthly if user is logged in but not subscribed
 * - Redirects to /dashboard if user is already subscribed (optional)
 */
export function useTrialCTA() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleTrialClick = () => {
    if (!isAuthenticated) {
      router.push('/regisztracio');
    } else {
      // User is logged in - redirect to subscription checkout
      router.push('/subscribe/start?plan=monthly');
    }
  };

  return { handleTrialClick, isAuthenticated };
}
