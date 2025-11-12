"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { useCategories } from "@/hooks/useCategoryQueries";
import { useQuery } from "@tanstack/react-query";

interface ModuleDto {
  id: string;
  lessons: { id: string }[];
}

interface CourseDto {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  instructorId: string;
  categoryId: string;
  modules: ModuleDto[];
  status?: string;
  visibility?: string;
  isPlus?: boolean;
  slug?: string;
  metaDescription?: string;
  keywords?: string[];
  autoplayNext?: boolean;
}

interface Props {
  courseId: string;
  onPublish?: () => void;
  isPublishing?: boolean;
  isPublished?: boolean;
}

export default function CoursePublishStep({ courseId, onPublish, isPublishing, isPublished }: Props) {
  // --- ALL HOOKS MUST BE AT THE TOP ---
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("DRAFT");
  const [visibility, setVisibility] = useState<string>("PUBLIC");
  const [isPlus, setIsPlus] = useState<boolean>(false);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(false);
  const [slug, setSlug] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Fetch categories and instructor data for summary panel
  const { data: categories } = useCategories();
  const { data: instructor } = useQuery({
    queryKey: ['instructor', course?.instructorId],
    queryFn: async () => {
      if (!course?.instructorId) return null;
      const getUsersFn = httpsCallable(functions, 'getUsers');
      const result: any = await getUsersFn({});
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Hiba a felhasználók betöltésekor');
      }
      
      const users = result.data.users;
      return users.find((user: any) => user.id === course.instructorId) || null;
    },
    enabled: !!course?.instructorId,
  });

  useEffect(() => {
    (async () => {
      try {
        console.log('🔄 Loading course data from Firestore for courseId:', courseId);
        const getCourseFn = httpsCallable(functions, 'getCourse');
        const result: any = await getCourseFn({ courseId });
        
        if (!result.data.success) {
          throw new Error(result.data.error || 'Hiba a kurzus betöltésekor');
        }
        
        console.log('📦 Course data received from Firestore:', result.data.course);
        setCourse(result.data.course);
      } catch (err: any) {
        console.error('❌ Failed to load course data:', err.message);
        setError(err.message || "Ismeretlen hiba");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  // ha course betöltött, állítsuk be a státuszt / visibility-t egyszer
  useEffect(() => {
    if (course) {
      setStatus(course.status || "DRAFT");
      setVisibility(course.visibility || "PUBLIC");
      setIsPlus(course.isPlus || false);
      setAutoplayNext(course.autoplayNext || false);
      setSlug(course.slug || "");
      setMetaDescription(course.metaDescription || "");
      setKeywords(course.keywords || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error || !course) {
    return <p className="text-red-600">Hiba a kurzus betöltésekor: {error}</p>;
  }

  const handleSaveBasics = async () => {
    setSaving(true);
    try {
      const payload = {
        status: status,
        visibility: visibility,
        isPlus: isPlus,
        slug: slug || undefined,
        metaDescription: metaDescription || undefined,
        keywords: keywords || [],
      };
      
      console.log('🔄 Frontend sending payload to updateCourse:', payload);
      
      const updateCourseFn = httpsCallable(functions, 'updateCourse');
      await updateCourseFn({ courseId, data: payload });
      
      console.log('✅ Backend update successful, updating local state');
      setCourse((c) => (c ? { ...c, status, visibility, isPlus, slug, metaDescription, keywords } : c));
      toast.success("Publikálási beállítások mentve!");
    } catch (err: any) {
      console.error('❌ Backend update failed:', err.message);
      toast.error(err.message || "Mentés sikertelen");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeo = async () => {
    setSaving(true);
    try {
      // Client-side validation for SEO fields
      const validationErrors: string[] = [];
      
      if (slug && !/^[a-z0-9-]+$/.test(slug)) {
        validationErrors.push("A slug csak kisbetűket, számokat és kötőjeleket tartalmazhat");
      }
      
      if (metaDescription && metaDescription.length > 160) {
        validationErrors.push("A meta leírás maximum 160 karakter lehet");
      }
      
      if (validationErrors.length > 0) {
        toast.error(`Validációs hibák: ${validationErrors.join(", ")}`);
        return;
      }

      const payload = {
        slug: slug || undefined,
        metaDescription: metaDescription || undefined,
        keywords: keywords || [],
      };
      
      console.log('🔄 Frontend sending SEO payload to updateCourse:', payload);
      
      const updateCourseFn = httpsCallable(functions, 'updateCourse');
      await updateCourseFn({ courseId, data: payload });
      
      console.log('✅ SEO update successful, updating local state');
      setCourse((c) => (c ? { ...c, slug, metaDescription, keywords } : c));
      toast.success("SEO beállítások mentve!");
    } catch (err: any) {
      console.error('❌ SEO update failed:', err.message);
      toast.error(err.message || "SEO mentés sikertelen");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const generatedSlug = slugify(course.title);
    setSlug(generatedSlug);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  // New function to handle publish with validation and auto-save
  const handlePublishWithValidation = async () => {
    // Client-side validation
    const validationErrors: string[] = [];
    
    if (!slug || slug.trim() === '') {
      validationErrors.push("URL slug kötelező");
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      validationErrors.push("A slug csak kisbetűket, számokat és kötőjeleket tartalmazhat");
    }
    
    if (!metaDescription || metaDescription.trim() === '') {
      validationErrors.push("Meta leírás kötelező");
    } else if (metaDescription.length > 160) {
      validationErrors.push("A meta leírás maximum 160 karakter lehet");
    }
    
    if (validationErrors.length > 0) {
      toast.error(`Publikálás előtt javítsd ki a hibákat: ${validationErrors.join(", ")}`);
      return;
    }

    try {
      // Auto-save SEO fields before publishing
      console.log('🔄 Auto-saving SEO fields before publish...');
      
      const seoPayload = {
        slug: slug.trim(),
        metaDescription: metaDescription.trim(),
        keywords: keywords || [],
      };
      
      const updateCourseFn = httpsCallable(functions, 'updateCourse');
      await updateCourseFn({ courseId, data: seoPayload });
      console.log('✅ SEO fields saved successfully');
      
      // Update local state
      setCourse((c) => (c ? { ...c, slug: slug.trim(), metaDescription: metaDescription.trim(), keywords } : c));
      
      // Now proceed with publish
      if (onPublish) {
        await onPublish();
      }
      
    } catch (err: any) {
      console.error('❌ Auto-save failed:', err.message);
      toast.error(err.message || "SEO mezők mentése sikertelen");
    }
  };


  // lessonCount csak ha course már elérhető
  const lessonCount = course?.modules?.reduce?.((sum, m) => sum + (m.lessons?.length || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* 2x2 Grid Layout with Design System Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kurzus Áttekintés */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kurzus áttekintés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Cím</Label>
                <p className="text-lg font-medium mt-1">{course.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Kategória</Label>
                <p className="text-lg font-medium mt-1">
                  {categories?.find((cat: any) => cat.id === course.categoryId)?.name || course.categoryId}
                </p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Leírás</Label>
              <p className="text-sm mt-1 line-clamp-3">{course.description}</p>
            </div>

            {/* Thumbnail */}
            {course.thumbnailUrl && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Thumbnail</Label>
                <div className="mt-2">
                  <Image src={course.thumbnailUrl} alt="thumbnail" width={200} height={200} className="rounded-lg" />
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{course?.modules?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Modul</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{lessonCount}</p>
                <p className="text-sm text-muted-foreground">Lecke</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Oktató</Label>
              <p className="text-lg font-medium mt-1">
                {instructor ? `${instructor.firstName} ${instructor.lastName}` : course.instructorId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publikálási beállítások */}
        <Card className="ring-1 ring-primary/20 border-l-4 border-primary/40">
          <CardHeader>
            <CardTitle>Publikálási beállítások</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Státusz</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Vázlat</SelectItem>
                  <SelectItem value="PUBLISHED">Publikált</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Láthatóság</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Nyilvános</SelectItem>
                  <SelectItem value="UNLISTED">Nem listázott</SelectItem>
                  <SelectItem value="PRIVATE">Privát</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
          </CardContent>
        </Card>

        {/* Előfizetési beállítások */}
        <Card>
          <CardHeader>
            <CardTitle>Előfizetési beállítások</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">DMA Plus kurzus</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPlus" 
                  checked={isPlus} 
                  onCheckedChange={setIsPlus}
                />
                <span className="text-sm text-muted-foreground">
                  {isPlus ? "Prémium tartalom" : "Ingyenes tartalom"}
                </span>
              </div>
            </div>
            
            {/* Info Card – neutral background, subtle accent */}
            <div
              className={`p-4 rounded-lg border bg-muted/20 ${
                isPlus
                  ? 'border-blue-400'
                  : 'border-green-400'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPlus ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                ></div>
                <p className="text-sm font-medium text-foreground">
                  {isPlus ? 'DMA Plus előfizetés szükséges' : 'Ingyenes kurzus'}
                </p>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {isPlus ? (
                  <>
                    <li>• Korlátlan prémium tartalom</li>
                    <li>• Tanúsítványok és szakértő támogatás</li>
                  </>
                ) : (
                  <>
                    <li>• Mindenki számára elérhető</li>
                    <li>• Regisztráció nélkül is megtekinthető</li>
                  </>
                )}
              </ul>
            </div>
            
            {isPlus && lessonCount < 3 && (
              <div className="p-3 rounded-lg border border-amber-400/60 bg-muted/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <p className="text-sm text-amber-800">
                    ⚠️ DMA Plus kurzusokhoz legalább 3 lecke ajánlott.
                  </p>
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>

        {/* SEO beállítások */}
        <Card>
          <CardHeader>
            <CardTitle>SEO beállítások</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                URL slug <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="kurzus-url-slug"
                  className={`flex-1 ${!slug ? 'border-red-300 focus:border-red-500' : ''}`}
                />
                <Button variant="ghost" size="icon" onClick={generateSlug} title="Slug automatikus generálása a cím alapján">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Egyedi URL a kurzusnak (pl.: „projekt-menedzsment-alapok"). Ha üresen hagyod, automatikusan generáljuk a cím alapján.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Meta leírás ({metaDescription.length}/160) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Rövid leírás a keresőmotorok számára..."
                rows={3}
                maxLength={160}
                className={!metaDescription ? 'border-red-300 focus:border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Rövid leírás, ami megjelenik a keresőmotorokban
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Kulcsszavak</Label>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={handleKeywordKeyPress}
                  placeholder="Új kulcsszó..."
                  className="flex-1"
                />
                <Button variant="outline" onClick={addKeyword}>
                  Hozzáadás
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Kulcsszavak a kurzus kereshetőségének javításához
              </p>
            </div>

            {/* Autoplay következő lecke */}
            <div className="flex items-center gap-2">
              <Switch id="autoplay" checked={autoplayNext} onCheckedChange={(v)=>setAutoplayNext(v)} />
              <Label htmlFor="autoplay">Automatikus továbblépés a következő leckére</Label>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Központi publikálás gomb - Design System Gradient */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 lg:static sticky bottom-0 inset-x-0 z-20 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Kurzus publikálása</h2>
              <p className="text-muted-foreground">
                A kurzus publikálása után az elérhető lesz a felhasználók számára
              </p>
            </div>
            
            <Button 
              onClick={handlePublishWithValidation} 
              disabled={isPublishing || isPublished}
              variant="gradient"
              size="xl"
              className="px-8 py-3 text-lg font-semibold"
            >
              {isPublishing ? "Publikálás..." : isPublished ? "Publikálva" : "KURZUS PUBLIKÁLÁSA"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 