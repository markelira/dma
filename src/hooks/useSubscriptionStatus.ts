import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

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
  }
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
  }
}

export const useSubscriptionStatus = () => {
  const { isAuthenticated, updateSubscriptionStatus } = useAuthStore()

  const query = useQuery<SubscriptionStatusResponse, Error>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
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
          error: error.message || 'Subscription status check failed'
        } as SubscriptionStatusResponse
      }
    },
    enabled: isAuthenticated, // Only fetch if logged in
    staleTime: 2 * 60 * 1000, // 2 minutes
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