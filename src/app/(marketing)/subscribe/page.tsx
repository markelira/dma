'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Crown, Star } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Plan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  priceId: string
}

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // For now, use hardcoded plans since we don't have subscription plans endpoint yet
        const hardcodedPlans: Plan[] = [
          {
            id: 'basic',
            name: 'Alap',
            price: '0',
            description: 'Ingyenes hozzáférés korlátozott tartalmakhoz',
            features: ['Korlátozott tartalmak', 'Alapvető tananyagok'],
            priceId: 'price_basic'
          },
          {
            id: 'premium',
            name: 'Prémium',
            price: '2990',
            description: 'Teljes hozzáférés minden tartalomhoz',
            features: ['Minden tartalom', 'Tanúsítványok', 'Szakértő támogatás'],
            popular: true,
            priceId: 'price_premium'
          }
        ]
        setPlans(hardcodedPlans)
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }

    fetchPlans()
  }, [])

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.priceId) {
      console.error('Price ID not configured for plan:', plan.id)
      return
    }

    setLoading(plan.id)
    
    try {
      const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession')
      const result: any = await createCheckoutSessionFn({
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscribe/cancel`
      })

      if (result.data.url) {
        window.location.href = result.data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary/5 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Válassz előfizetési tervet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kapj hozzáférést Magyarország legjobb egyetemi tartalmaihoz és szerezz elismert bizonyítványokat
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {loadingPlans ? (
            <div className="col-span-2 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto"></div>
              <p className="mt-4 text-gray-600">Előfizetési tervek betöltése...</p>
            </div>
          ) : (
            plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'ring-2 ring-brand-secondary shadow-xl' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-brand-secondary/50 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Legnépszerűbb
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.id === 'monthly' && <span className="text-gray-500">/hó</span>}
                  {plan.id === 'annual' && <span className="text-gray-500">/év</span>}
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  loading={loading === plan.id}
                  disabled={loading !== null}
                  className={`w-full ${plan.popular ? 'bg-gradient-to-r from-brand-secondary/50 to-purple-600 hover:from-brand-secondary hover:to-purple-700' : ''}`}
                  size="lg"
                >
                  {loading === plan.id ? 'Feldolgozás...' : 'Előfizetés'}
                </Button>
              </CardFooter>
            </Card>
          ))
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Biztonságos fizetés</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>30 napos visszatérítés</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Bármikor lemondható</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 