import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type {
  UserPreferences,
  LearningGoal,
  LearningStreak,
  UserAchievement,
  DashboardAnalytics,
} from '@/types';

// ============================================================================
// USER PREFERENCES HOOKS
// ============================================================================

export function useUserPreferences() {
  return useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const getUserPreferences = httpsCallable(functions, 'getUserPreferences');
      const result = await getUserPreferences();
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a beállítások lekérdezésekor');
      }

      return data.data as UserPreferences | null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSaveUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const saveUserPreferences = httpsCallable(functions, 'saveUserPreferences');
      const result = await saveUserPreferences(preferences);
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a beállítások mentésekor');
      }

      return data.data as UserPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}

// ============================================================================
// LEARNING GOALS HOOKS
// ============================================================================

export function useLearningGoals(status?: 'active' | 'completed' | 'abandoned') {
  return useQuery({
    queryKey: ['learningGoals', status],
    queryFn: async () => {
      const getLearningGoals = httpsCallable(functions, 'getLearningGoals');
      const result = await getLearningGoals({ status });
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a célok lekérdezésekor');
      }

      return data.data as LearningGoal[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateLearningGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<LearningGoal, 'id' | 'userId' | 'current' | 'status' | 'createdAt' | 'updatedAt'>) => {
      const createLearningGoal = httpsCallable(functions, 'createLearningGoal');
      const result = await createLearningGoal(goal);
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a cél létrehozásakor');
      }

      return data.data as LearningGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningGoals'] });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: string; progress: number }) => {
      const updateGoalProgress = httpsCallable(functions, 'updateGoalProgress');
      const result = await updateGoalProgress({ goalId, progress });
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a haladás frissítésekor');
      }

      return data.data as LearningGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningGoals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });
}

export function useDeleteLearningGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const deleteLearningGoal = httpsCallable(functions, 'deleteLearningGoal');
      const result = await deleteLearningGoal({ goalId });
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a cél törlésekor');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningGoals'] });
    },
  });
}

// ============================================================================
// LEARNING STREAK HOOKS
// ============================================================================

export function useLearningStreak() {
  return useQuery({
    queryKey: ['learningStreak'],
    queryFn: async () => {
      const getLearningStreak = httpsCallable(functions, 'getLearningStreak');
      const result = await getLearningStreak();
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a sorozat lekérdezésekor');
      }

      return data.data as LearningStreak;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpdateLearningStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (minutesLearned: number) => {
      const updateLearningStreak = httpsCallable(functions, 'updateLearningStreak');
      const result = await updateLearningStreak({ minutesLearned });
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a sorozat frissítésekor');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningStreak'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });
}

// ============================================================================
// ACHIEVEMENTS HOOKS
// ============================================================================

export function useUserAchievements() {
  return useQuery({
    queryKey: ['userAchievements'],
    queryFn: async () => {
      const getUserAchievements = httpsCallable(functions, 'getUserAchievements');
      const result = await getUserAchievements();
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a jelvények lekérdezésekor');
      }

      return data.data as UserAchievement[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllAchievements() {
  return useQuery({
    queryKey: ['allAchievements'],
    queryFn: async () => {
      const getAllAchievements = httpsCallable(functions, 'getAllAchievements');
      const result = await getAllAchievements();
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a jelvények lekérdezésekor');
      }

      return {
        achievements: data.data as UserAchievement[],
        unlockedCount: data.unlockedCount as number,
        totalCount: data.totalCount as number,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventType, metadata }: { eventType: string; metadata: any }) => {
      const checkAchievements = httpsCallable(functions, 'checkAchievements');
      const result = await checkAchievements({ eventType, metadata });
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a jelvények ellenőrzésekor');
      }

      return {
        newlyUnlocked: data.newlyUnlocked as UserAchievement[],
        count: data.count as number,
        message: data.message as string,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements'] });
      queryClient.invalidateQueries({ queryKey: ['allAchievements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });
}

export function useMarkAchievementCelebrated() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      const markAchievementCelebrated = httpsCallable(functions, 'markAchievementCelebrated');
      const result = await markAchievementCelebrated({ achievementId });
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba a jelvény frissítésekor');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements'] });
      queryClient.invalidateQueries({ queryKey: ['allAchievements'] });
    },
  });
}

// ============================================================================
// DASHBOARD ANALYTICS HOOKS
// ============================================================================

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const getDashboardAnalytics = httpsCallable(functions, 'getDashboardAnalytics');
      const result = await getDashboardAnalytics();
      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Hiba az analitika lekérdezésekor');
      }

      return data.data as DashboardAnalytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// COMPOSITE HOOKS (combine multiple queries)
// ============================================================================

export function useGamificationData() {
  const preferences = useUserPreferences();
  const streak = useLearningStreak();
  const analytics = useDashboardAnalytics();
  const achievements = useAllAchievements();
  const goals = useLearningGoals('active');

  return {
    preferences,
    streak,
    analytics,
    achievements,
    goals,
    isLoading:
      preferences.isLoading ||
      streak.isLoading ||
      analytics.isLoading ||
      achievements.isLoading ||
      goals.isLoading,
    isError:
      preferences.isError ||
      streak.isError ||
      analytics.isError ||
      achievements.isError ||
      goals.isError,
  };
}
