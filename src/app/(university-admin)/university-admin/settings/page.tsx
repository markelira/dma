'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Building2,
  Mail,
  Phone,
  Globe,
  Save,
  Upload,
  Shield,
  Bell,
  Users,
  BookOpen
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UniversitySettings {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  logoUrl?: string;
  allowSelfEnrollment: boolean;
  requireApproval: boolean;
  maxStudentsPerCourse: number;
  notificationEmail: string;
  customBranding: boolean;
}

export default function UniversityAdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UniversitySettings>({
    name: 'Budapesti Műszaki Egyetem',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: '',
    logoUrl: '',
    allowSelfEnrollment: true,
    requireApproval: false,
    maxStudentsPerCourse: 0,
    notificationEmail: '',
    customBranding: false
  });

  useEffect(() => {
    loadSettings();
  }, [user?.universityId]);

  const loadSettings = async () => {
    if (!user?.universityId) return;

    try {
      const docRef = doc(db, 'universities', user.universityId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          name: data.name || '',
          description: data.description || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          website: data.website || '',
          address: data.address || '',
          logoUrl: data.logoUrl || '',
          allowSelfEnrollment: data.settings?.allowSelfEnrollment ?? true,
          requireApproval: data.settings?.requireApproval ?? false,
          maxStudentsPerCourse: data.settings?.maxStudentsPerCourse || 0,
          notificationEmail: data.settings?.notificationEmail || '',
          customBranding: data.settings?.customBranding ?? false
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Hiba történt a beállítások betöltésekor');
    }
  };

  const handleSave = async () => {
    if (!user?.universityId) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'universities', user.universityId), {
        name: settings.name,
        description: settings.description,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        website: settings.website,
        address: settings.address,
        logoUrl: settings.logoUrl,
        settings: {
          allowSelfEnrollment: settings.allowSelfEnrollment,
          requireApproval: settings.requireApproval,
          maxStudentsPerCourse: settings.maxStudentsPerCourse,
          notificationEmail: settings.notificationEmail,
          customBranding: settings.customBranding
        },
        updatedAt: new Date()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'UPDATE_UNIVERSITY_SETTINGS',
        resource: 'University',
        resourceId: user.universityId,
        universityId: user?.universityId,
        severity: 'MEDIUM',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Beállítások sikeresen mentve');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Hiba történt a beállítások mentésekor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Egyetem Beállítások</h1>
        <p className="text-muted-foreground">
          Az egyetem profiljának és működésének beállításai
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Általános</TabsTrigger>
          <TabsTrigger value="enrollment">Beiratkozás</TabsTrigger>
          <TabsTrigger value="notifications">Értesítések</TabsTrigger>
          <TabsTrigger value="branding">Arculat</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alapinformációk</CardTitle>
              <CardDescription>
                Az egyetem alapvető adatai
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Egyetem neve</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Leírás</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={4}
                  placeholder="Rövid bemutatkozó szöveg..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Kapcsolat email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonszám</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Weboldal</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="website"
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Cím</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beiratkozási beállítások</CardTitle>
              <CardDescription>
                Hallgatói beiratkozások kezelése
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="selfEnroll">Önálló beiratkozás engedélyezése</Label>
                  <p className="text-sm text-muted-foreground">
                    A hallgatók önállóan beiratkozhatnak a kurzusokra
                  </p>
                </div>
                <Switch
                  id="selfEnroll"
                  checked={settings.allowSelfEnrollment}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowSelfEnrollment: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="approval">Jóváhagyás szükséges</Label>
                  <p className="text-sm text-muted-foreground">
                    Az oktatók jóváhagyása szükséges a beiratkozáshoz
                  </p>
                </div>
                <Switch
                  id="approval"
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireApproval: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maximum hallgatók száma kurzusonként</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="maxStudents"
                    type="number"
                    min="0"
                    value={settings.maxStudentsPerCourse}
                    onChange={(e) => setSettings({ ...settings, maxStudentsPerCourse: parseInt(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  0 = korlátlan
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Értesítési beállítások</CardTitle>
              <CardDescription>
                Email értesítések kezelése
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Értesítési email cím</Label>
                <div className="relative">
                  <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                    className="pl-10"
                    placeholder="admin@egyetem.hu"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Erre a címre érkeznek a rendszer értesítések
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arculat beállítások</CardTitle>
              <CardDescription>
                Egyedi megjelenés testreszabása
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="customBranding">Egyedi arculat használata</Label>
                  <p className="text-sm text-muted-foreground">
                    Saját logó és színek használata
                  </p>
                </div>
                <Switch
                  id="customBranding"
                  checked={settings.customBranding}
                  onCheckedChange={(checked) => setSettings({ ...settings, customBranding: checked })}
                />
              </div>

              {settings.customBranding && (
                <div className="space-y-2">
                  <Label htmlFor="logo">Egyetem logó</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Logó feltöltése
                    </Button>
                    {settings.logoUrl && (
                      <img 
                        src={settings.logoUrl} 
                        alt="University logo" 
                        className="h-12 w-auto"
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Mentés...' : 'Beállítások mentése'}
        </Button>
      </div>
    </div>
  );
}