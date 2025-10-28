'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Home, BookOpen } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'

interface SubscriptionData {
  status: string
  plan: string
  amount: string
  nextBillingDate?: string
}

function SubscribeSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { refetch: refetchSubscription } = useSubscriptionStatus()
  const { updateSubscriptionStatus } = useAuthStore()

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setError('Hiányzó session ID')
        setLoading(false)
        return
      }

      try {
        // For now, use a placeholder since we don't have subscription verification endpoint yet
        // TODO: Implement subscription verification Cloud Function
        const mockSubscriptionData: SubscriptionData = {
          status: 'active',
          plan: 'premium',
          amount: '2990',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
        setSubscriptionData(mockSubscriptionData)
        
        // Poll for subscription status update
        await pollSubscriptionStatus()
      } catch (error) {
        console.error('Error verifying subscription:', error)
        setError('Hiba történt az előfizetés ellenőrzése során')
      } finally {
        setLoading(false)
      }
    }

    const pollSubscriptionStatus = async () => {
      // Poll for up to 30 seconds with 2-second intervals
      for (let i = 0; i < 15; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
          
          // Refetch subscription status
          const result = await refetchSubscription()
          
          if (result.data?.hasActiveSubscription) {
            // Update auth store with subscription status
            if (result.data.user?.subscriptionActive !== undefined) {
              updateSubscriptionStatus(result.data.user.subscriptionActive)
            }
            console.log('Subscription status updated successfully')
            break
          }
        } catch (error) {
          console.error('Error polling subscription status:', error)
        }
      }
    }

    verifySubscription()
  }, [sessionId, refetchSubscription, updateSubscriptionStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Előfizetés ellenőrzése...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <CardTitle className="text-red-600">Hiba történt</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/subscribe">
              <Button className="w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
                Újra próbálkozás
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Sikeres előfizetés!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Üdvözöljük az DMA Plus családban!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {subscriptionData && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Előfizetés típusa:</span>
                  <span className="font-semibold">{subscriptionData.plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Összeg:</span>
                  <span className="font-semibold">{subscriptionData.amount}</span>
                </div>
                {subscriptionData.nextBillingDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Következő számlázás:</span>
                    <span className="font-semibold">{subscriptionData.nextBillingDate}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mi következik?</h3>
              <div className="grid gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Azonnali hozzáférés</p>
                    <p className="text-sm text-gray-600">Minden prémium kurzus és funkció elérhető</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email megerősítés</p>
                    <p className="text-sm text-gray-600">Részletes előfizetési információk emailben</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">24/7 támogatás</p>
                    <p className="text-sm text-gray-600">Segítségre van szüksége? Keressen minket!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/courses" className="flex-1">
                <Button className="w-full" size="lg">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Kurzusok böngészése
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  Irányítópult
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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