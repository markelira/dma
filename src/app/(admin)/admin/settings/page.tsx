'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Mail, 
  CreditCard, 
  Shield, 
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Spinner } from '@/components/ui/spinner'

interface SystemSettings {
  platform: {
    name: string
    description: string
    contactEmail: string
    supportPhone: string
    timezone: string
    language: string
    maintenanceMode: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
    enabled: boolean
  }
  payment: {
    stripeEnabled: boolean
    stripePublishableKey: string
    stripeSecretKey: string
    currency: string
    taxRate: number
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireTwoFactor: boolean
    allowedOrigins: string[]
  }
}

const fetchSettings = async (): Promise<SystemSettings> => {
  // For now, return default settings since we don't have settings endpoint yet
  // TODO: Implement getSettings Cloud Function
  return {
    platform: {
      name: 'DMA',
      description: 'Magyarország vezető online oktatási platformja',
      contactEmail: 'info@dma.hu',
      supportPhone: '+36 1 234 5678',
      timezone: 'Europe/Budapest',
      language: 'hu',
      maintenanceMode: false
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@dma.hu',
      smtpPassword: '',
      fromEmail: 'noreply@dma.hu',
      fromName: 'DMA',
      enabled: true
    },
    payment: {
      stripeEnabled: true,
      stripePublishableKey: '',
      stripeSecretKey: '',
      currency: 'HUF',
      taxRate: 27
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowedOrigins: ['http://localhost:3000']
    }
  }
}

const updateSettings = async (settings: Partial<SystemSettings>) => {
  // For now, return success since we don't have update settings endpoint yet
  // TODO: Implement updateSettings Cloud Function
  return { success: true }
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('platform')
  const [isSaving, setIsSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: settings, isLoading, error } = useQuery<SystemSettings>({
    queryKey: ['adminSettings'],
    queryFn: fetchSettings,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] })
      setIsSaving(false)
    },
    onError: () => {
      setIsSaving(false)
    }
  })

  const handleSave = (section: keyof SystemSettings) => {
    setIsSaving(true)
    updateSettingsMutation.mutate({ [section]: settings?.[section] })
  }

  const tabs = [
    { id: 'platform', label: 'Platform Beállítások', icon: Settings },
    { id: 'email', label: 'Email Beállítások', icon: Mail },
    { id: 'payment', label: 'Fizetési Beállítások', icon: CreditCard },
    { id: 'security', label: 'Biztonsági Beállítások', icon: Shield },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112a4b]" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-600">Hiba a beállítások betöltése közben: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rendszer beállítások</h1>
          <p className="text-gray-500">Platform beállítások és konfigurációk kezelése</p>
        </div>
        <Button
          onClick={() => handleSave(activeTab as keyof SystemSettings)}
          disabled={isSaving}
          className="bg-[#112a4b] text-white hover:bg-[#1a3d6e] flex items-center gap-2"
        >
          {isSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />}
          Mentés
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#112a4b] text-[#112a4b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Platform Settings */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Információk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Név</Label>
                  <Input
                    id="platformName"
                    value={settings?.platform.name || ''}
                    placeholder="DMA Learning Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Kapcsolattartási Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings?.platform.contactEmail || ''}
                    placeholder="info@dma.hu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Támogatási Telefon</Label>
                  <Input
                    id="supportPhone"
                    value={settings?.platform.supportPhone || ''}
                    placeholder="+36 1 234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Időzóna</Label>
                  <Input
                    id="timezone"
                    value={settings?.platform.timezone || 'Europe/Budapest'}
                    placeholder="Europe/Budapest"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Platform Leírás</Label>
                <Textarea
                  id="description"
                  value={settings?.platform.description || ''}
                  placeholder="A platform rövid leírása..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings?.email.smtpHost || ''}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings?.email.smtpPort || 587}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Felhasználónév</Label>
                  <Input
                    id="smtpUser"
                    value={settings?.email.smtpUser || ''}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Jelszó</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings?.email.smtpPassword || ''}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Feladó Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings?.email.fromEmail || ''}
                    placeholder="noreply@dma.hu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">Feladó Név</Label>
                  <Input
                    id="fromName"
                    value={settings?.email.fromName || ''}
                    placeholder="DMA Platform"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stripePublishableKey">Publikus Kulcs</Label>
                  <Input
                    id="stripePublishableKey"
                    value={settings?.payment.stripePublishableKey || ''}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Titkos Kulcs</Label>
                  <Input
                    id="stripeSecretKey"
                    type="password"
                    value={settings?.payment.stripeSecretKey || ''}
                    placeholder="sk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Pénznem</Label>
                  <Input
                    id="currency"
                    value={settings?.payment.currency || 'HUF'}
                    placeholder="HUF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">ÁFA Kulcs (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings?.payment.taxRate || 27}
                    placeholder="27"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biztonsági Beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Munkamenet Időtartam (perc)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings?.security.sessionTimeout || 60}
                    placeholder="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Bejelentkezési Próbálkozások</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings?.security.maxLoginAttempts || 5}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimális Jelszó Hossz</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings?.security.passwordMinLength || 8}
                    placeholder="8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedOrigins">Engedélyezett Eredetek (CORS)</Label>
                <Textarea
                  id="allowedOrigins"
                  value={settings?.security.allowedOrigins?.join('\n') || ''}
                  placeholder="http://localhost:3000&#10;http://localhost:3000"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Egy sorban egy domain, üres sorok figyelmen kívül maradnak
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendszer Állapot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Adatbázis: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Redis: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Email: Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 