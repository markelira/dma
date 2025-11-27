'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

const SESSION_STORAGE_KEY = 'trialPopupDismissed';
const TRIAL_RETURN_URL_KEY = 'trialReturnTo';

/**
 * Hook to manage trial popup visibility and state
 *
 * Usage:
 * - Dashboard: Show trial popup if user is authenticated but has no subscription
 * - Course detail: Show trial popup before allowing access to course
 */
export function useTrialPopup() {
  const { user, isLoading: authLoading, authReady } = useAuthStore();
  const { data: subscription, isLoading: subLoading } = useSubscriptionStatus();

  const isAuthenticated = !!user;
  const isLoading = authLoading || subLoading || !authReady;

  // Check if popup was dismissed this session
  const isDismissedThisSession = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  }, []);

  // Should show popup for authenticated user without subscription?
  const shouldShowForAuthUser = useMemo(() => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    if (subscription?.isActive) return false;
    if (isDismissedThisSession) return false;
    return true;
  }, [isAuthenticated, subscription, isLoading, isDismissedThisSession]);

  // Dismiss the popup (sets sessionStorage flag)
  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }
  }, []);

  // Set return URL for after trial signup (used by unauthenticated flow)
  const setReturnUrl = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TRIAL_RETURN_URL_KEY, url);
    }
  }, []);

  // Get return URL (used after login/registration)
  const getReturnUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TRIAL_RETURN_URL_KEY);
  }, []);

  // Clear return URL (after using it)
  const clearReturnUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TRIAL_RETURN_URL_KEY);
    }
  }, []);

  return {
    // State
    shouldShowForAuthUser,
    isLoading,
    isAuthenticated,
    hasActiveSubscription: subscription?.isActive ?? false,

    // Actions
    dismiss,
    setReturnUrl,
    getReturnUrl,
    clearReturnUrl
  };
}

/**
 * Check if user should see trial popup on course detail page
 * This is a simpler check for course access flow
 */
export function useTrialPopupForCourse() {
  const { user, authReady } = useAuthStore();
  const { data: subscription, isLoading: subLoading } = useSubscriptionStatus();

  const isAuthenticated = !!user;
  const isLoading = !authReady || subLoading;
  const hasActiveSubscription = subscription?.isActive ?? false;

  // Determine which variant to show
  const getVariant = useCallback((): 'course-auth' | 'course-unauth' | null => {
    if (isLoading) return null;

    if (!isAuthenticated) {
      return 'course-unauth';
    }

    if (!hasActiveSubscription) {
      return 'course-auth';
    }

    // User is authenticated and has subscription - no popup needed
    return null;
  }, [isAuthenticated, hasActiveSubscription, isLoading]);

  return {
    isLoading,
    isAuthenticated,
    hasActiveSubscription,
    getVariant
  };
}
