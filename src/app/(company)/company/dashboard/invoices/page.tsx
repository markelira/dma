'use client'

import { FileText, Download, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import { useSubscriptionInvoices } from '@/hooks/useSubscriptionInvoices'

export default function CompanyInvoicesPage() {
  // Fetch invoices from szamlazz.hu via Cloud Function
  const { data: invoices = [], isLoading: loading } = useSubscriptionInvoices()

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
    // szamlazz.hu uses full amounts (not cents like Stripe)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Számlák</h1>
        <p className="text-gray-500">
          Itt láthatod a cég előfizetéséhez kapcsolódó számlákat
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
              Még nincsenek számlák
            </h2>
            <p className="text-gray-500 mb-6">
              Az előfizetéshez kapcsolódó számlák itt fognak megjelenni
            </p>
            <Link
              href="/company/dashboard/subscription"
              className="rounded-lg bg-brand-secondary px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-secondary-hover transition-colors"
            >
              Előfizetés kezelése
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
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
                          {invoice.description || 'DMA Előfizetés'}
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
                        {invoice.invoiceUrl ? (
                          <button
                            onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-lg text-gray-700 bg-white hover:bg-brand-secondary/5 hover:text-brand-secondary hover:border-brand-secondary/30 transition-colors"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Letöltés
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
                  Számla információ
                </h3>
                <p className="text-sm text-gray-600">
                  A számlák automatikusan generálódnak minden sikeres fizetés után. A letöltés gombra kattintva megnyithatod a számlát PDF formátumban.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
