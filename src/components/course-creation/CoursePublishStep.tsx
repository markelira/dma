"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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


  // lessonCount csak ha course már elérhető
  const lessonCount = course?.modules?.reduce?.((sum, m) => sum + (m.lessons?.length || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Course Overview */}
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

      {/* Publish Button */}
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
              onClick={onPublish}
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