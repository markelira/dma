'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  BookOpen, 
  Save, 
  ArrowLeft,
  Upload,
  Plus,
  X,
  Clock,
  DollarSign,
  Users,
  Award
} from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  price: number;
  isFree: boolean;
  language: string;
  prerequisites: string[];
  learningOutcomes: string[];
  thumbnail: File | null;
  maxStudents: number;
  certificateAvailable: boolean;
  status: 'draft' | 'published';
}

const categories = [
  'Programozás',
  'Üzlet',
  'Marketing',
  'Design',
  'Adattudomány',
  'Mesterséges intelligencia',
  'Nyelvek',
  'Személyes fejlődés',
  'Fotózás',
  'Zene',
  'Egészség',
  'Oktatás'
];

export default function UniversityAdminCreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: '',
    price: 0,
    isFree: true,
    language: 'hu',
    prerequisites: [''],
    learningOutcomes: [''],
    thumbnail: null,
    maxStudents: 0,
    certificateAvailable: true,
    status: 'draft'
  });

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayItemChange = (field: 'prerequisites' | 'learningOutcomes', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'prerequisites' | 'learningOutcomes') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'prerequisites' | 'learningOutcomes', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        thumbnail: e.target.files![0]
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('A kurzus címe kötelező');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('A kurzus leírása kötelező');
      return false;
    }
    if (!formData.category) {
      toast.error('Válasszon kategóriát');
      return false;
    }
    if (!formData.duration.trim()) {
      toast.error('Adja meg a kurzus időtartamát');
      return false;
    }
    if (!formData.isFree && formData.price <= 0) {
      toast.error('Adjon meg érvényes árat');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (formData.thumbnail) {
        const storageRef = ref(storage, `courses/thumbnails/${Date.now()}_${formData.thumbnail.name}`);
        const uploadResult = await uploadBytes(storageRef, formData.thumbnail);
        thumbnailUrl = await getDownloadURL(uploadResult.ref);
      }

      // Get instructor details
      let instructorName = '';
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          instructorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user.email || '';
        }
      }

      // Create course document
      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        price: formData.isFree ? 0 : formData.price,
        isFree: formData.isFree,
        language: formData.language,
        prerequisites: formData.prerequisites.filter(p => p.trim()),
        learningOutcomes: formData.learningOutcomes.filter(o => o.trim()),
        thumbnailUrl,
        maxStudents: formData.maxStudents || 0,
        certificateAvailable: formData.certificateAvailable,
        status: formData.status,
        universityId: user?.universityId,
        instructorId: user?.uid,
        instructorName,
        enrollmentCount: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'courses'), courseData);

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'CREATE_COURSE',
        resource: 'Course',
        resourceId: docRef.id,
        details: JSON.stringify({
          courseTitle: formData.title,
          universityId: user?.universityId,
          status: formData.status
        }),
        universityId: user?.universityId,
        severity: 'MEDIUM',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Kurzus sikeresen létrehozva');
      router.push('/university-admin/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Hiba történt a kurzus létrehozásakor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Új kurzus létrehozása</h1>
          <p className="text-muted-foreground">
            Hozzon létre új kurzust az egyetem számára
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Alapinformációk</CardTitle>
            <CardDescription>A kurzus alapvető adatai</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Kurzus címe*</Label>
              <Input
                id="title"
                placeholder="pl. Bevezetés a programozásba"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Leírás*</Label>
              <Textarea
                id="description"
                placeholder="Részletes leírás a kurzusról..."
                rows={5}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategória*</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon kategóriát" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Nehézségi szint*</Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Kezdő</SelectItem>
                    <SelectItem value="intermediate">Középhaladó</SelectItem>
                    <SelectItem value="advanced">Haladó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Időtartam*</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="duration"
                    placeholder="pl. 8 hét, 40 óra"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Nyelv</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hu">Magyar</SelectItem>
                    <SelectItem value="en">Angol</SelectItem>
                    <SelectItem value="de">Német</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Borítókép</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {formData.thumbnail && (
                <p className="text-sm text-muted-foreground">
                  Kiválasztott fájl: {formData.thumbnail.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Árazás</CardTitle>
            <CardDescription>A kurzus díjazása</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isFree">Ingyenes kurzus</Label>
                <p className="text-sm text-muted-foreground">
                  Az ingyenes kurzusokhoz bárki hozzáférhet
                </p>
              </div>
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => handleInputChange('isFree', checked)}
              />
            </div>

            {!formData.isFree && (
              <div className="space-y-2">
                <Label htmlFor="price">Ár (Ft)*</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                    className="pl-10"
                    required={!formData.isFree}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prerequisites */}
        <Card>
          <CardHeader>
            <CardTitle>Előfeltételek</CardTitle>
            <CardDescription>Mit kell tudnia a hallgatóknak a kurzus megkezdése előtt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.prerequisites.map((prereq, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="pl. Alapvető számítógépes ismeretek"
                  value={prereq}
                  onChange={(e) => handleArrayItemChange('prerequisites', index, e.target.value)}
                />
                {formData.prerequisites.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('prerequisites', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('prerequisites')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Új előfeltétel
            </Button>
          </CardContent>
        </Card>

        {/* Learning Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Tanulási eredmények</CardTitle>
            <CardDescription>Mit fognak tudni a hallgatók a kurzus elvégzése után</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.learningOutcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="pl. Python programozási alapok elsajátítása"
                  value={outcome}
                  onChange={(e) => handleArrayItemChange('learningOutcomes', index, e.target.value)}
                />
                {formData.learningOutcomes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('learningOutcomes', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('learningOutcomes')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Új tanulási eredmény
            </Button>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>További beállítások</CardTitle>
            <CardDescription>Extra opciók a kurzushoz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Maximum hallgatók száma (0 = korlátlan)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="maxStudents"
                  type="number"
                  min="0"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="certificateAvailable">Tanúsítvány elérhető</Label>
                <p className="text-sm text-muted-foreground">
                  A hallgatók tanúsítványt kapnak a kurzus sikeres elvégzése után
                </p>
              </div>
              <Switch
                id="certificateAvailable"
                checked={formData.certificateAvailable}
                onCheckedChange={(checked) => handleInputChange('certificateAvailable', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Státusz</Label>
              <Select value={formData.status} onValueChange={(value: 'draft' | 'published') => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Piszkozat</SelectItem>
                  <SelectItem value="published">Publikált</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Mégse
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Mentés...' : 'Kurzus létrehozása'}
          </Button>
        </div>
      </form>
    </div>
  );
}