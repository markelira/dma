'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useSubscriptionInvoices } from '@/hooks/useSubscriptionInvoices'
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
  X,
  AlertCircle,
  Gift,
  Clock,
  Loader2,
  Download,
  FileText,
  ExternalLink,
  Settings,
  Building2,
  ShieldAlert,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Company Billing Page
 *
 * For Company Admins: Full billing management (same as individual)
 * For Company Employees: Info message that admin manages billing
 */

// Helper component for benefit list items
function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
        <X className="w-3 h-3 text-red-600" />
      </div>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

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

export default function CompanyBillingPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const { data: subscriptionData, isLoading: subscriptionLoading, refetch } = useSubscriptionStatus()
  const { data: invoices = [], isLoading: invoicesLoading } = useSubscriptionInvoices()
  const { openBillingPortal, isLoading: portalLoading } = useBillingPortal()

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Check if user is company admin
  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN'
  const isCompanyEmployee = user?.role === 'COMPANY_EMPLOYEE'

  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || subscriptionData?.isActive || false
  const subscription = subscriptionData?.subscription
  const isOnTrial = (subscription as any)?.isTrialing || false
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false

  // Calculate trial days remaining
  const trialDaysRemaining = (subscription as any)?.trialEnd
    ? Math.max(0, Math.ceil((new Date((subscription as any).trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Only show trial banner if actually trialing AND days remaining > 0
  const showTrialBanner = isOnTrial && trialDaysRemaining > 0

  const handleCancelSubscription = () => {
    setShowCancelDialog(false)
    openBillingPortal()
  }

  // Download Hungarian invoice PDF
  const handleDownloadInvoice = async (invoiceId: string, stripePaymentIntentId?: string, fallbackUrl?: string) => {
    if (stripePaymentIntentId) {
      setDownloadingId(invoiceId)
      try {
        const getSzamlazzInvoicePdf = httpsCallable<
          { stripePaymentIntentId: string },
          { success: boolean; pdfBase64?: string; invoiceNumber?: string; error?: string }
        >(functions, 'getSzamlazzInvoicePdf')

        const result = await getSzamlazzInvoicePdf({ stripePaymentIntentId })

        if (result.data.success && result.data.pdfBase64) {
          const pdfBlob = base64ToBlob(result.data.pdfBase64, 'application/pdf')
          const url = URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `szamla-${result.data.invoiceNumber || stripePaymentIntentId}.pdf`
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
          return
        }
      } catch (error: any) {
        console.error('Error downloading Hungarian invoice:', error)
      } finally {
        setDownloadingId(null)
      }
    }

    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank')
    } else {
      toast({
        title: 'Hiba',
        description: 'A számla nem érhető el',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
      case 'succeeded':
        return 'Fizetve'
      case 'pending':
        return 'Függőben'
      case 'failed':
        return 'Sikertelen'
      case 'cancelled':
        return 'Törölve'
      default:
        return status
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency || 'HUF',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (timestamp: { _seconds: number; _nanoseconds: number } | undefined) => {
    if (!timestamp) return '-'
    return format(new Date(timestamp._seconds * 1000), 'yyyy. MMMM dd.', { locale: hu })
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-secondary" />
      </div>
    )
  }

  // Company Employee View - No access to billing management
  if (isCompanyEmployee) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-brand-secondary" />
            <h1 className="text-3xl font-bold text-gray-900">Számlázás</h1>
          </div>
          <p className="text-gray-500">
            Vállalati előfizetés számlázási információi
          </p>
        </div>

        <div className="space-y-6">
          {/* Employee Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Számlázás kezelése
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                A vállalati előfizetés számlázását a cég adminisztrátora kezeli. Ha kérdése van a számlázással kapcsolatban, kérjük forduljon a vállalati adminisztrátorhoz.
              </p>
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 px-4 py-2 rounded-lg">
                <Users className="w-4 h-4" />
                <span>A számlázás kezelése adminisztrátori jogosultságot igényel</span>
              </div>
            </div>
          </div>

          {/* Company Subscription Status - Read Only */}
          {hasActiveSubscription && (
            <div className="bg-gradient-to-br from-brand-secondary/5 to-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-8 shadow-sm mt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs font-medium text-brand-secondary px-3 py-1 bg-white rounded-full shadow-sm">
                    Előfizetésed aktív
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Választott előfizetésed: Masterclass
                </h2>
                <ul className="text-gray-600 space-y-3 text-left max-w-xl mx-auto">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Teljes hozzáférés 150+ struktúraépítő tartalomhoz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Több mint 200 órányi azonnal alkalmazható, működő rendszer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>5 munkatárs díjmentes hozzáadása</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Hetente frissülő tartalmak</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Inactive Subscription View */}
          {!hasActiveSubscription && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm mt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs font-medium text-gray-500 px-3 py-1 bg-gray-200 rounded-full">
                    Előfizetésed inaktív
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Választott előfizetésed: Masterclass
                </h2>
                <ul className="text-gray-600 space-y-3 text-left max-w-xl mx-auto mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Teljes hozzáférés 150+ struktúraépítő tartalomhoz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Több mint 200 órányi azonnal alkalmazható, működő rendszer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>5 munkatárs díjmentes hozzáadása</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Hetente frissülő tartalmak</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-500">
                  Kérj hozzáférést a cég adminisztrátorától az előfizetés aktiválásához.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Company Admin View - Full billing management
  return (
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
              Indítson el egy vállalati előfizetést az összes tartalomhoz való hozzáféréshez
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
          <div className="bg-gradient-to-br from-brand-secondary/5 to-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-4">
                  {cancelAtPeriodEnd ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-600">Lemondva - időszak végéig aktív</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-brand-secondary" />
                      <span className="text-sm font-medium text-brand-secondary">Előfizetésed aktív</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Választott előfizetésed: Masterclass
                </h2>
                <ul className="text-gray-600 space-y-3 max-w-xl mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Teljes hozzáférés 150+ struktúraépítő tartalomhoz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Több mint 200 órányi azonnal alkalmazható, működő rendszer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>5 munkatárs díjmentes hozzáadása</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-secondary mt-1 flex-shrink-0">✓</span>
                    <span>Hetente frissülő tartalmak</span>
                  </li>
                </ul>
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
                  onClick={() => openBillingPortal()}
                  disabled={portalLoading}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  {portalLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Előfizetés újraaktiválása
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
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
              Masterclass fizetési előzményeid és számláid
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
                Még nincsenek számlák
              </h4>
              <p className="text-gray-500">
                Az előfizetéshez kapcsolódó számlák itt fognak megjelenni
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
                      Számlaszám
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
                      Műveletek
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
                            {formatDate(invoice.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {invoice.description || 'DMA Vállalati Előfizetés'}
                        </span>
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
                        {(invoice.status === 'paid' || invoice.status === 'succeeded') ? (
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.stripePaymentIntentId, invoice.invoiceUrl)}
                            disabled={downloadingId === invoice.id}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-lg text-gray-700 bg-white hover:bg-brand-secondary/5 hover:text-brand-secondary hover:border-brand-secondary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Számla
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Nem elérhető</span>
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
                A "Számlázás kezelése" gombra kattintva átirányítjuk a Stripe biztonságos felületére, ahol módosíthatja a vállalat fizetési módját, számlázási adatait, és megtekintheti az előfizetés részleteit.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Cancellation Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">
                Biztos, hogy véget akarsz vetni a kalandnak?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-600">
                Ha lemondod, el fogod veszíteni a jelenlegi előfizetésed:
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Benefits List */}
            <div className="space-y-3 py-4">
              <BenefitItem text="Teljes hozzáférés 150+ struktúraépítő tartalomhoz" />
              <BenefitItem text="Több mint 200 órányi azonnal alkalmazható, működő rendszer" />
              <BenefitItem text="5 munkatárs díjmentes hozzáadása" />
              <BenefitItem text="Hetente frissülő tartalmak" />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Mégse</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                className="bg-red-600 hover:bg-red-700"
              >
                Előfizetés lemondása
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
