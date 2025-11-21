'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function SubscribeCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-orange-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Előfizetés megszakítva
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Nem történt meg a fizetés. Próbálja újra, vagy válasszon másik tervet.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Miért történhetett ez?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">A fizetési adatok nem voltak megfelelőek</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">A bank elutasította a tranzakciót</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">Technikai probléma történt a fizetés során</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">Ön megszakította a folyamatot</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mit tehet?</h3>
              <div className="grid gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Próbálja újra</p>
                    <p className="text-sm text-gray-600">Ellenőrizze a fizetési adatokat és próbálja újra</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Másik terv kiválasztása</p>
                    <p className="text-sm text-gray-600">Talán egy másik előfizetési terv jobban megfelel</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Kapcsolatfelvétel</p>
                    <p className="text-sm text-gray-600">Segítségre van szüksége? Keressen minket!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/subscribe" className="flex-1">
                <Button className="w-full" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Újra próbálkozás
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Vissza a főoldalra
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Problémája van? Írjon nekünk: <a href="mailto:support@dma.hu" className="text-blue-600 hover:underline">support@dma.hu</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 