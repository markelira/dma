import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

// Session storage key for tracking recent registration
const RECENT_REGISTRATION_KEY = 'recentRegistrationTimestamp'
const NEW_USER_WINDOW_MS = 60000 // 60 seconds - skip subscription check for users who registered within this window

/**
 * Check if user just registered (within last 60 seconds)
 * New users can't have subscriptions, so we skip the expensive Cloud Function call
 */
function isRecentlyRegistered(): boolean {
  if (typeof window === 'undefined') return false
  const timestamp = sessionStorage.getItem(RECENT_REGISTRATION_KEY)
  if (!timestamp) return false
  const registeredAt = parseInt(timestamp, 10)
  const elapsed = Date.now() - registeredAt
  return elapsed < NEW_USER_WINDOW_MS
}

/**
 * Mark user as recently registered (called after successful registration)
 * This prevents unnecessary subscription status checks for new users
 */
export function markAsRecentlyRegistered(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(RECENT_REGISTRATION_KEY, Date.now().toString())
}

/**
 * Clear the recent registration flag (called when subscription is acquired)
 */
export function clearRecentRegistrationFlag(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(RECENT_REGISTRATION_KEY)
}

interface SubscriptionStatusResponse {
  success: boolean
  hasSubscription: boolean
  isActive: boolean
  subscription?: {
    id: string
    subscriptionId: string
    status: string
    planName: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    createdAt: string
    trialEnd?: string
    isTrialing?: boolean
  }
  hasUsedTrial?: boolean
  error?: string
  // Legacy compatibility
  hasActiveSubscription?: boolean
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    profilePictureUrl?: string
    subscriptionActive: boolean
    hasUsedTrial?: boolean
  }
}

export const useSubscriptionStatus = () => {
  const { isAuthenticated, updateSubscriptionStatus, companyId } = useAuthStore()

  // Check if this is a recently registered user - skip expensive Cloud Function call
  // BUT: Don't skip for employees (they have companyId) - they inherit company subscription
  const isNewUser = isRecentlyRegistered() && !companyId

  const query = useQuery<SubscriptionStatusResponse, Error>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      // If user just registered, return empty subscription immediately
      // This saves 2-3 seconds on post-registration redirect
      if (isNewUser) {
        console.log('⚡ Skipping subscription check - user just registered')
        return {
          success: true,
          hasSubscription: false,
          isActive: false,
          hasActiveSubscription: false,
          hasUsedTrial: false,
        } as SubscriptionStatusResponse
      }

      console.log('🔍 Checking subscription status...')

      try {
        const getSubscriptionStatus = httpsCallable(functions, 'getSubscriptionStatus')
        const result = await getSubscriptionStatus({})
        const data = result.data as SubscriptionStatusResponse

        console.log('✅ Subscription status:', data)
        return data
      } catch (error: any) {
        console.error('❌ Subscription status error:', error)
        // Return no subscription on error
        return {
          success: false,
          hasSubscription: false,
          isActive: false,
          hasActiveSubscription: false,
          hasUsedTrial: false,
          error: error.message || 'Subscription status check failed'
        } as SubscriptionStatusResponse
      }
    },
    enabled: isAuthenticated, // Only fetch if logged in
    staleTime: 30 * 1000, // 30 seconds - reduced from 2 min to keep subscription status fresh
    retry: 1, // Retry once on failure
  })

  // Update auth store when data changes
  React.useEffect(() => {
    if (query.data) {
      // Use new isActive field or fallback to legacy hasActiveSubscription
      const isActive = query.data.isActive ?? query.data.hasActiveSubscription ?? false
      updateSubscriptionStatus(isActive)
    }
  }, [query.data, updateSubscriptionStatus])

  return query
} 