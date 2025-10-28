'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuthStore } from '@/stores/authStore'
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FileText, Download, CreditCard, Calendar, CheckCircle, XCircle, Clock, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { brandGradient, glassMorphism } from '@/lib/design-tokens-premium'

interface Payment {
  id: string
  courseId: string
  courseTitle: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  paymentMethod: string
  stripeSessionId?: string
  createdAt: Timestamp
  invoiceUrl?: string
}

export default function InvoicesPage() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      fetchPayments()
    }
  }, [user])

  const fetchPayments = async () => {
    if (!user?.uid) return

    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(paymentsQuery)
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[]

      setPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
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
    }).format(amount / 100) // Stripe amounts are in cents
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#466C95]"></div>
      </div>
    )
  }

  const totalAmount = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0)
  const successfulPayments = payments.filter(p => p.status === 'succeeded').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Section */}
      <section
        className="relative -mt-20 pt-20 pb-12"
        style={{ background: brandGradient }}
      >
        <div className="container mx-auto px-6 lg:px-12 py-12 relative z-10">
          <motion.div
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Left: Title and Description */}
            <div className="flex-1">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4"
                style={{
                  ...glassMorphism.badge,
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Receipt className="w-4 h-4 text-white" />
                <span className="font-semibold text-white">
                  {successfulPayments} Sikeres fizetés
                </span>
              </motion.div>

              <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-3">
                Számlák és fizetések
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Itt láthatod az összes korábbi fizetésed és számládat
              </p>
            </div>

            {/* Right: Total Amount Stats */}
            {totalAmount > 0 && (
              <motion.div
                className="px-6 py-4 rounded-2xl text-center min-w-[160px]"
                style={{
                  ...glassMorphism.badge,
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -4 }}
              >
                <div className="text-3xl font-bold text-white mb-1">
                  {new Intl.NumberFormat('hu-HU', {
                    style: 'currency',
                    currency: 'HUF'
                  }).format(totalAmount / 100)}
                </div>
                <div className="text-white/80 text-sm">Összes költés</div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.08), transparent 70%)'
          }}
        />
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto space-y-6">

      {payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Még nincsenek fizetéseid
          </h2>
          <p className="text-gray-600">
            Amikor vásárolsz egy kurzust, itt fogod látni a fizetési előzményeidet
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dátum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurzus
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
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {format(payment.createdAt.toDate(), 'yyyy. MMMM dd.', { locale: hu })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {payment.courseTitle || 'Kurzus'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {payment.paymentMethod || 'Bankkártya'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {payment.invoiceUrl && (
                        <button
                          onClick={() => window.open(payment.invoiceUrl, '_blank')}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-[#466C95] hover:text-white hover:border-[#466C95] transition-colors"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Számla
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <motion.div
        className="mt-8 bg-[#466C95]/5 border border-[#466C95]/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-[#466C95]" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              Számla letöltése
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                A sikeres fizetésekről automatikusan számlát állítunk ki. A számlákat PDF formátumban töltheted le a "Számla" gombra kattintva.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
        </div>
      </div>
    </div>
  )
}