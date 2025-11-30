import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export interface StripeInvoice {
  id: string
  courseId?: string
  courseName?: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  paymentMethod: string
  stripeInvoiceUrl?: string
  invoicePdfUrl?: string
  createdAt: number
  paidAt?: number
  number?: string
  paymentIntentId?: string // For szamlazz.hu invoice lookup
}

interface GetStripeInvoicesResponse {
  success: boolean
  invoices: StripeInvoice[]
  error?: string
}

/**
 * Custom hook to fetch Stripe invoices for the authenticated user
 *
 * Features:
 * - Fetches invoices from Stripe via Cloud Function
 * - Enriches invoice data with course information
 * - Automatic caching with 5-minute stale time
 * - Error handling and loading states
 *
 * @returns Query result with invoices data, loading, and error states
 */
export function useStripeInvoices() {
  return useQuery({
    queryKey: ['stripeInvoices'],
    queryFn: async () => {
      const getStripeInvoices = httpsCallable<{}, GetStripeInvoicesResponse>(
        functions,
        'getStripeInvoices'
      )

      const result = await getStripeInvoices({})

      if (!result.data.success) {
        throw new Error(result.data.error || 'Hiba történt a számlák betöltésekor')
      }

      return result.data.invoices
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
