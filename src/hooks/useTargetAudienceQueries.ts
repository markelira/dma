/**
 * React Query hooks for Target Audience CRUD operations
 * Target Audiences are managed like categories - separate entities for course targeting
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TargetAudience } from '@/types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Response types
interface GetTargetAudiencesResponse {
  success: boolean;
  targetAudiences: TargetAudience[];
  error?: string;
}

interface CreateTargetAudienceResponse {
  success: boolean;
  message: string;
  targetAudience: TargetAudience;
  error?: string;
}

interface UpdateTargetAudienceResponse {
  success: boolean;
  message: string;
  targetAudience: TargetAudience;
  error?: string;
}

interface DeleteTargetAudienceResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Input types
interface CreateTargetAudienceInput {
  name: string;
  description?: string;
}

interface UpdateTargetAudienceInput {
  id: string;
  name: string;
  description?: string;
}

interface DeleteTargetAudienceInput {
  id: string;
}

/**
 * Hook to fetch all target audiences
 * Public endpoint - no authentication required
 */
export const useTargetAudiences = () => {
  const { authReady } = useAuthStore();

  return useQuery<TargetAudience[]>({
    queryKey: ['target-audiences'],
    queryFn: async () => {
      try {
        const getTargetAudiencesFn = httpsCallable<object, GetTargetAudiencesResponse>(
          functions,
          'getTargetAudiences'
        );
        const result = await getTargetAudiencesFn({});

        if (!result.data.success) {
          throw new Error(result.data.error || 'Célközönségek betöltése sikertelen');
        }

        return result.data.targetAudiences;
      } catch (error) {
        console.error('[useTargetAudiences] Error fetching target audiences:', error);
        throw error;
      }
    },
    // Wait for Firebase Auth to initialize before calling the function
    enabled: authReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * Hook to create a new target audience
 * Admin only
 */
export const useCreateTargetAudience = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTargetAudienceResponse, Error, CreateTargetAudienceInput>({
    mutationFn: async (data) => {
      try {
        const createTargetAudienceFn = httpsCallable<CreateTargetAudienceInput, CreateTargetAudienceResponse>(
          functions,
          'createTargetAudience'
        );
        const result = await createTargetAudienceFn(data);

        if (!result.data.success) {
          throw new Error(result.data.error || 'Célközönség létrehozása sikertelen');
        }

        // Invalidate target audiences cache to refetch the list
        queryClient.invalidateQueries({ queryKey: ['target-audiences'] });
        toast.success(result.data.message || 'Célközönség sikeresen létrehozva');

        return result.data;
      } catch (error: unknown) {
        console.error('[useCreateTargetAudience] Error creating target audience:', error);
        const errorMessage = error instanceof Error ? error.message : 'Hiba történt a célközönség létrehozásakor';
        toast.error(errorMessage);
        throw error;
      }
    },
  });
};

/**
 * Hook to update an existing target audience
 * Admin only
 */
export const useUpdateTargetAudience = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTargetAudienceResponse, Error, UpdateTargetAudienceInput>({
    mutationFn: async (data) => {
      try {
        const updateTargetAudienceFn = httpsCallable<UpdateTargetAudienceInput, UpdateTargetAudienceResponse>(
          functions,
          'updateTargetAudience'
        );
        const result = await updateTargetAudienceFn(data);

        if (!result.data.success) {
          throw new Error(result.data.error || 'Célközönség frissítése sikertelen');
        }

        // Invalidate target audiences cache to refetch the list
        queryClient.invalidateQueries({ queryKey: ['target-audiences'] });
        toast.success(result.data.message || 'Célközönség sikeresen frissítve');

        return result.data;
      } catch (error: unknown) {
        console.error('[useUpdateTargetAudience] Error updating target audience:', error);
        const errorMessage = error instanceof Error ? error.message : 'Hiba történt a célközönség frissítésekor';
        toast.error(errorMessage);
        throw error;
      }
    },
  });
};

/**
 * Hook to delete a target audience
 * Admin only - fails if target audience is assigned to any courses
 */
export const useDeleteTargetAudience = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteTargetAudienceResponse, Error, DeleteTargetAudienceInput>({
    mutationFn: async (data) => {
      try {
        const deleteTargetAudienceFn = httpsCallable<DeleteTargetAudienceInput, DeleteTargetAudienceResponse>(
          functions,
          'deleteTargetAudience'
        );
        const result = await deleteTargetAudienceFn(data);

        if (!result.data.success) {
          throw new Error(result.data.error || 'Célközönség törlése sikertelen');
        }

        // Invalidate target audiences cache to refetch the list
        queryClient.invalidateQueries({ queryKey: ['target-audiences'] });
        toast.success(result.data.message || 'Célközönség sikeresen törölve');

        return result.data;
      } catch (error: unknown) {
        console.error('[useDeleteTargetAudience] Error deleting target audience:', error);
        const errorMessage = error instanceof Error ? error.message : 'Hiba történt a célközönség törlésekor';
        toast.error(errorMessage);
        throw error;
      }
    },
  });
};
