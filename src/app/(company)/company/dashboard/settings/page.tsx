'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Loader2, Upload, X, User, Camera, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Industry options
const INDUSTRY_OPTIONS = [
  'Technológia',
  'Pénzügy',
  'Egészségügy',
  'Oktatás',
  'Kereskedelem',
  'Gyártás',
  'Szolgáltatás',
  'Média',
  'Vendéglátás',
  'Ingatlan',
  'Egyéb'
]

// Company size options
const COMPANY_SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
]

export default function CompanySettingsPage() {
  const { user, setUser } = useAuthStore()
  const { refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'company'>('profile')

  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(user?.profilePictureUrl || null)
  const [profileUploading, setProfileUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const profileInputRef = useRef<HTMLInputElement>(null)

  // Company states
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false)
  const [companySaving, setCompanySaving] = useState(false)
  const companyLogoInputRef = useRef<HTMLInputElement>(null)

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN'

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
        setTitle(data.title || '')
        setBio(data.bio || '')
        setProfilePictureUrl(data.profilePictureUrl || null)
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
        setIndustry(data.industry || '')
        setCompanySize(data.companySize || '')
        setBillingEmail(data.billingEmail || '')
        setCompanyLogoUrl(data.logoUrl || null)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
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
      // Refresh AuthContext so sidebar updates
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
      // Refresh AuthContext so sidebar updates
      await refreshUser()
      toast.success('Profilkép sikeresen törölve')
    } catch (error) {
      console.error('Error removing profile picture:', error)
      toast.error('Hiba történt a törlés során')
    } finally {
      setProfileUploading(false)
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

  // Save profile
  const saveProfile = async () => {
    if (!user?.uid) return

    setProfileSaving(true)
    try {
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`.trim()
        })
      }

      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        phone,
        title,
        bio,
        updatedAt: new Date().toISOString()
      })

      setUser({ ...user, firstName, lastName })
      // Refresh AuthContext so sidebar updates
      await refreshUser()
      toast.success('Profil sikeresen mentve')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Hiba történt a mentés során')
    } finally {
      setProfileSaving(false)
    }
  }

  // Save company settings
  const saveCompanySettings = async () => {
    if (!user?.companyId || !isCompanyAdmin) return

    setCompanySaving(true)
    try {
      await updateDoc(doc(db, 'companies', user.companyId), {
        name: companyName,
        industry,
        companySize,
        billingEmail,
        updatedAt: new Date().toISOString()
      })

      toast.success('Cég beállítások sikeresen mentve')
    } catch (error) {
      console.error('Error saving company settings:', error)
      toast.error('Hiba történt a mentés során')
    } finally {
      setCompanySaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beállítások</h1>
        <p className="text-gray-500">
          Kezelje profil és cég beállításait
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'profile'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <User className="w-4 h-4 inline-block mr-2" />
            Profil
          </button>
          {user?.companyId && (
            <button
              onClick={() => setActiveTab('company')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'company'
                  ? 'border-brand-secondary text-brand-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Vállalat
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-6xl">
        {activeTab === 'profile' && (
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

              {/* Title Field */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium text-gray-900">
                  Beosztás / Pozíció <span className="text-gray-400 font-normal">(opcionális)</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:ring-brand-secondary"
                  placeholder="pl. Senior Manager, HR vezető, Ügyvezető"
                />
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

              {/* Bio */}
              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-900">
                  Bemutatkozás <span className="text-gray-400 font-normal">(opcionális)</span>
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:ring-brand-secondary resize-none"
                  placeholder="Rövid bemutatkozás magadról..."
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
        )}

        {activeTab === 'company' && user?.companyId && (
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
                      {isCompanyAdmin && (
                        <button
                          onClick={handleCompanyLogoRemove}
                          disabled={companyLogoUploading}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                          title="Logó törlése"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
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
                  <p className="text-lg font-semibold text-gray-900">Céges logó</p>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG max. 2MB (négyzetes kép ajánlott)</p>
                  {isCompanyAdmin && (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-900">
                  Cég neve
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!isCompanyAdmin}
                  className={cn(
                    "h-10 border-gray-300 text-gray-900 placeholder:text-gray-400",
                    isCompanyAdmin
                      ? "bg-white focus:border-brand-secondary focus:ring-brand-secondary"
                      : "bg-gray-100 cursor-not-allowed"
                  )}
                  placeholder="Példa Kft."
                />
              </div>

              {/* Industry & Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-900">
                    Iparág
                  </Label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    disabled={!isCompanyAdmin}
                    className={cn(
                      "w-full h-10 px-3 rounded-md border text-sm",
                      isCompanyAdmin
                        ? "bg-white border-gray-300 focus:border-brand-secondary focus:ring-brand-secondary"
                        : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                    )}
                  >
                    <option value="">Válasszon iparágat...</option>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companySize" className="text-sm font-medium text-gray-900">
                    Cégméret (alkalmazottak száma)
                  </Label>
                  <select
                    id="companySize"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    disabled={!isCompanyAdmin}
                    className={cn(
                      "w-full h-10 px-3 rounded-md border text-sm",
                      isCompanyAdmin
                        ? "bg-white border-gray-300 focus:border-brand-secondary focus:ring-brand-secondary"
                        : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                    )}
                  >
                    <option value="">Válasszon méretet...</option>
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Billing Email */}
              <div className="space-y-1.5">
                <Label htmlFor="billingEmail" className="text-sm font-medium text-gray-900">
                  Számlázási email
                </Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  disabled={!isCompanyAdmin}
                  className={cn(
                    "h-10 border-gray-300 text-gray-900 placeholder:text-gray-400",
                    isCompanyAdmin
                      ? "bg-white focus:border-brand-secondary focus:ring-brand-secondary"
                      : "bg-gray-100 cursor-not-allowed"
                  )}
                  placeholder="szamlazas@ceg.hu"
                />
                <p className="text-xs text-gray-500 mt-1">Erre az email címre küldjük a számlákat</p>
              </div>

              {/* Admin Notice */}
              {!isCompanyAdmin && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    A céges beállítások módosításához adminisztrátori jogosultság szükséges.
                  </p>
                </div>
              )}

              {/* Save Button */}
              {isCompanyAdmin && (
                <div className="flex justify-end pt-7 border-t border-gray-200">
                  <Button
                    onClick={saveCompanySettings}
                    disabled={companySaving}
                    className="bg-brand-secondary hover:bg-brand-secondary-hover h-11 px-10 text-sm font-medium"
                  >
                    {companySaving ? (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
