'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useAuthStore } from '@/stores/authStore'

function SubscribeSuccessContent() {
  const router = useRouter()
  const { refetch: refetchSubscription } = useSubscriptionStatus()
  const { updateSubscriptionStatus } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Poll for subscription status update in background
    const pollSubscriptionStatus = async () => {
      for (let i = 0; i < 15; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const result = await refetchSubscription()
          if (result.data?.hasActiveSubscription) {
            if (result.data.user?.subscriptionActive !== undefined) {
              updateSubscriptionStatus(result.data.user.subscriptionActive)
            }
            break
          }
        } catch (error) {
          console.error('Error polling subscription status:', error)
        }
      }
    }

    pollSubscriptionStatus()
    setReady(true)
  }, [refetchSubscription, updateSubscriptionStatus])

  // Auto-redirect to dashboard after 3 seconds
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      // Set flag to show welcome popup on dashboard
      sessionStorage.setItem('showWelcomePopup', 'true')
      router.push('/company/dashboard')
    }, 3000)
    return () => clearTimeout(timer)
  }, [ready, router])

  // Simple success UI - auto-redirects after 3 seconds
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
  )
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Betöltés...</p>
        </div>
      </div>
    }>
      <SubscribeSuccessContent />
    </Suspense>
  )
} 