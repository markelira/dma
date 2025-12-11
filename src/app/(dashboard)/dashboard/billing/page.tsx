'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useStripeInvoices } from '@/hooks/useStripeInvoices'
import { useBillingPortal } from '@/hooks/useBillingPortal'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Gift,
  Clock,
  Shield,
  Loader2,
  Download,
  FileText,
  ExternalLink,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/**
 * Unified Billing Page
 *
 * Merges subscription management and invoice history into a single page.
 * Features:
 * - Current subscription status
 * - Trial countdown
 * - "Manage Billing" button → Stripe Customer Portal
 * - Cancel/Reactivate subscription
 * - Invoice history with PDF download
 */

// Helper to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

export default function BillingPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const { data: subscriptionData, isLoading: subscriptionLoading, refetch } = useSubscriptionStatus()
  const { data: invoices = [], isLoading: invoicesLoading } = useStripeInvoices()
  const { openBillingPortal, isLoading: portalLoading } = useBillingPortal()

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRetentionOffer, setShowRetentionOffer] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || false
  const subscription = subscriptionData?.subscription
  const isOnTrial = (subscription as any)?.isTrialing || false
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false

  // Calculate trial days remaining
  const trialDaysRemaining = (subscription as any)?.trialEnd
    ? Math.max(0, Math.ceil((new Date((subscription as any).trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Only show trial banner if actually trialing AND days remaining > 0
  // If trial ended but subscription active, just show active subscription
  const showTrialBanner = isOnTrial && trialDaysRemaining > 0

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
        toast({
          title: 'Előfizetés lemondva',
          description: data.message,
        })
        await refetch()
        setShowCancelModal(false)
        setShowRetentionOffer(false)
      }
    } catch (error: any) {
      toast({
        title: 'Hiba',
        description: error.message || 'Lemondás sikertelen',
        variant: 'destructive',
      })
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
        toast({
          title: 'Ajánlat elfogadva',
          description: data.message,
        })
        await refetch()
        setShowCancelModal(false)
        setShowRetentionOffer(false)
      }
    } catch (error: any) {
      toast({
        title: 'Hiba',
        description: error.message || 'Hiba történt',
        variant: 'destructive',
      })
    } finally {
      setIsCanceling(false)
    }
  }

  const handleReactivate = async () => {
    if (!subscription?.subscriptionId) return

    setIsCanceling(true)
    try {
      const reactivateSubscription = httpsCallable(functions, 'reactivateSubscription')
      const result = await reactivateSubscription({
        subscriptionId: subscription.subscriptionId
      })

      const data = result.data as any
      if (data.success) {
        toast({
          title: 'Előfizetés újraaktiválva',
          description: 'Az előfizetés ismét aktív.',
        })
        await refetch()
      }
    } catch (error: any) {
      toast({
        title: 'Hiba',
        description: error.message || 'Újraaktiválás sikertelen',
        variant: 'destructive',
      })
    } finally {
      setIsCanceling(false)
    }
  }

  // Download Hungarian invoice PDF
  const handleDownloadInvoice = async (invoiceId: string, paymentIntentId?: string) => {
    if (!paymentIntentId) {
      const invoice = invoices.find((i: any) => i.id === invoiceId)
      if (invoice?.invoicePdfUrl) {
        window.open(invoice.invoicePdfUrl, '_blank')
      }
      return
    }

    setDownloadingId(invoiceId)
    try {
      const getSzamlazzInvoicePdf = httpsCallable<
        { stripePaymentIntentId: string },
        { success: boolean; pdfBase64?: string; invoiceNumber?: string; error?: string }
      >(functions, 'getSzamlazzInvoicePdf')

      const result = await getSzamlazzInvoicePdf({ stripePaymentIntentId: paymentIntentId })

      if (result.data.success && result.data.pdfBase64) {
        const pdfBlob = base64ToBlob(result.data.pdfBase64, 'application/pdf')
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `szamla-${result.data.invoiceNumber || paymentIntentId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: 'Számla letöltve',
          description: result.data.invoiceNumber
            ? `Számla: ${result.data.invoiceNumber}`
            : 'A számla sikeresen letöltődött',
        })
      } else {
        throw new Error(result.data.error || 'Nem sikerült letölteni a számlát')
      }
    } catch (error: any) {
      console.error('Error downloading Hungarian invoice:', error)
      const invoice = invoices.find((i: any) => i.id === invoiceId)
      if (invoice?.invoicePdfUrl) {
        toast({
          title: 'Figyelem',
          description: 'A magyar számla nem érhető el, Stripe bizonylat letöltése...',
        })
        window.open(invoice.invoicePdfUrl, '_blank')
      } else {
        toast({
          title: 'Hiba',
          description: error.message || 'Nem sikerült letölteni a számlát',
          variant: 'destructive',
        })
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Sikeres'
      case 'pending':
        return 'Folyamatban'
      case 'failed':
        return 'Sikertelen'
      default:
        return status
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency || 'HUF'
    }).format(amount / 100)
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-secondary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-brand-secondary" />
          <h1 className="text-3xl font-bold text-gray-900">Számlázás</h1>
        </div>
        <p className="text-gray-500">
          Kezeld az előfizetésedet és tekintsd meg a számláidat
        </p>
      </div>

      <div className="space-y-6">
        {/* Trial Banner */}
        {showTrialBanner && (
          <div className="bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-brand-secondary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-brand-secondary-hover mb-2">
                  7 napos ingyenes próbaidőszak
                </h3>
                <p className="text-brand-secondary-hover mb-3">
                  Még <strong>{trialDaysRemaining} nap</strong> van hátra az ingyenes próbaidőszakból.
                </p>
                <div className="bg-brand-secondary/10 rounded-lg p-3 text-sm text-brand-secondary-hover">
                  <p className="font-medium mb-1">Próbaidőszak után:</p>
                  <p>14 990 Ft / hónap, automatikus megújítással</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Subscription State */}
        {!hasActiveSubscription && !isOnTrial && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nincs aktív előfizetés
            </h3>
            <p className="text-gray-600 mb-6">
              Indítson el egy előfizetést az összes tartalomhoz való hozzáféréshez
            </p>
            <Button
              onClick={() => router.push('/register')}
              className="bg-brand-secondary hover:bg-brand-secondary-hover"
            >
              Előfizetés indítása
            </Button>
          </div>
        )}

        {/* Active Subscription Card */}
        {(hasActiveSubscription || isOnTrial) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {cancelAtPeriodEnd ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-600">Lemondva - időszak végéig aktív</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Aktív előfizetés</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Korlátlan hozzáférés
                </h2>
                <p className="text-gray-600 mt-1">Hozzáférés az összes tartalomhoz</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{formatAmount(1499000, 'HUF')}</p>
                <p className="text-sm text-gray-600">havonta</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              {subscription?.currentPeriodEnd && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {cancelAtPeriodEnd ? 'Hozzáférés eddig' : 'Következő fizetés'}
                  </span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(subscription.currentPeriodEnd), 'yyyy. MMMM dd.', { locale: hu })}
                  </span>
                </div>
              )}
              {subscription?.currentPeriodStart && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Előfizetés kezdete</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(subscription.currentPeriodStart), 'yyyy. MMMM dd.', { locale: hu })}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => openBillingPortal()}
                disabled={portalLoading}
                className="bg-brand-secondary hover:bg-brand-secondary-hover"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Számlázás kezelése
              </Button>

              {cancelAtPeriodEnd ? (
                <Button
                  variant="outline"
                  onClick={handleReactivate}
                  disabled={isCanceling}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  {isCanceling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Előfizetés újraaktiválása
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleCancelClick}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Előfizetés lemondása
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-secondary" />
              <h3 className="text-lg font-bold text-gray-900">Számlák és fizetések</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Korábbi fizetéseid és számláid
            </p>
          </div>

          {invoicesLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-secondary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-secondary/5 mx-auto">
                <FileText className="h-8 w-8 text-brand-secondary" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Még nincsenek fizetéseid
              </h4>
              <p className="text-gray-500">
                Amikor előfizetsz, itt fogod látni a fizetési előzményeidet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dátum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leírás
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Összeg
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Státusz
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Számla
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {format(new Date(invoice.createdAt), 'yyyy. MMM dd.', { locale: hu })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {invoice.courseName || 'DMA Előfizetés'}
                        </div>
                        {invoice.number && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            #{invoice.number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(invoice.status)}
                          <span className="ml-2 text-sm text-gray-700">
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {invoice.status === 'succeeded' ? (
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.paymentIntentId)}
                            disabled={downloadingId === invoice.id}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-lg text-gray-700 bg-white hover:bg-brand-secondary/5 hover:text-brand-secondary hover:border-brand-secondary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            PDF
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info about Stripe Portal */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Számlázás kezelése
              </h4>
              <p className="text-sm text-blue-800">
                A "Számlázás kezelése" gombra kattintva átirányítjuk a Stripe biztonságos felületére, ahol módosíthatja fizetési módját, számlázási adatait, és megtekintheti előfizetésének részleteit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal with Retention Offer */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {showRetentionOffer ? (
              <>
                <Gift className="w-12 h-12 text-brand-secondary mx-auto mb-4" />
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
                    className="w-full bg-brand-secondary hover:bg-brand-secondary-hover"
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
