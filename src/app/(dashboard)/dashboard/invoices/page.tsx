'use client'

import { FileText, Download, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import { useStripeInvoices } from '@/hooks/useStripeInvoices'

export default function InvoicesPage() {
  // Fetch invoices from Stripe
  const { data: invoices = [], isLoading: loading } = useStripeInvoices()

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
    }).format(amount / 100) // Stripe amounts are in cents
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Számlák és fizetések</h1>
        <p className="text-gray-500">
          Itt láthatod az összes korábbi fizetésed és számládat
        </p>
      </div>

      {/* Empty State */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-secondary/5">
              <FileText className="h-8 w-8 text-brand-secondary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Még nincsenek fizetéseid
            </h2>
            <p className="text-gray-500 mb-6">
              Amikor vásárolsz egy tartalmat, itt fogod látni a fizetési előzményeidet
            </p>
            <Link
              href="/courses"
              className="rounded-lg bg-brand-secondary px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-secondary-hover transition-colors"
            >
              Tartalmak böngészése
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Payments Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dátum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tartalom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Összeg
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Státusz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fizetési mód
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Műveletek
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {format(new Date(invoice.createdAt), 'yyyy. MMMM dd.', { locale: hu })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {invoice.courseName || 'Tartalom'}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">
                            {invoice.paymentMethod || 'Bankkártya'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {invoice.invoicePdfUrl ? (
                          <button
                            onClick={() => window.open(invoice.invoicePdfUrl, '_blank')}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-lg text-gray-700 bg-white hover:bg-brand-secondary/5 hover:text-brand-secondary hover:border-brand-secondary/30 transition-colors"
                          >
                            <Download className="h-4 w-4 mr-1" />
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
          </div>

          {/* Info Card */}
          <div className="bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-brand-secondary" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Számla letöltése
                </h3>
                <p className="text-sm text-gray-600">
                  A sikeres fizetésekről automatikusan számlát állítunk ki. A számlákat PDF formátumban töltheted le a "Számla" gombra kattintva.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}