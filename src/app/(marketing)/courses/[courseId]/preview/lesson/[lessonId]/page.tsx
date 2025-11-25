"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InstructorPreviewMode } from "@/components/course/InstructorPreviewMode";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/hooks/useAuth";
import { Course, Lesson } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LessonPreviewPage({ 
  params 
}: { 
  params: { courseId: string; lessonId: string } 
}) {
  const router = useRouter();
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Load course and lesson data in parallel
        const [courseResult, lessonResult, playerResult] = await Promise.all([
          httpsCallable(functions, 'getCourse')({ courseId: params.courseId }),
          httpsCallable(functions, 'getLesson')({ 
            lessonId: params.lessonId, 
            courseId: params.courseId 
          }),
          httpsCallable(functions, 'getCoursePlayerData')({ 
            courseId: params.courseId, 
            lessonId: params.lessonId 
          })
        ]);

        const courseData = courseResult.data as any;
        const lessonData = lessonResult.data as any;
        const playerDataResult = playerResult.data as any;

        if (courseData.success && lessonData.success) {
          setCourse(courseData.course);
          setLesson(lessonData.lesson);
          
          if (playerDataResult.success) {
            setPlayerData(playerDataResult);
          }
        } else {
          setError(courseData.message || lessonData.message || 'Hiba az adatok betöltésekor');
        }
      } catch (err: any) {
        console.error('Error loading preview data:', err);
        setError(err.message || 'Hiba az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.courseId, params.lessonId, user, functions]);

  const handleNavigateToLesson = (lessonId: string) => {
    router.push(`/courses/${params.courseId}/preview/lesson/${lessonId}`);
  };

  const handleExitPreview = () => {
    router.push(`/instructor/courses/${params.courseId}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Lecke betöltése...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !course || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Lecke nem található'}</p>
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
      currentLesson={lesson}
      playerData={playerData}
      userId={user?.id}
      onNavigateToLesson={handleNavigateToLesson}
      onExitPreview={handleExitPreview}
    />
  );
}