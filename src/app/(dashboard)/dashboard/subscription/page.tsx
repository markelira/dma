'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Gift,
  Clock,
  Shield,
  TrendingDown,
  Loader2
} from 'lucide-react'

/**
 * Subscription Management Page
 *
 * Features:
 * - Current plan display
 * - 7-day trial countdown
 * - Pre-payment options (6mo, 12mo)
 * - Cancel button with retention flow
 */

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { data: subscriptionData, isLoading, refetch } = useSubscriptionStatus()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRetentionOffer, setShowRetentionOffer] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || false
  const subscription = subscriptionData?.subscription
  const isOnTrial = subscription?.isTrialing || false

  // Calculate trial days remaining
  const trialDaysRemaining = subscription?.trialEnd
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const handleCancelClick = () => {
    setShowCancelModal(true)
    // For paid users (not trialing), show retention offer first
    if (hasActiveSubscription && !isOnTrial) {
      setShowRetentionOffer(true)
    }
  }

  const handleCancelConfirm = async () => {
    if (!subscription?.id) return

    setIsCanceling(true)
    try {
      const cancelSubscription = httpsCallable(functions, 'cancelSubscription')
      const result = await cancelSubscription({
        subscriptionId: subscription.id,
        acceptRetentionOffer: false
      })

      const data = result.data as any
      if (data.success) {
        alert(data.message)
        await refetch()
        setShowCancelModal(false)
        setShowRetentionOffer(false)
      }
    } catch (error: any) {
      alert(error.message || 'Lemondás sikertelen')
    } finally {
      setIsCanceling(false)
    }
  }

  const handleAcceptRetentionOffer = async () => {
    if (!subscription?.id) return

    setIsCanceling(true)
    try {
      const cancelSubscription = httpsCallable(functions, 'cancelSubscription')
      const result = await cancelSubscription({
        subscriptionId: subscription.id,
        acceptRetentionOffer: true
      })

      const data = result.data as any
      if (data.success) {
        alert(data.message)
        await refetch()
        setShowCancelModal(false)
        setShowRetentionOffer(false)
      }
    } catch (error: any) {
      alert(error.message || 'Hiba történt')
    } finally {
      setIsCanceling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Előfizetés
            </h1>
          </div>
          <p className="text-gray-600">
            Kezelje előfizetését és számlázási adatait
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Trial Banner */}
          {isOnTrial && (
            <div className="bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-brand-secondary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-secondary-hover mb-2">
                    7 napos ingyenes próbaidőszak
                  </h3>
                  <p className="text-brand-secondary-hover mb-3">
                    Még {trialDaysRemaining} nap van hátra az ingyenes próbaidőszakból.
                    Az első fizetés {new Date(Date.now() + trialDaysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('hu-HU')} napon esedékes.
                  </p>
                  <div className="bg-brand-secondary/10 rounded-lg p-3 text-sm text-brand-secondary-hover">
                    <p className="font-medium mb-1">Próbaidőszak után:</p>
                    <p>15 000 Ft / hónap, automatikus megújítással</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Subscription State */}
          {!hasActiveSubscription && !isOnTrial && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nincs aktív előfizetés
              </h3>
              <p className="text-gray-600 mb-6">
                Indítson el egy előfizetést az összes tartalomhoz való hozzáféréshez
              </p>
              <Button
                onClick={() => router.push('/pricing')}
                className="bg-primary hover:bg-primary-hover"
              >
                Előfizetés indítása
              </Button>
            </div>
          )}

          {/* Active Subscription */}
          {(hasActiveSubscription || isOnTrial) && (
            <>
              {/* Current Plan Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Aktív előfizetés</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">DMA Havi Előfizetés</h2>
                    <p className="text-gray-600 mt-1">Korlátlan hozzáférés az összes tartalomhoz</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">15 000 Ft</p>
                    <p className="text-sm text-gray-600">havonta</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Következő fizetés</span>
                    <span className="font-medium text-gray-900">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('hu-HU')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fizetési mód</span>
                    <span className="font-medium text-gray-900">•••• 4242</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Előfizetés kezdete</span>
                    <span className="font-medium text-gray-900">
                      {new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString('hu-HU')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/dashboard/invoices')}
                  >
                    Számlák megtekintése
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleCancelClick}
                  >
                    Előfizetés lemondása
                  </Button>
                </div>
              </div>

              {/* Pre-payment Options */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingDown className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Spóroljon előre fizetéssel
                    </h3>
                    <p className="text-gray-700">
                      Fizessen előre 6 vagy 12 hónapra és takarítson meg pénzt
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {/* 6 Month Option */}
                  <div className="bg-white rounded-lg p-5 border-2 border-gray-200 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">6 hónapos csomag</p>
                        <p className="text-2xl font-bold text-gray-900">81 000 Ft</p>
                        <p className="text-sm text-gray-600 mt-1">13 500 Ft / hó</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                        -10%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Takarítson meg 9 000 Ft-ot
                    </p>
                    <Button className="w-full bg-primary hover:bg-primary-hover">
                      Váltás 6 hónapos csomagra
                    </Button>
                  </div>

                  {/* 12 Month Option */}
                  <div className="bg-white rounded-lg p-5 border-2 border-primary">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">12 hónapos csomag</p>
                        <p className="text-2xl font-bold text-gray-900">158 400 Ft</p>
                        <p className="text-sm text-gray-600 mt-1">13 200 Ft / hó</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                        -12%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Takarítson meg 21 600 Ft-ot
                    </p>
                    <Button className="w-full bg-primary hover:bg-primary-hover">
                      Váltás 12 hónapos csomagra
                    </Button>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Mit tartalmaz az előfizetés
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Korlátlan hozzáférés az összes tartalomhoz</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Új tartalmak automatikusan hozzáférhetők</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Tanúsítványok minden befejezett tartalomhoz</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Csapattagok korlátlan hozzáadása</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Prioritási támogatás</p>
                  </div>
                </div>
              </div>

              {/* Guarantee */}
              <div className="bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-brand-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      30 napos pénzvisszafizetési garancia
                    </h3>
                    <p className="text-gray-700">
                      Ha nem elégedett az előfizetésével, 30 napon belül teljes visszatérítést biztosítunk,
                      kérdések nélkül.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Modal with Retention Offer */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {showRetentionOffer ? (
              <>
                <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Várjon! Maradjon velünk!
                </h3>
                <p className="text-gray-700 mb-4 text-center">
                  Értékeljük, hogy velünk tanul. Szeretnénk felajánlani Önnek <strong>1 hónap ingyenes hozzáférést</strong> ajándékba.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-900 font-bold text-center">
                    Fogadja el az ajánlatot, és kapjon 1 havi ingyenes hozzáférést!
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full bg-primary hover:bg-primary-hover"
                    onClick={handleAcceptRetentionOffer}
                    disabled={isCanceling}
                  >
                    {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
                    Igen, elfogadom!
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowRetentionOffer(false)}
                    disabled={isCanceling}
                  >
                    Nem, folytatom a lemondást
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Biztosan lemondja az előfizetést?
                </h3>
                <p className="text-gray-600 mb-6">
                  Elveszíti a hozzáférést az összes tartalomhoz. Az előfizetés a jelenlegi számlázási időszak végéig aktív marad.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCancelModal(false)
                      setShowRetentionOffer(false)
                    }}
                    disabled={isCanceling}
                  >
                    Mégsem
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleCancelConfirm}
                    disabled={isCanceling}
                  >
                    {isCanceling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Lemondás
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
