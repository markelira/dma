"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InstructorPreviewMode } from "@/components/course/InstructorPreviewMode";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/hooks/useAuth";
import { Course } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CoursePreviewPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const getCourse = httpsCallable(functions, 'getCourse');
        const result = await getCourse({ courseId: params.courseId });
        const data = result.data as any;
        
        if (data.success) {
          setCourse(data.course);
        } else {
          setError(data.message || 'Hiba a tartalom betöltésekor');
        }
      } catch (err: any) {
        console.error('Error loading course:', err);
        setError(err.message || 'Hiba a tartalom betöltésekor');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [params.courseId, user, functions]);

  const handleExitPreview = () => {
    router.push(`/instructor/courses/${params.courseId}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Tartalom betöltése...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Tartalom nem található'}</p>
            <button 
              onClick={() => router.back()}
              className="text-brand-secondary hover:underline"
            >
              Vissza
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <InstructorPreviewMode
      course={course}
      userId={user?.id}
      onExitPreview={handleExitPreview}
    />
  );
} 