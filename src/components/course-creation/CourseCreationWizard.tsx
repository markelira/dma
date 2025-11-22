"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import CourseTypeSelection from './CourseTypeSelection';
import CourseBasicInfoStep, { BasicInfoData } from './CourseBasicInfoStep';
import CourseLessonsStep from './CourseLessonsStep';
import CoursePublishStep from './CoursePublishStep';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions, db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useCourseWizardStore, getAllPendingVideoFiles, clearAllPendingVideoFiles } from '@/stores/courseWizardStore';
import { Progress } from '@/components/ui/progress';
import { CourseType } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const steps = [
  {
    id: 0,
    title: 'Típus',
    description: 'Válassz tartalom típust',
    validation: ['courseType']
  },
  {
    id: 1,
    title: 'Alapadatok',
    description: 'Tartalom alapinformációk megadása',
    validation: ['title', 'description', 'categoryId', 'instructorId']
  },
  {
    id: 2,
    title: 'Leckék',
    description: 'Leckék hozzáadása',
    validation: ['lessons']
  },
  {
    id: 3,
    title: 'Publikálás',
    description: 'Áttekintés és közzététel',
    validation: []
  },
];

export default function CourseCreationWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    currentStep,
    completedSteps,
    courseId,
    courseType,
    basicInfo,
    lessons,
    validationErrors,
    setCurrentStep,
    markStepCompleted,
    setCourseId,
    setCourseType,
    setBasicInfo,
    resetWizard,
  } = useCourseWizardStore();

  // Initialize from store on mount
  useEffect(() => {
    // Clear old localStorage if exists
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dmaCourseWizard');
    }
  }, []);

  // Warn before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (courseId || basicInfo) {
        e.preventDefault();
        e.returnValue = 'Biztosan ki akarsz lépni? A nem mentett változtatások elveszhetnek.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [courseId, basicInfo]);

  // Calculate progress
  const progress = (completedSteps.length / steps.length) * 100;


  // Check if step is valid
  const isStepValid = (stepId: number) => {
    const errors = validationErrors[`step${stepId}`] || [];
    return errors.length === 0;
  };

  // Handle course type selection
  const handleTypeSelection = (type: CourseType) => {
    setCourseType(type);
    markStepCompleted(0);
    setCurrentStep(1); // Move to basic info step
    const typeLabels: Record<string, string> = {
      ACADEMIA: 'Akadémia',
      WEBINAR: 'Webinár',
      MASTERCLASS: 'Masterclass',
      PODCAST: 'Podcast'
    };
    toast.success(`${typeLabels[type] || type} típus kiválasztva`);
  };

  // Check if can proceed to next step
  const canProceed = (stepId: number) => {
    if (stepId === 0) return !!courseType;
    if (stepId === 1) return !!courseId;
    if (stepId === 2) {
      // Check flat lessons from store
      const hasLessons = lessons.length > 0;

      console.log('🔍 Step 2 validation:', {
        storeLessons: lessons.length,
        canProceed: hasLessons
      });

      return hasLessons;
    }
    return true;
  };

  // Handle basic info submission
  const handleBasicInfoSubmit = async (formData: BasicInfoData) => {
    setIsSaving(true);
    try {
      if (!courseType) {
        toast.error('Válassz kurzus típust először');
        setCurrentStep(0);
        setIsSaving(false);
        return;
      }

      if (!courseId) {
        // Create new course with course type
        const createCourseFn = httpsCallable(fbFunctions, 'createCourse');
        const res: any = await createCourseFn({
          ...formData,
          courseType, // Include course type
        });

        console.log('🔍 createCourse response:', res.data);

        if (!res.data?.success) {
          // Log the full error details
          console.error('❌ createCourse failed:', {
            error: res.data?.error,
            details: res.data?.details,
            fullResponse: res.data
          });

          // Show detailed error if available
          if (res.data?.details) {
            const errorMsg = `${res.data.error}: ${JSON.stringify(res.data.details, null, 2)}`;
            console.error('Validation errors:', errorMsg);
            throw new Error(errorMsg);
          }

          throw new Error(res.data?.error || 'Kurzus létrehozása sikertelen');
        }

        const newCourseId = res.data.courseId;
        setCourseId(newCourseId);

        // Create audit log entry for course creation
        try {
          await addDoc(collection(db, 'auditLogs'), {
            userId: user?.uid || '',
            userEmail: user?.email || '',
            userName: user?.displayName || user?.email || 'Admin',
            action: 'CREATE_COURSE',
            resource: 'Course',
            resourceId: newCourseId,
            details: JSON.stringify({
              courseTitle: formData.title,
              category: formData.categoryId,
              difficulty: formData.difficulty,
              language: formData.language
            }),
            severity: 'HIGH',
            ipAddress: 'N/A',
            userAgent: navigator.userAgent,
            createdAt: new Date()
          });
        } catch (logError) {
          console.error('Failed to create audit log:', logError);
        }

        toast.success('Kurzus sikeresen létrehozva');
      } else {
        // Update existing course
        const updateFn = httpsCallable(fbFunctions, 'updateCourse');
        const res: any = await updateFn({
          courseId,
          ...formData // Spread directly, not nested
        });

        if (!res.data?.success) {
          throw new Error(res.data?.error || 'Kurzus frissítése sikertelen');
        }

        toast.success('Kurzus adatok frissítve');
      }
      
      // Batch state updates to avoid race conditions
      await Promise.all([
        new Promise<void>((resolve) => {
          setBasicInfo(formData);
          setTimeout(resolve, 0);
        }),
        new Promise<void>((resolve) => {
          markStepCompleted(1);
          setTimeout(resolve, 0);
        })
      ]);

      // Navigate to next step - ALL course types now go through lessons step
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Error saving basic info:', err);
      toast.error(err.message || 'Hiba történt a mentés során');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload a single video file to Mux
  const uploadVideoToMux = async (file: File, lessonId: string): Promise<{ assetId: string; playbackId: string } | null> => {
    try {
      // 1) Get upload URL from backend
      const getMuxUploadUrlFn = httpsCallable(fbFunctions, 'getMuxUploadUrl');
      const result: any = await getMuxUploadUrlFn();

      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Feltöltési URL lekérése sikertelen');
      }

      const { id, url, assetId } = result.data;

      // 2) Upload file to Mux
      if (url.includes('localhost') && url.includes('testVideoUpload')) {
        // Development mode - simulate upload
        console.log('🧪 Development upload simulation for lesson:', lessonId);
        const testUploadFn = httpsCallable(fbFunctions, 'testVideoUpload');
        await testUploadFn({ assetId: assetId || id });
      } else {
        // Real Mux upload
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Feltöltés sikertelen: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Hálózati hiba történt')));
          xhr.addEventListener('abort', () => reject(new Error('Feltöltés megszakítva')));

          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });
      }

      // 3) Poll for asset status to get playbackId
      const getMuxAssetStatusFn = httpsCallable(fbFunctions, 'getMuxAssetStatus');
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        attempts++;
        const statusResult: any = await getMuxAssetStatusFn({ assetId: assetId || id });

        if (statusResult.data?.success) {
          const { status, playbackId, errors } = statusResult.data;

          if (errors && errors.length > 0) {
            throw new Error(`Videó feldolgozási hiba: ${errors[0].message}`);
          }

          if (status === 'ready' && playbackId) {
            return { assetId: assetId || id, playbackId };
          }

          if (status === 'error') {
            throw new Error('Videó feldolgozás sikertelen');
          }
        }

        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      throw new Error('Videó feldolgozás időtúllépés');
    } catch (error) {
      console.error('Video upload error for lesson', lessonId, error);
      throw error;
    }
  };

  // Handle course publish
  const handlePublish = async () => {
    if (!courseId) {
      toast.error('Nincs tartalom ID a publikáláshoz');
      return;
    }

    // Validate lessons from store
    const lessonCount = lessons.length;

    if (lessonCount === 0) {
      toast.error('Legalább egy lecke szükséges a publikáláshoz');
      return;
    }

    console.log('✅ Publishing validation passed:', {
      lessons: lessonCount
    });

    setIsPublishing(true);
    try {
      // 1) Upload pending video files
      const pendingVideoFiles = getAllPendingVideoFiles();

      if (pendingVideoFiles.size > 0) {
        toast.info(`${pendingVideoFiles.size} videó feltöltése folyamatban...`);

        for (const [lessonId, file] of pendingVideoFiles) {
          console.log(`📤 Uploading video for lesson ${lessonId}:`, file.name);
          toast.info(`Feltöltés: ${file.name}`);

          try {
            const result = await uploadVideoToMux(file, lessonId);

            if (result) {
              // Update lesson with Mux playbackId
              const { updateLesson } = useCourseWizardStore.getState();
              updateLesson(lessonId, {
                muxPlaybackId: result.playbackId,
                videoAssetId: result.assetId,
                pendingVideoFile: undefined, // Clear pending file
              });

              console.log(`✅ Video uploaded for lesson ${lessonId}:`, result);
            }
          } catch (uploadError: any) {
            console.error(`❌ Failed to upload video for lesson ${lessonId}:`, uploadError);
            toast.error(`Videó feltöltés sikertelen: ${file.name}`);
            throw uploadError;
          }
        }

        // Clear all pending files after successful uploads
        clearAllPendingVideoFiles();
        toast.success('Minden videó sikeresen feltöltve!');
      }

      // 2) Save lessons to Firestore (flat lessons subcollection)
      toast.info('Leckék mentése...');
      const currentLessons = useCourseWizardStore.getState().lessons;

      for (const lesson of currentLessons) {
        // Generate a proper lesson ID (remove temp_ prefix)
        const lessonId = lesson.id?.startsWith('temp_')
          ? `lesson_${lesson.id.replace('temp_', '')}`
          : (lesson.id || `lesson_${Date.now()}_${Math.random().toString(36).substring(7)}`);

        const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);

        // Prepare lesson data for Firestore
        const lessonData = {
          title: lesson.title || '',
          description: lesson.description || '',
          type: lesson.type || 'VIDEO',
          content: lesson.content || '',
          order: lesson.order || 0,
          status: 'PUBLISHED',
          courseId: courseId,
          duration: lesson.duration || 0,
          videoUrl: lesson.videoUrl || '',
          muxPlaybackId: lesson.muxPlaybackId || '',
          muxAssetId: lesson.videoAssetId || '',
          thumbnailUrl: lesson.thumbnailUrl || '',
          // For imported lessons (MASTERCLASS)
          ...(lesson.isImported && {
            isImported: true,
            sourceCourseId: lesson.sourceCourseid || lesson.sourceCourseId || '',
            sourceLessonId: lesson.sourceLessonId || '',
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(lessonRef, lessonData);
        console.log(`✅ Saved lesson to Firestore: ${lessonId}`, lessonData);
      }

      toast.success(`${currentLessons.length} lecke sikeresen mentve!`);

      // 3) Publish the course
      const publishFn = httpsCallable(fbFunctions, 'publishCourse');
      const res: any = await publishFn({ courseId });

      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Publikálás sikertelen');
      }

      // Create audit log entry for course publication
      try {
        await addDoc(collection(db, 'auditLogs'), {
          userId: user?.uid || '',
          userEmail: user?.email || '',
          userName: user?.displayName || user?.email || 'Admin',
          action: 'PUBLISH_COURSE',
          resource: 'Course',
          resourceId: courseId,
          details: JSON.stringify({
            courseTitle: basicInfo?.title || 'N/A',
            lessonCount
          }),
          severity: 'HIGH',
          ipAddress: 'N/A',
          userAgent: navigator.userAgent,
          createdAt: new Date()
        });
      } catch (logError) {
        console.error('Failed to create audit log:', logError);
      }

      toast.success('Kurzus sikeresen publikálva!');

      // Clear wizard state and redirect
      resetWizard();
      setTimeout(() => {
        router.push('/admin/courses');
      }, 1500);

    } catch (err: any) {
      console.error('Publish failed:', err);
      toast.error(err.message || 'Publikálás sikertelen');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle exit
  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    resetWizard();
    router.push('/admin/courses');
  };

  return (
    <div className="container mx-auto py-4 md:py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Új kurzus létrehozása</h1>
          <Button 
            variant="outline" 
            onClick={handleExit}
            size="sm"
          >
            Kilépés
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {completedSteps.length} / {steps.length} lépés kész
          </p>
        </div>
      </div>

      <Card>
        {/* Stepper */}
        <div className="border-b">
          <ol className="flex items-center justify-between px-6 py-4">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = step.id === currentStep;
              const hasErrors = !isStepValid(step.id) && step.id < currentStep;
              
              return (
                <li key={step.id} className="flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted || step.id < currentStep) {
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={!isCompleted && step.id > currentStep}
                    className={`
                      flex flex-col items-center w-full transition-all
                      ${(isCompleted || step.id < currentStep) ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <span
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all mb-2
                        ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                        ${isActive && !isCompleted ? 'border-primary text-primary bg-primary/10' : ''}
                        ${!isActive && !isCompleted ? 'border-muted-foreground/30 text-muted-foreground' : ''}
                        ${hasErrors ? 'border-red-500 bg-red-50 text-red-600' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : hasErrors ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </span>
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                    <span className={`text-xs ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {step.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step content */}
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div>
              <CourseTypeSelection
                onSelect={handleTypeSelection}
                initialSelection={courseType || undefined}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Kurzus alapadatok</CardTitle>
                <CardDescription>
                  Add meg a kurzus alapvető információit. Ezek később módosíthatók.
                </CardDescription>
              </CardHeader>
              <CourseBasicInfoStep
                initial={basicInfo || undefined}
                courseType={courseType || undefined}
                onSubmit={handleBasicInfoSubmit}
              />
            </div>
          )}

          {currentStep === 2 && courseId && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Leckék hozzáadása</CardTitle>
                <CardDescription>
                  Add hozzá a leckéket. A sorrend húzással módosítható.
                  {courseType === 'MASTERCLASS' && ' Masterclass esetén importálhatsz leckéket más kurzusokból.'}
                </CardDescription>
              </CardHeader>
              <CourseLessonsStep courseId={courseId} />
            </div>
          )}

          {currentStep === 3 && courseId && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Áttekintés és publikálás</CardTitle>
                <CardDescription>
                  Tekintsd át a kurzust és publikáld, hogy elérhető legyen a diákok számára.
                </CardDescription>
              </CardHeader>
              <CoursePublishStep 
                courseId={courseId} 
                onPublish={handlePublish}
                isPublishing={isPublishing}
                isPublished={false}
              />
            </div>
          )}
        </CardContent>

        {/* Navigation */}
        {currentStep === 2 && (
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Előző
              </Button>

              <div className="flex items-center gap-2">
                {!canProceed(2) && (
                  <div className="text-sm text-muted-foreground">
                    <p>Adj hozzá legalább egy leckét a folytatáshoz</p>
                  </div>
                )}

                <span className="text-sm text-muted-foreground">
                  {lessons.length} lecke
                </span>

                <Button
                  onClick={() => {
                    markStepCompleted(2);
                    setCurrentStep(3);
                  }}
                  disabled={!canProceed(2)}
                >
                  Következő
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan ki akarsz lépni?</AlertDialogTitle>
            <AlertDialogDescription>
              A kurzus létrehozása folyamatban van. Ha kilépsz, a piszkozat mentésre kerül és később folytathatod.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégsem</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>
              Kilépés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}