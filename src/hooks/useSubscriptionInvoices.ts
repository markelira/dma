import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  invoiceUrl: string
  description: string
  createdAt: { _seconds: number; _nanoseconds: number }
  paidAt?: { _seconds: number; _nanoseconds: number }
}

interface GetSubscriptionInvoicesResponse {
  success: boolean
  invoices: Invoice[]
}

export function useSubscriptionInvoices() {
  return useQuery({
    queryKey: ['subscriptionInvoices'],
    queryFn: async () => {
      const getSubscriptionInvoices = httpsCallable<object, GetSubscriptionInvoicesResponse>(
        functions,
        'getSubscriptionInvoices'
      )
      const result = await getSubscriptionInvoices({})
      return result.data.invoices
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
