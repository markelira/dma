'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Building2, User, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import Image from 'next/image'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { refreshUser } = useAuth()

  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(user?.profilePictureUrl || null)
  const [profileUploading, setProfileUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const profileInputRef = useRef<HTMLInputElement>(null)

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
        setProfilePictureUrl(data.profilePictureUrl || null)

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

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid) return

    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájl tölthető fel')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A fájl mérete maximum 2MB lehet')
      return
    }

    setProfileUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const profileRef = ref(storage, `users/${user.uid}/profile.${ext}`)
      await uploadBytes(profileRef, file)
      const downloadUrl = await getDownloadURL(profileRef)

      await updateDoc(doc(db, 'users', user.uid), {
        profilePictureUrl: downloadUrl,
        updatedAt: new Date().toISOString()
      })

      setProfilePictureUrl(downloadUrl)
      setUser({ ...user, profilePictureUrl: downloadUrl })
      await refreshUser()
      toast.success('Profilkép sikeresen feltöltve')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast.error('Hiba történt a feltöltés során')
    } finally {
      setProfileUploading(false)
      if (profileInputRef.current) profileInputRef.current.value = ''
    }
  }

  // Handle profile picture removal
  const handleProfilePictureRemove = async () => {
    if (!user?.uid || !profilePictureUrl) return

    setProfileUploading(true)
    try {
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      for (const ext of extensions) {
        try {
          const profileRef = ref(storage, `users/${user.uid}/profile.${ext}`)
          await deleteObject(profileRef)
          break
        } catch { /* continue */ }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        profilePictureUrl: null,
        updatedAt: new Date().toISOString()
      })

      setProfilePictureUrl(null)
      setUser({ ...user, profilePictureUrl: undefined })
      await refreshUser()
      toast.success('Profilkép sikeresen törölve')
    } catch (error) {
      console.error('Error removing profile picture:', error)
      toast.error('Hiba történt a törlés során')
    } finally {
      setProfileUploading(false)
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

      // Update local user state
      setUser({
        ...user,
        firstName,
        lastName
      })

      // Refresh AuthContext so sidebar updates
      await refreshUser()

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

            {/* Profile Picture Upload */}
            <div className="flex items-center gap-6 pb-7 border-b border-gray-200">
              <div className="relative">
                {profilePictureUrl ? (
                  <div className="relative w-28 h-28">
                    <Image
                      src={profilePictureUrl}
                      alt="Profilkép"
                      fill
                      className="object-cover rounded-full border-4 border-gray-100"
                    />
                    <button
                      onClick={handleProfilePictureRemove}
                      disabled={profileUploading}
                      className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      title="Profilkép törlése"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-secondary to-brand-secondary/70 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                {profileUploading && (
                  <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-secondary" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Profilkép</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG max. 2MB (négyzetes kép ajánlott)</p>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary-hover rounded-lg cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {profilePictureUrl ? 'Kép módosítása' : 'Kép feltöltése'}
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
