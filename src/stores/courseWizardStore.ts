import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lesson, CourseType } from '@/types';

export interface WizardBasicInfo {
  title: string;
  description: string;
  categoryId: string;
  categoryIds?: string[];
  instructorId: string;
  instructorIds?: string[];
  language?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  certificateEnabled?: boolean;
  thumbnailUrl?: string;
  // Marketing fields
  whatYouWillLearn?: string[];
  targetAudienceIds?: string[]; // Entity-based target audiences
}

interface WizardLesson extends Omit<Lesson, 'id'> {
  id?: string;
  tempId?: string;
  videoAssetId?: string;
  videoUploadProgress?: number;
  isImported?: boolean; // For MASTERCLASS imported lessons
  sourceCourseid?: string; // Original course ID for imported lessons
  sourceLessonId?: string; // Original lesson ID for imported lessons
  // Pending video file metadata (for UI display - actual File stored separately)
  pendingVideoFile?: {
    name: string;
    size: number;
    type: string;
  };
}

// Non-persisted storage for actual File objects (can't serialize to localStorage)
const pendingVideoFilesMap = new Map<string, File>();

// Export functions to access the file map
export const getPendingVideoFile = (lessonId: string): File | undefined => {
  return pendingVideoFilesMap.get(lessonId);
};

export const getAllPendingVideoFiles = (): Map<string, File> => {
  return pendingVideoFilesMap;
};

export const clearAllPendingVideoFiles = (): void => {
  pendingVideoFilesMap.clear();
};

interface CourseWizardState {
  // Step tracking
  currentStep: number;
  completedSteps: number[];

  // Course data
  courseId: string | null;
  courseType: CourseType | null;
  basicInfo: WizardBasicInfo | null;

  // Flat lessons (replaces modules)
  lessons: WizardLesson[];

  // For MASTERCLASS - imported lesson references
  importedLessonIds: string[];

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
  setCourseType: (type: CourseType) => void;
  setBasicInfo: (info: WizardBasicInfo) => void;

  // Flat lesson actions (replaces module actions)
  addLesson: (lesson: Omit<WizardLesson, 'order'>) => void;
  updateLesson: (lessonId: string, updates: Partial<WizardLesson>) => void;
  deleteLesson: (lessonId: string) => void;
  reorderLessons: (startIndex: number, endIndex: number) => void;
  setLessons: (lessons: WizardLesson[]) => void;

  // Import actions for MASTERCLASS
  importLessons: (lessons: WizardLesson[]) => void;
  removeImportedLesson: (lessonId: string) => void;

  // Upload actions
  setUploadProgress: (lessonId: string, progress: number, status: 'pending' | 'uploading' | 'completed' | 'failed', error?: string) => void;

  // Pending video file actions
  setPendingVideoFile: (lessonId: string, file: File | null) => void;
  clearPendingVideoFile: (lessonId: string) => void;

  // Validation
  setValidationErrors: (step: string, errors: string[]) => void;
  clearValidationErrors: (step?: string) => void;

  // Reset
  resetWizard: () => void;
}

const initialState = {
  currentStep: 0,
  completedSteps: [],
  courseId: null,
  courseType: null,
  basicInfo: null,
  lessons: [],
  importedLessonIds: [],
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
        completedSteps: Array.from(new Set([...state.completedSteps, step])).sort()
      })),

      // Course data
      setCourseId: (id) => set({ courseId: id }),
      setCourseType: (type) => set({ courseType: type }),
      setBasicInfo: (info) => set({ basicInfo: info }),

      // Flat lesson actions
      addLesson: (lesson) => set((state) => ({
        lessons: [...state.lessons, {
          ...lesson,
          id: lesson.id || `temp_${Date.now()}`,
          tempId: `temp_${Date.now()}`,
          order: state.lessons.length,
          courseId: state.courseId || '',
        }]
      })),

      updateLesson: (lessonId, updates) => set((state) => ({
        lessons: state.lessons.map(l =>
          (l.id === lessonId || l.tempId === lessonId)
            ? { ...l, ...updates }
            : l
        )
      })),

      deleteLesson: (lessonId) => set((state) => ({
        lessons: state.lessons
          .filter(l => l.id !== lessonId && l.tempId !== lessonId)
          .map((l, idx) => ({ ...l, order: idx })),
        importedLessonIds: state.importedLessonIds.filter(id => id !== lessonId)
      })),

      reorderLessons: (startIndex, endIndex) => set((state) => {
        const lessons = [...state.lessons];
        const [removed] = lessons.splice(startIndex, 1);
        lessons.splice(endIndex, 0, removed);
        return {
          lessons: lessons.map((l, idx) => ({ ...l, order: idx }))
        };
      }),

      setLessons: (lessons) => set({ lessons }),

      // Import actions for MASTERCLASS
      importLessons: (newLessons) => set((state) => {
        const currentOrder = state.lessons.length;
        const importedWithOrder = newLessons.map((lesson, idx) => ({
          ...lesson,
          order: currentOrder + idx,
          isImported: true,
        }));
        return {
          lessons: [...state.lessons, ...importedWithOrder],
          importedLessonIds: [
            ...state.importedLessonIds,
            ...newLessons.map(l => l.sourceLessonId || l.id || l.tempId || '')
          ].filter(Boolean)
        };
      }),

      removeImportedLesson: (lessonId) => set((state) => ({
        lessons: state.lessons
          .filter(l => l.id !== lessonId && l.tempId !== lessonId && l.sourceLessonId !== lessonId)
          .map((l, idx) => ({ ...l, order: idx })),
        importedLessonIds: state.importedLessonIds.filter(id => id !== lessonId)
      })),

      // Upload tracking
      setUploadProgress: (lessonId, progress, status, error) => set((state) => ({
        uploads: {
          ...state.uploads,
          [lessonId]: { progress, status, error }
        }
      })),

      // Pending video file management
      setPendingVideoFile: (lessonId, file) => {
        if (file) {
          // Store actual File object in non-persisted map
          pendingVideoFilesMap.set(lessonId, file);
          // Store metadata in state for UI display
          set((state) => ({
            lessons: state.lessons.map(l =>
              (l.id === lessonId || l.tempId === lessonId)
                ? {
                    ...l,
                    pendingVideoFile: {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    }
                  }
                : l
            )
          }));
        } else {
          // Clear the file
          pendingVideoFilesMap.delete(lessonId);
          set((state) => ({
            lessons: state.lessons.map(l =>
              (l.id === lessonId || l.tempId === lessonId)
                ? { ...l, pendingVideoFile: undefined }
                : l
            )
          }));
        }
      },

      clearPendingVideoFile: (lessonId) => {
        pendingVideoFilesMap.delete(lessonId);
        set((state) => ({
          lessons: state.lessons.map(l =>
            (l.id === lessonId || l.tempId === lessonId)
              ? { ...l, pendingVideoFile: undefined }
              : l
          )
        }));
      },

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
        courseType: state.courseType,
        basicInfo: state.basicInfo,
        lessons: state.lessons,
        importedLessonIds: state.importedLessonIds,
        uploads: state.uploads,
      }),
    }
  )
);
