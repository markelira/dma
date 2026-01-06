/**
 * React Query hooks for instructor CRUD operations
 * Instructors are managed like categories - separate entities, not users
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Instructor, InstructorRole } from '@/types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
// REMOVED: useAuthStore - no longer needed for public data queries
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
  role?: InstructorRole;
}

interface UpdateInstructorInput {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
  role?: InstructorRole;
}

interface DeleteInstructorInput {
  id: string;
}

/**
 * Hook to fetch all instructors
 * Public endpoint - no authentication required
 */
export const useInstructors = () => {
  // FIXED: Removed authReady dependency - instructors are public data
  // No need to wait for Firebase Auth for public endpoints

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
    // FIXED: Removed enabled: authReady - this is public data, fetch immediately
    // COST OPTIMIZATION: Instructors rarely change, cache for 30 minutes
    // This reduces function calls from ~340/day to ~60/day
    staleTime: 30 * 60 * 1000, // 30 minutes (was 5 minutes)
    gcTime: 60 * 60 * 1000, // 60 minutes (was 10 minutes)
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on tab focus for static data
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

        // Invalidate instructors cache to refetch the list
        queryClient.invalidateQueries({ queryKey: ['instructors'] });
        toast.success(result.data.message || 'Oktató sikeresen létrehozva');

        return result.data;
      } catch (error: any) {
        console.error('[useCreateInstructor] Error creating instructor:', error);
        toast.error(error.message || 'Hiba történt az oktató létrehozásakor');
        throw error;
      }
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

        // Invalidate instructors cache to refetch the list
        queryClient.invalidateQueries({ queryKey: ['instructors'] });
        toast.success(result.data.message || 'Oktató sikeresen frissítve');

        return result.data;
      } catch (error: any) {
        console.error('[useUpdateInstructor] Error updating instructor:', error);
        toast.error(error.message || 'Hiba történt az oktató frissítésekor');
        throw error;
      }
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

        // Invalidate instructors cache to refetch the list
        queryClient.invalidateQueries({ queryKey: ['instructors'] });
        toast.success(result.data.message || 'Oktató sikeresen törölve');

        return result.data;
      } catch (error: any) {
        console.error('[useDeleteInstructor] Error deleting instructor:', error);
        toast.error(error.message || 'Hiba történt az oktató törlésekor');
        throw error;
      }
    },
  });
};
