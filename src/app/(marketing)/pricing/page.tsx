'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PremiumHeader } from '@/components/PremiumHeader'
import { PremiumFooter } from '@/components/PremiumFooter'
import { useAuthStore } from '@/stores/authStore'

const features = [
  'Teljes hozzáférés 150+ struktúraépítő tartalomhoz',
  'Több mint 200 órányi azonnal alkalmazható, működő rendszer',
  '5 munkatárs díjmentes hozzáadása',
  'Hetente frissülő tartalmak',
  'Bármikor lemondható',
  '7 napos ingyenes kipróbálás',
]

export default function PricingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const handleStartTrial = () => {
    if (!isAuthenticated) {
      router.push('/register')
    } else {
      router.push('/subscribe/start?plan=monthly')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumHeader />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-brand-secondary font-semibold text-sm uppercase tracking-wider">
              Hozzáférés
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 leading-tight">
              Fedezd fel 7 napig<br />
              <span className="text-brand-secondary">teljesen ingyen</span>
            </h1>
            <p className="text-gray-600 mt-5 text-lg max-w-xl mx-auto leading-relaxed">
              Vágj bele a kalandba és fedezd fel a 150+ cégépítési tartalmat,
              hogy vállalkozásod végre strukturált és önjáró legyen.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900">Teljes hozzáférés</h2>
            <p className="text-gray-600 mt-2 leading-relaxed">
              Egyéni és céges előfizetés – 1 előfizetéssel 5 kollégát adhatsz
              hozzá a csapatodhoz, és mindenki hozzáfér az összes tartalomhoz.
            </p>

            {/* Price */}
            <div className="mt-8 pb-8 border-b border-gray-100">
              <span className="text-5xl font-bold text-gray-900">14.990 Ft</span>
              <span className="text-gray-500 text-xl ml-1">/hó</span>
            </div>

            {/* Features */}
            <ul className="mt-8 space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleStartTrial}
              className="w-full mt-10 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-lg transition-colors"
            >
              Kezdd el ingyen
            </button>
          </div>

        </div>
      </main>

      <PremiumFooter />
    </div>
  )
}
