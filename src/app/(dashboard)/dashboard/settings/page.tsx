'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import Image from 'next/image'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()

  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Company data (read-only for individual users)
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [hasCompany, setHasCompany] = useState(false)

  // Load user settings on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user?.uid) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setPhone(data.phone || '')

        // Load company data if user is a company employee
        if (data.companyId) {
          setHasCompany(true)
          const companyDoc = await getDoc(doc(db, 'companies', data.companyId))
          if (companyDoc.exists()) {
            const companyData = companyDoc.data()
            setCompanyName(companyData.name || '')
            setCompanyLogoUrl(companyData.logoUrl || null)
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // Save profile
  const saveProfile = async () => {
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
        phone,
        updatedAt: new Date().toISOString()
      })

      // Update local user state (Zustand store - will automatically update sidebar)
      setUser({
        ...user,
        firstName,
        lastName
      })

      toast.success('Beállítások sikeresen mentve')
    } catch (error) {
      console.error('Error saving profile:', error)
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

            {/* Company Logo (Read-Only) */}
            <div className="flex items-center gap-6 pb-7 border-b border-gray-200">
              <div className="relative">
                {companyLogoUrl ? (
                  <div className="relative w-28 h-28">
                    <Image
                      src={companyLogoUrl}
                      alt="Cég logó"
                      fill
                      className="object-cover rounded-full border-4 border-gray-100"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Céges logó</p>
                <p className="text-sm text-gray-500 mt-1">
                  A céges logót csak a cég adminisztrátora tudja módosítani.
                </p>
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
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+36 30 123 4567"
                  className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:ring-brand-secondary"
                />
              </div>
            </div>

            {/* Company Name (read-only) - Only show if user has company */}
            {hasCompany && (
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-900">
                  Cégnév
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  disabled
                  className="h-10 bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                  placeholder="Nincs cég"
                />
                <p className="text-xs text-gray-500 mt-1.5">A cégnevet a cég adminisztrátora tudja módosítani.</p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-7 border-t border-gray-200">
              <Button
                onClick={saveProfile}
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
      </div>
    </div>
  )
}
