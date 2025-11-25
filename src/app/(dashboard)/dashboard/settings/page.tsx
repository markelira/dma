'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  
  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Load user settings on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user?.uid) return

    try {
      const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid))
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setBio(data.bio || '')
        setPhone(data.phone || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
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
        updatedAt: new Date().toISOString()
      })
      
      // Update additional profile data in userSettings
      await setDoc(doc(db, 'userSettings', user.uid), {
        bio,
        phone,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
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
                  {/* Profile Picture */}
                  <div className="flex items-center gap-5 pb-7 border-b border-gray-200">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-secondary/50 to-brand-secondary flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {firstName?.[0]?.toUpperCase() || 'U'}{lastName?.[0]?.toUpperCase() || ''}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900">Profilkép</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG max. 2MB</p>
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

                {/* Bio */}
                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-900">
                    Bemutatkozás <span className="text-gray-400 font-normal">(opcionális)</span>
                  </Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all text-sm text-gray-900 placeholder:text-gray-400"
                    rows={4}
                    placeholder="Írjon magáról pár mondatot..."
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