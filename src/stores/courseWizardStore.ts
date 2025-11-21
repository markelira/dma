import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Module, Lesson, CourseType } from '@/types';

export interface WizardBasicInfo {
  title: string;
  description: string;
  categoryId: string;
  instructorId: string;
  instructorIds?: string[]; // NEW: Support multiple instructors
  language: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  certificateEnabled: boolean;
  thumbnailUrl?: string;
  learningObjectives: string;
}

interface WizardModule extends Omit<Module, 'lessons'> {
  lessons: WizardLesson[];
  tempId?: string; // For unsaved modules
}

interface WizardLesson extends Omit<Lesson, 'id'> {
  id?: string;
  tempId?: string; // For unsaved lessons
  videoAssetId?: string; // Mux asset ID
  videoUploadProgress?: number;
}

interface CourseWizardState {
  // Step tracking
  currentStep: number;
  completedSteps: number[];

  // Course data
  courseId: string | null;
  courseType: CourseType | null; // NEW: Selected course type
  basicInfo: WizardBasicInfo | null;
  modules: WizardModule[];
  
  // Upload states
  uploads: Record<string, {
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    error?: string;
  }>;
  
  // Validation states
  validationErrors: Record<string, string[]>;
  
  // Actions
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  setCourseId: (id: string) => void;
  setCourseType: (type: CourseType) => void; // NEW: Set course type
  setBasicInfo: (info: WizardBasicInfo) => void;
  
  // Module actions
  addModule: (module: Omit<WizardModule, 'id' | 'order'>) => void;
  updateModule: (moduleId: string, updates: Partial<WizardModule>) => void;
  deleteModule: (moduleId: string) => void;
  reorderModules: (startIndex: number, endIndex: number) => void;
  
  // Lesson actions
  addLesson: (moduleId: string, lesson: Omit<WizardLesson, 'order'>) => void;
  updateLesson: (moduleId: string, lessonId: string, updates: Partial<WizardLesson>) => void;
  deleteLesson: (moduleId: string, lessonId: string) => void;
  reorderLessons: (moduleId: string, startIndex: number, endIndex: number) => void;
  
  // Upload actions
  setUploadProgress: (lessonId: string, progress: number, status: 'pending' | 'uploading' | 'completed' | 'failed', error?: string) => void;
  
  // Validation
  setValidationErrors: (step: string, errors: string[]) => void;
  clearValidationErrors: (step?: string) => void;
  
  // Reset
  resetWizard: () => void;
}

const initialState = {
  currentStep: 0, // Start at Step 0 (type selection)
  completedSteps: [],
  courseId: null,
  courseType: null, // NEW: Initialize course type as null
  basicInfo: null,
  modules: [],
  uploads: {},
  validationErrors: {},
};

export const useCourseWizardStore = create<CourseWizardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Step management
      setCurrentStep: (step) => set({ currentStep: step }),
      markStepCompleted: (step) => set((state) => ({
        completedSteps: [...new Set([...state.completedSteps, step])].sort()
      })),

      // Course data
      setCourseId: (id) => set({ courseId: id }),
      setCourseType: (type) => set({ courseType: type }), // NEW: Set course type
      setBasicInfo: (info) => set({ basicInfo: info }),
      
      // Module actions
      addModule: (module) => set((state) => ({
        modules: [...state.modules, {
          ...module,
          id: `temp_${Date.now()}`,
          tempId: `temp_${Date.now()}`,
          order: state.modules.length,
          lessons: []
        }]
      })),
      
      updateModule: (moduleId, updates) => set((state) => ({
        modules: state.modules.map(m => 
          (m.id === moduleId || m.tempId === moduleId) 
            ? { ...m, ...updates } 
            : m
        )
      })),
      
      deleteModule: (moduleId) => set((state) => ({
        modules: state.modules
          .filter(m => m.id !== moduleId && m.tempId !== moduleId)
          .map((m, idx) => ({ ...m, order: idx }))
      })),
      
      reorderModules: (startIndex, endIndex) => set((state) => {
        const modules = [...state.modules];
        const [removed] = modules.splice(startIndex, 1);
        modules.splice(endIndex, 0, removed);
        return { 
          modules: modules.map((m, idx) => ({ ...m, order: idx })) 
        };
      }),
      
      // Lesson actions
      addLesson: (moduleId, lesson) => set((state) => ({
        modules: state.modules.map(m => {
          if (m.id === moduleId || m.tempId === moduleId) {
            return {
              ...m,
              lessons: [...m.lessons, {
                ...lesson,
                tempId: `temp_${Date.now()}`,
                order: m.lessons.length,
                moduleId: m.id || m.tempId!,
                courseId: state.courseId!
              }]
            };
          }
          return m;
        })
      })),
      
      updateLesson: (moduleId, lessonId, updates) => set((state) => ({
        modules: state.modules.map(m => {
          if (m.id === moduleId || m.tempId === moduleId) {
            return {
              ...m,
              lessons: m.lessons.map(l => 
                (l.id === lessonId || l.tempId === lessonId)
                  ? { ...l, ...updates }
                  : l
              )
            };
          }
          return m;
        })
      })),
      
      deleteLesson: (moduleId, lessonId) => set((state) => ({
        modules: state.modules.map(m => {
          if (m.id === moduleId || m.tempId === moduleId) {
            return {
              ...m,
              lessons: m.lessons
                .filter(l => l.id !== lessonId && l.tempId !== lessonId)
                .map((l, idx) => ({ ...l, order: idx }))
            };
          }
          return m;
        })
      })),
      
      reorderLessons: (moduleId, startIndex, endIndex) => set((state) => ({
        modules: state.modules.map(m => {
          if (m.id === moduleId || m.tempId === moduleId) {
            const lessons = [...m.lessons];
            const [removed] = lessons.splice(startIndex, 1);
            lessons.splice(endIndex, 0, removed);
            return {
              ...m,
              lessons: lessons.map((l, idx) => ({ ...l, order: idx }))
            };
          }
          return m;
        })
      })),
      
      // Upload tracking
      setUploadProgress: (lessonId, progress, status, error) => set((state) => ({
        uploads: {
          ...state.uploads,
          [lessonId]: { progress, status, error }
        }
      })),
      
      // Validation
      setValidationErrors: (step, errors) => set((state) => ({
        validationErrors: { ...state.validationErrors, [step]: errors }
      })),
      
      clearValidationErrors: (step) => set((state) => ({
        validationErrors: step 
          ? { ...state.validationErrors, [step]: [] }
          : {}
      })),
      
      // Reset
      resetWizard: () => set(initialState),
    }),
    {
      name: 'course-wizard-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        courseId: state.courseId,
        courseType: state.courseType, // NEW: Persist course type
        basicInfo: state.basicInfo,
        modules: state.modules,
        uploads: state.uploads,
      }),
    }
  )
);