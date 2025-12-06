'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import Image from 'next/image'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  
  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load user settings on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user?.uid) return

    try {
      // Load from users collection (phone, companyName, logoUrl)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setPhone(data.phone || '')
        setCompanyName(data.companyName || '')
        setLogoUrl(data.logoUrl || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájl tölthető fel')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A fájl mérete maximum 2MB lehet')
      return
    }

    setLogoUploading(true)
    try {
      // Upload to Firebase Storage
      const ext = file.name.split('.').pop()
      const logoRef = ref(storage, `users/${user.uid}/logo.${ext}`)
      await uploadBytes(logoRef, file)
      const downloadUrl = await getDownloadURL(logoRef)

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        logoUrl: downloadUrl,
        updatedAt: new Date().toISOString()
      })

      setLogoUrl(downloadUrl)
      toast.success('Logó sikeresen feltöltve')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Hiba történt a feltöltés során')
    } finally {
      setLogoUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle logo removal
  const handleLogoRemove = async () => {
    if (!user?.uid || !logoUrl) return

    setLogoUploading(true)
    try {
      // Delete from Storage (try common extensions)
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      for (const ext of extensions) {
        try {
          const logoRef = ref(storage, `users/${user.uid}/logo.${ext}`)
          await deleteObject(logoRef)
          break
        } catch {
          // File with this extension doesn't exist, try next
        }
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        logoUrl: '',
        updatedAt: new Date().toISOString()
      })

      setLogoUrl('')
      toast.success('Logó sikeresen törölve')
    } catch (error) {
      console.error('Error removing logo:', error)
      toast.error('Hiba történt a törlés során')
    } finally {
      setLogoUploading(false)
    }
  }

  // Save profile manually
  const saveProfile = async () => {
    if (!user?.uid) return
    
    setProfileSaving(true)
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
        companyName,
        updatedAt: new Date().toISOString()
      })
      
      // Update local user state
      setUser({
        ...user,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim()
      })
      
      toast.success('Profil sikeresen mentve')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Hiba történt a mentés során')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil beállítások</h1>
        <p className="text-gray-500">
          Frissítse profil adatait
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
                <div className="p-10 space-y-7">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-5 pb-7 border-b border-gray-200">
                    <div className="relative">
                      {logoUrl ? (
                        <div className="relative w-24 h-24">
                          <Image
                            src={logoUrl}
                            alt="Céges logó"
                            fill
                            className="object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={handleLogoRemove}
                            disabled={logoUploading}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                            title="Logó törlése"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {logoUploading && (
                        <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-secondary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900">Céges logó</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG max. 2MB (200x200px ajánlott)</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 text-sm font-medium text-brand-secondary bg-brand-secondary/10 hover:bg-brand-secondary/20 rounded-lg cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {logoUrl ? 'Új logó feltöltése' : 'Logó feltöltése'}
                      </label>
                    </div>
                  </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                      Email cím
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
                      Telefonszám <span className="text-gray-400 font-normal">(opcionális)</span>
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

                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-900">
                    Cégnév <span className="text-gray-400 font-normal">(opcionális)</span>
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
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="bg-brand-secondary hover:bg-brand-secondary-hover h-11 px-10 text-sm font-medium"
                  >
                    {profileSaving ? (
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