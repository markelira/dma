'use client'

import { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Gift, Plus, Trash2, Copy, CheckCircle, Calendar, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Admin Promo Codes Management Page
 *
 * Features:
 * - Create manual activation codes (e.g., DMAELOFIZETO)
 * - View all promo codes
 * - Track usage statistics
 * - Delete expired codes
 */

interface PromoCode {
  id: string
  code: string
  description: string
  duration: string // e.g., "1 month", "6 months", "12 months"
  maxUses: number | null // null = unlimited
  usedCount: number
  createdAt: Date
  expiresAt: Date | null
  active: boolean
}

export default function PromoCodesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDuration, setNewDuration] = useState('1')
  const [newMaxUses, setNewMaxUses] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true)
      const getPromoCodes = httpsCallable(functions, 'getPromoCodes')
      const result = await getPromoCodes({})
      const data = result.data as any

      if (data.success && data.promoCodes) {
        const codes = data.promoCodes.map((code: any) => ({
          id: code.id,
          code: code.code,
          description: code.description,
          duration: `${code.durationMonths} ${code.durationMonths === 1 ? 'month' : 'months'}`,
          maxUses: code.maxUses,
          usedCount: code.usedCount,
          createdAt: new Date(code.createdAt),
          expiresAt: code.expiresAt ? new Date(code.expiresAt) : null,
          active: code.active
        }))
        setPromoCodes(codes)
      }
    } catch (error: any) {
      console.error('Error fetching promo codes:', error)
      alert(error.message || 'Promóciós kódok betöltése sikertelen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newCode || !newDescription) {
      alert('Kód és leírás kötelező')
      return
    }

    setIsCreating(true)
    try {
      const createPromoCode = httpsCallable(functions, 'createPromoCode')
      const result = await createPromoCode({
        code: newCode,
        description: newDescription,
        durationMonths: newDuration,
        maxUses: newMaxUses ? parseInt(newMaxUses) : null
      })

      const data = result.data as any
      if (data.success) {
        alert(data.message)
        setShowCreateModal(false)
        resetForm()
        await fetchPromoCodes()
      }
    } catch (error: any) {
      alert(error.message || 'Promóciós kód létrehozása sikertelen')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setNewCode('')
    setNewDescription('')
    setNewDuration('1')
    setNewMaxUses('')
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a promóciós kódot?')) {
      return
    }

    try {
      const deletePromoCode = httpsCallable(functions, 'deletePromoCode')
      const result = await deletePromoCode({ promoCodeId: id })

      const data = result.data as any
      if (data.success) {
        alert(data.message)
        await fetchPromoCodes()
      }
    } catch (error: any) {
      alert(error.message || 'Promóciós kód törlése sikertelen')
    }
  }

  const getStatusColor = (code: PromoCode) => {
    if (!code.active) return 'text-red-600 bg-red-100'
    if (code.maxUses && code.usedCount >= code.maxUses) return 'text-orange-600 bg-orange-100'
    return 'text-green-600 bg-green-100'
  }

  const getStatusText = (code: PromoCode) => {
    if (!code.active) return 'Lejárt'
    if (code.maxUses && code.usedCount >= code.maxUses) return 'Kimerült'
    return 'Aktív'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Promóciós Kódok
                </h1>
              </div>
              <p className="text-gray-600">
                Hozzon létre és kezeljen promóciós kódokat előfizetésekhez
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus className="w-4 h-4 mr-2" />
              Új kód létrehozása
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Összes kód</p>
              <p className="text-3xl font-bold text-gray-900">{promoCodes.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Aktív kódok</p>
              <p className="text-3xl font-bold text-green-600">
                {promoCodes.filter(c => c.active).length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Összes felhasználás</p>
              <p className="text-3xl font-bold text-primary">
                {promoCodes.reduce((sum, c) => sum + c.usedCount, 0)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Lejárt kódok</p>
              <p className="text-3xl font-bold text-red-600">
                {promoCodes.filter(c => !c.active).length}
              </p>
            </div>
          </div>

          {/* Promo Codes List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Promóciós kódok listája
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {promoCodes.map((code) => (
                <div key={code.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Code Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 font-mono">
                          {code.code}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(code)}`}>
                          {getStatusText(code)}
                        </span>
                        <button
                          onClick={() => handleCopy(code.code)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Kód másolása"
                        >
                          {copiedCode === code.code ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>

                      <p className="text-gray-700 mb-3">{code.description}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Időtartam: {code.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            Felhasználva: {code.usedCount}
                            {code.maxUses ? ` / ${code.maxUses}` : ' (korlátlan)'}
                          </span>
                        </div>
                        {code.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Lejár: {code.expiresAt.toLocaleDateString('hu-HU')}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Létrehozva: {code.createdAt.toLocaleDateString('hu-HU')}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(code.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {promoCodes.length === 0 && (
              <div className="p-12 text-center">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Még nincs promóciós kód
                </h3>
                <p className="text-gray-600 mb-6">
                  Hozzon létre egy új promóciós kódot
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary-hover"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Első kód létrehozása
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Új promóciós kód létrehozása
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kód *
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="DMAELOFIZETO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Csak nagybetűk, számok és kötőjel
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leírás *
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Rövid leírás a kód céljáról..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Előfizetés időtartama *
                </label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="1">1 hónap</option>
                  <option value="3">3 hónap</option>
                  <option value="6">6 hónap</option>
                  <option value="12">12 hónap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum felhasználások
                </label>
                <input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  placeholder="Hagyja üresen korlátlan használathoz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Üresen hagyva korlátlan használat
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
              >
                Mégsem
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary-hover"
                onClick={handleCreate}
                disabled={!newCode || !newDescription || isCreating}
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Létrehozás
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
