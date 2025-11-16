/**
 * React Query hooks for instructor CRUD operations
 * Instructors are managed like categories - separate entities, not users
 */
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Instructor } from '@/types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Response types
interface GetInstructorsResponse {
  success: boolean;
  instructors: Instructor[];
  error?: string;
}

interface CreateInstructorResponse {
  success: boolean;
  message: string;
  instructor: Instructor;
  error?: string;
}

interface UpdateInstructorResponse {
  success: boolean;
  message: string;
  instructor: Instructor;
  error?: string;
}

interface DeleteInstructorResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Input types
interface CreateInstructorInput {
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface UpdateInstructorInput {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface DeleteInstructorInput {
  id: string;
}

/**
 * Hook to fetch all instructors
 * Public endpoint - no authentication required
 */
export const useInstructors = () => {
  const { authReady } = useAuthStore();

  return useQuery<Instructor[]>({
    queryKey: ['instructors'],
    queryFn: async () => {
      try {
        const getInstructorsFn = httpsCallable<{}, GetInstructorsResponse>(
          functions,
          'getInstructors'
        );
        const result = await getInstructorsFn({});

        if (!result.data.success) {
          throw new Error(result.data.error || 'Oktatók betöltése sikertelen');
        }

        return result.data.instructors;
      } catch (error) {
        console.error('[useInstructors] Error fetching instructors:', error);
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
 * Hook to create a new instructor
 * Admin only
 */
export const useCreateInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateInstructorResponse, Error, CreateInstructorInput>({
    mutationFn: async (data) => {
      try {
        const createInstructorFn = httpsCallable<CreateInstructorInput, CreateInstructorResponse>(
          functions,
          'createInstructor'
        );
        const result = await createInstructorFn(data);

        if (!result.data.success) {
          throw new Error(result.data.error || 'Oktató létrehozása sikertelen');
        }

        return result.data;
      } catch (error: any) {
        console.error('[useCreateInstructor] Error creating instructor:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Oktató sikeresen létrehozva');
      // Invalidate instructors cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Hiba történt az oktató létrehozásakor');
    },
  });
};

/**
 * Hook to update an existing instructor
 * Admin only
 */
export const useUpdateInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateInstructorResponse, Error, UpdateInstructorInput>({
    mutationFn: async (data) => {
      try {
        const updateInstructorFn = httpsCallable<UpdateInstructorInput, UpdateInstructorResponse>(
          functions,
          'updateInstructor'
        );
        const result = await updateInstructorFn(data);

        if (!result.data.success) {
          throw new Error(result.data.error || 'Oktató frissítése sikertelen');
        }

        return result.data;
      } catch (error: any) {
        console.error('[useUpdateInstructor] Error updating instructor:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Oktató sikeresen frissítve');
      // Invalidate instructors cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
    onError: (error: Error) {
      toast.error(error.message || 'Hiba történt az oktató frissítésekor');
    },
  });
};

/**
 * Hook to delete an instructor
 * Admin only - fails if instructor is assigned to any courses
 */
export const useDeleteInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteInstructorResponse, Error, DeleteInstructorInput>({
    mutationFn: async (data) => {
      try {
        const deleteInstructorFn = httpsCallable<DeleteInstructorInput, DeleteInstructorResponse>(
          functions,
          'deleteInstructor'
        );
        const result = await deleteInstructorFn(data);

        if (!result.data.success) {
          throw new Error(result.data.error || 'Oktató törlése sikertelen');
        }

        return result.data;
      } catch (error: any) {
        console.error('[useDeleteInstructor] Error deleting instructor:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Oktató sikeresen törölve');
      // Invalidate instructors cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
    onError: (error: Error) {
      toast.error(error.message || 'Hiba történt az oktató törlésekor');
    },
  });
};
