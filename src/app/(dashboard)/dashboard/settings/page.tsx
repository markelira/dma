'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Bell, Shield, Globe, Camera, Save, Loader2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile as updateAuthProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'
import { brandGradient, glassMorphism } from '@/lib/design-tokens-premium'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  
  // Profile states
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  
  // Notification states
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
    courseUpdates: true,
    weeklyDigest: false,
    newFeatures: true
  })
  const [notificationsSaving, setNotificationsSaving] = useState(false)
  
  // Preferences states
  const [language, setLanguage] = useState('hu')
  const [timezone, setTimezone] = useState('europe/budapest')
  const [autoplay, setAutoplay] = useState(true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)

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
        setNotifications(data.notifications || notifications)
        setLanguage(data.language || 'hu')
        setTimezone(data.timezone || 'europe/budapest')
        setAutoplay(data.autoplay ?? true)
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

  // Save notifications manually
  const saveNotifications = async () => {
    if (!user?.uid) return
    
    setNotificationsSaving(true)
    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        notifications,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
      toast.success('Értesítési beállítások mentve')
    } catch (error) {
      console.error('Error saving notifications:', error)
      toast.error('Hiba történt a mentés során')
    } finally {
      setNotificationsSaving(false)
    }
  }

  // Save preferences manually
  const savePreferences = async () => {
    if (!user?.uid) return

    setPreferencesSaving(true)
    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        language,
        timezone,
        autoplay,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      toast.success('Beállítások mentve')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Hiba történt a mentés során')
    } finally {
      setPreferencesSaving(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Kérjük töltse ki az összes mezőt')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Az új jelszavak nem egyeznek')
      return
    }
    
    if (newPassword.length < 6) {
      toast.error('A jelszónak legalább 6 karakter hosszúnak kell lennie')
      return
    }
    
    setPasswordSaving(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser || !currentUser.email) {
        toast.error('Nincs bejelentkezett felhasználó')
        return
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
      
      // Update password
      await updatePassword(currentUser, newPassword)
      
      toast.success('Jelszó sikeresen megváltoztatva')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Password change error:', error)
      if (error.code === 'auth/wrong-password') {
        toast.error('Hibás jelenlegi jelszó')
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Hibás jelenlegi jelszó')
      } else {
        toast.error('Hiba történt a jelszó változtatás során')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Section */}
      <section
        className="relative -mt-20 pt-20 pb-12"
        style={{ background: brandGradient }}
      >
        <div className="container mx-auto px-6 lg:px-12 py-12 relative z-10">
          <motion.div
            className="flex flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                ...glassMorphism.badge,
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Settings className="w-4 h-4 text-white" />
              <span className="font-semibold text-white">Fiókkezelés</span>
            </motion.div>

            {/* Main Heading */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-3">
                Beállítások
              </h1>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                Kezelje fiókját és testreszabja a platform használatát
              </p>
            </div>
          </motion.div>
        </div>

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.08), transparent 70%)'
          }}
        />
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="notifications">Értesítések</TabsTrigger>
              <TabsTrigger value="security">Biztonság</TabsTrigger>
              <TabsTrigger value="preferences">Beállítások</TabsTrigger>
            </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-gray-900" />
                    Profil információk
                  </CardTitle>
                  <CardDescription>
                    Frissítse profil adatait
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: brandGradient }}
                    >
                      <span className="text-white text-2xl font-bold">
                        {firstName?.[0]?.toUpperCase() || 'U'}{lastName?.[0]?.toUpperCase() || ''}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Camera className="w-4 h-4 mr-2" />
                      Kép feltöltése (hamarosan)
                    </Button>
                  </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Keresztnév</Label>
                    <Input 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1"
                      placeholder="János"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Vezetéknév</Label>
                    <Input 
                      id="lastName" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                      placeholder="Kovács"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <Label htmlFor="email">Email cím</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Az email cím nem módosítható</p>
                </div>

                <div>
                  <Label htmlFor="phone">Telefonszám</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+36 30 123 4567"
                    className="mt-1"
                  />
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bemutatkozás</Label>
                  <textarea 
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
                    rows={4}
                    placeholder="Írjon magáról pár mondatot..."
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="bg-gray-900 hover:bg-[#466C95] transition-colors"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mentés...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Profil mentése
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-gray-900" />
                    Értesítési beállítások
                  </CardTitle>
                  <CardDescription>
                    Válassza ki, milyen értesítéseket szeretne kapni
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { key: 'email', title: 'Email értesítések', desc: 'Kapjon email-t fontos eseményekről' },
                    { key: 'push', title: 'Push értesítések', desc: 'Böngésző értesítések új tartalmakról' },
                    { key: 'courseUpdates', title: 'Kurzus frissítések', desc: 'Értesítések új leckékről és változásokról' },
                    { key: 'marketing', title: 'Marketing üzenetek', desc: 'Új kurzusok és akciók értesítései' },
                    { key: 'weeklyDigest', title: 'Heti összefoglaló', desc: 'Heti összegzés a tanulási előrehaladásról' },
                    { key: 'newFeatures', title: 'Új funkciók', desc: 'Értesítések platform újdonságokról' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">{item.title}</Label>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <Switch 
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, [item.key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={saveNotifications}
                    disabled={notificationsSaving}
                    className="bg-gray-900 hover:bg-[#466C95] transition-colors"
                  >
                    {notificationsSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mentés...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Értesítések mentése
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-gray-900" />
                    Biztonság és jelszó
                  </CardTitle>
                  <CardDescription>
                    Változtassa meg jelszavát a fiók biztonságáért
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Jelenlegi jelszó</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Új jelszó</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 karakter</p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                    placeholder="••••••••"
                  />
                </div>
                
                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving}
                    className="bg-gray-900 hover:bg-[#466C95] transition-colors"
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Jelszó változtatása...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Jelszó megváltoztatása
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-gray-900" />
                    Platform beállítások
                  </CardTitle>
                  <CardDescription>
                    Testreszabhatja a platform működését
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Nyelv</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hu">Magyar</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Időzóna</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe/budapest">Budapest (GMT+1)</SelectItem>
                      <SelectItem value="europe/london">London (GMT+0)</SelectItem>
                      <SelectItem value="america/new_york">New York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Videó automatikus lejátszás</Label>
                    <p className="text-sm text-gray-600">Következő lecke automatikus indítása</p>
                  </div>
                  <Switch 
                    checked={autoplay}
                    onCheckedChange={setAutoplay}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={savePreferences}
                    disabled={preferencesSaving}
                    className="bg-gray-900 hover:bg-[#466C95] transition-colors"
                  >
                    {preferencesSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mentés...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Beállítások mentése
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}