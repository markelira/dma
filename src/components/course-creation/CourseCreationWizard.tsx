"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import CourseTypeSelection from './CourseTypeSelection';
import CourseBasicInfoStep, { BasicInfoData } from './CourseBasicInfoStep';
import CurriculumStructureStep from './CurriculumStructureStep';
import CoursePublishStep from './CoursePublishStep';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions, db } from '@/lib/firebase';
import { collection, doc, getDocs, query, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useCourseWizardStore } from '@/stores/courseWizardStore';
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
    description: 'Válassz kurzus típust',
    validation: ['courseType']
  },
  {
    id: 1,
    title: 'Alapadatok',
    description: 'Kurzus alapinformációk megadása',
    validation: ['title', 'description', 'categoryId', 'instructorId', 'learningObjectives']
  },
  {
    id: 2,
    title: 'Tanterv',
    description: 'Modulok és leckék létrehozása',
    validation: ['modules']
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
  const [firestoreModuleCount, setFirestoreModuleCount] = useState(0);
  const [firestoreLessonCount, setFirestoreLessonCount] = useState(0);
  
  const {
    currentStep,
    completedSteps,
    courseId,
    courseType,
    basicInfo,
    modules,
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

  // Check actual Firestore content for step 2 validation
  const checkFirestoreContent = async () => {
    if (!courseId) {
      console.log('❌ No courseId for Firestore check');
      return;
    }
    
    try {
      console.log('🔍 Checking Firestore content for courseId:', courseId);
      
      // Count modules
      const modulesPath = collection(doc(db, 'courses', courseId), 'modules');
      console.log('📂 Checking modules path:', `courses/${courseId}/modules`);
      
      const modulesSnapshot = await getDocs(modulesPath);
      const moduleCount = modulesSnapshot.size;
      setFirestoreModuleCount(moduleCount);
      
      console.log('📊 Found modules:', moduleCount);
      
      // Count lessons across all modules
      let totalLessons = 0;
      const moduleDetails = [];
      
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleData = moduleDoc.data();
        console.log('📋 Module:', moduleDoc.id, moduleData);
        
        const lessonsPath = collection(doc(db, 'courses', courseId, 'modules', moduleDoc.id), 'lessons');
        console.log('📂 Checking lessons path:', `courses/${courseId}/modules/${moduleDoc.id}/lessons`);
        
        const lessonsSnapshot = await getDocs(lessonsPath);
        const lessonCount = lessonsSnapshot.size;
        totalLessons += lessonCount;
        
        moduleDetails.push({
          id: moduleDoc.id,
          title: moduleData.title,
          lessons: lessonCount
        });
        
        console.log('📋 Module lessons:', moduleDoc.id, lessonCount);
      }
      
      setFirestoreLessonCount(totalLessons);
      
      console.log('📊 Firestore content check complete:', {
        courseId,
        modules: moduleCount,
        lessons: totalLessons,
        details: moduleDetails
      });
      
    } catch (error) {
      console.error('❌ Error checking Firestore content:', error);
      console.error('❌ CourseId was:', courseId);
    }
  };

  // Auto-refresh Firestore content when on step 2 (curriculum)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (courseId && currentStep === 2) {
      // Initial check
      checkFirestoreContent();

      // Set up auto-refresh every 3 seconds while on step 2
      // This ensures the "Next" button becomes enabled when modules/lessons are added
      intervalId = setInterval(() => {
        checkFirestoreContent();
      }, 3000);
    }

    // Cleanup interval when leaving step 2
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [courseId, currentStep]);

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
    toast.success(`${type === 'ACADEMIA' ? 'Akadémia' : type === 'WEBINAR' ? 'Webinár' : 'Masterclass'} típus kiválasztva`);
  };

  // Check if can proceed to next step
  const canProceed = (stepId: number) => {
    if (stepId === 0) return !!courseType;
    if (stepId === 1) return !!courseId;
    if (stepId === 2) {
      // Check Firestore directly since CurriculumStructureStep works with Firestore
      const hasFirestoreContent = firestoreModuleCount > 0 && firestoreLessonCount > 0;
      
      // Also check store as backup
      const hasStoreModules = modules.length > 0 && modules.some(m => m.lessons.length > 0);
      
      console.log('🔍 Step 2 validation:', {
        firestoreModules: firestoreModuleCount,
        firestoreLessons: firestoreLessonCount,
        hasFirestoreContent,
        storeModules: modules.length,
        hasStoreModules,
        canProceed: hasFirestoreContent || hasStoreModules
      });
      
      return hasFirestoreContent || hasStoreModules;
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

      // Navigate to next step - skip curriculum for webinars
      if (courseType === 'WEBINAR') {
        // For webinars, skip curriculum step and go directly to publish
        markStepCompleted(2); // Mark curriculum as complete
        setCurrentStep(3); // Go to publish
        toast.info('Webinár típusnál nincs tanterv lépés - egy videó leckét fog tartalmazni');
      } else {
        // For Academia and Masterclass, go to curriculum step
        setCurrentStep(2);
      }
    } catch (err: any) {
      console.error('Error saving basic info:', err);
      toast.error(err.message || 'Hiba történt a mentés során');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle course publish
  const handlePublish = async () => {
    if (!courseId) {
      toast.error('Nincs kurzus ID a publikáláshoz');
      return;
    }

    // Check Firestore content before publish and get fresh counts
    await checkFirestoreContent();
    
    // Wait a moment for state to update, then check again
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get fresh counts directly from Firestore instead of relying on state
    let moduleCount = firestoreModuleCount;
    let lessonCount = firestoreLessonCount;
    
    // If counts are still 0, do a direct check
    if (moduleCount === 0 || lessonCount === 0) {
      try {
        const modulesSnapshot = await getDocs(
          collection(doc(db, 'courses', courseId), 'modules')
        );
        moduleCount = modulesSnapshot.size;
        
        let totalLessons = 0;
        for (const moduleDoc of modulesSnapshot.docs) {
          const lessonsSnapshot = await getDocs(
            collection(doc(db, 'courses', courseId, 'modules', moduleDoc.id), 'lessons')
          );
          totalLessons += lessonsSnapshot.size;
        }
        lessonCount = totalLessons;
        
        console.log('🔄 Direct Firestore check for publish:', {
          modules: moduleCount,
          lessons: lessonCount
        });
      } catch (error) {
        console.error('Error in direct Firestore check:', error);
      }
    }
    
    // Validate before publish using fresh counts
    if (moduleCount === 0) {
      toast.error('Legalább egy modul szükséges a publikáláshoz');
      return;
    }

    if (lessonCount === 0) {
      toast.error('Legalább egy lecke szükséges a publikáláshoz');
      return;
    }

    console.log('✅ Publishing validation passed:', {
      modules: moduleCount,
      lessons: lessonCount
    });

    setIsPublishing(true);
    try {
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
            moduleCount,
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
                <CardTitle>Tanterv összeállítása</CardTitle>
                <CardDescription>
                  Hozz létre modulokat és adj hozzájuk leckéket. A sorrend később is módosítható.
                </CardDescription>
              </CardHeader>
              <CurriculumStructureStep courseId={courseId} />
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
                    <p>Adj hozzá legalább egy modult és leckét a folytatáshoz</p>
                    <p className="text-xs mt-1">
                      Jelenleg: {firestoreModuleCount} modul, {firestoreLessonCount} lecke
                    </p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Manual refresh clicked');
                    checkFirestoreContent();
                  }}
                  disabled={!courseId}
                >
                  Frissítés ({firestoreModuleCount}m, {firestoreLessonCount}l)
                </Button>
                
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