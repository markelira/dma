'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Upload, X, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import Image from 'next/image'
import { PrivacySettings } from '@/components/settings/PrivacySettings'

export default function CompanySettingsPage() {
  const { user, setUser } = useAuthStore()

  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Company states
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false)
  const companyLogoInputRef = useRef<HTMLInputElement>(null)

  // Load settings on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserSettings()
      if (user?.companyId) {
        loadCompanySettings()
      }
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user?.uid) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setPhone(data.phone || '')
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }

  const loadCompanySettings = async () => {
    if (!user?.companyId) return

    try {
      const companyDoc = await getDoc(doc(db, 'companies', user.companyId))
      if (companyDoc.exists()) {
        const data = companyDoc.data()
        setCompanyName(data.name || '')
        setCompanyLogoUrl(data.logoUrl || null)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
    }
  }

  // Handle company logo upload
  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.companyId) return

    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájl tölthető fel')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A fájl mérete maximum 2MB lehet')
      return
    }

    setCompanyLogoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const logoRef = ref(storage, `companies/${user.companyId}/logo.${ext}`)
      await uploadBytes(logoRef, file)
      const downloadUrl = await getDownloadURL(logoRef)

      await updateDoc(doc(db, 'companies', user.companyId), {
        logoUrl: downloadUrl,
        updatedAt: new Date().toISOString()
      })

      setCompanyLogoUrl(downloadUrl)
      toast.success('Céges logó sikeresen feltöltve')
    } catch (error) {
      console.error('Error uploading company logo:', error)
      toast.error('Hiba történt a feltöltés során')
    } finally {
      setCompanyLogoUploading(false)
      if (companyLogoInputRef.current) companyLogoInputRef.current.value = ''
    }
  }

  // Handle company logo removal
  const handleCompanyLogoRemove = async () => {
    if (!user?.companyId || !companyLogoUrl) return

    setCompanyLogoUploading(true)
    try {
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      for (const ext of extensions) {
        try {
          const logoRef = ref(storage, `companies/${user.companyId}/logo.${ext}`)
          await deleteObject(logoRef)
          break
        } catch { /* continue */ }
      }

      await updateDoc(doc(db, 'companies', user.companyId), {
        logoUrl: null,
        updatedAt: new Date().toISOString()
      })

      setCompanyLogoUrl(null)
      toast.success('Céges logó sikeresen törölve')
    } catch (error) {
      console.error('Error removing company logo:', error)
      toast.error('Hiba történt a törlés során')
    } finally {
      setCompanyLogoUploading(false)
    }
  }

  // Save all settings
  const saveSettings = async () => {
    if (!user?.uid) return

    setSaving(true)
    try {
      // Update display name in Firebase Auth
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`.trim()
        })
      }

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        updatedAt: new Date().toISOString()
      })

      // Update company name if user has companyId
      if (user?.companyId) {
        await updateDoc(doc(db, 'companies', user.companyId), {
          name: companyName,
          updatedAt: new Date().toISOString()
        })
      }

      // Update local user state (Zustand store - will automatically update sidebar)
      setUser({ ...user, firstName, lastName })
      toast.success('Beállítások sikeresen mentve')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Hiba történt a mentés során')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beállítások</h1>
        <p className="text-gray-500">
          Frissítsd a profilod adatait
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl">
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="p-10 space-y-7">
            {/* Company Logo Upload */}
            <div className="flex items-center gap-6 pb-7 border-b border-gray-200">
              <div className="relative">
                {companyLogoUrl ? (
                  <div className="relative w-24 h-24">
                    <Image
                      src={companyLogoUrl}
                      alt="Céges logó"
                      fill
                      className="object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={handleCompanyLogoRemove}
                      disabled={companyLogoUploading}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      title="Logó törlése"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {companyLogoUploading && (
                  <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-secondary" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Céges logó feltöltése</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG max. 2MB (négyzetes kép ajánlott)</p>
                <input
                  ref={companyLogoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCompanyLogoUpload}
                  className="hidden"
                  id="company-logo-upload"
                />
                <label
                  htmlFor="company-logo-upload"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary-hover rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {companyLogoUrl ? 'Logó módosítása' : 'Logó feltöltése'}
                </label>
              </div>
            </div>

            {/* Name Fields - Vezetéknév first, then Keresztnév */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-900">
                  Vezetéknév
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:ring-brand-secondary"
                  placeholder="Kovács"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-900">
                  Keresztnév
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:ring-brand-secondary"
                  placeholder="János"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  E-mail cím
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-10 bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1.5">Az email cím nem módosítható</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                  Telefonszám
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  disabled
                  className="h-10 bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1.5">A telefonszám nem módosítható</p>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-900">
                Cégnév
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:ring-brand-secondary"
                placeholder="Példa Kft."
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-7 border-t border-gray-200">
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="bg-brand-secondary hover:bg-brand-secondary-hover h-11 px-10 text-sm font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mentés...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Mentés
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy & Data Settings (GDPR) */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Adatvédelem</h2>
          <PrivacySettings />
        </div>
      </div>
    </div>
  )
}
