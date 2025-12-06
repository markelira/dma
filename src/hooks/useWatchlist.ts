'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Fetch user's watchlist from Firestore
async function fetchWatchlist(userId: string): Promise<string[]> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return [];
  return userDoc.data()?.watchlist || [];
}

// Add course to watchlist
async function addToWatchlist(userId: string, courseId: string): Promise<void> {
  await setDoc(doc(db, 'users', userId), {
    watchlist: arrayUnion(courseId),
  }, { merge: true });
}

// Remove course from watchlist
async function removeFromWatchlist(userId: string, courseId: string): Promise<void> {
  await setDoc(doc(db, 'users', userId), {
    watchlist: arrayRemove(courseId),
  }, { merge: true });
}

export function useWatchlist() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?.uid;

  // Query for fetching watchlist
  const { data: watchlist = [], isLoading, error } = useQuery({
    queryKey: ['watchlist', userId],
    queryFn: () => fetchWatchlist(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for toggling watchlist
  const toggleMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const isCurrentlyInWatchlist = watchlist.includes(courseId);

      if (isCurrentlyInWatchlist) {
        await removeFromWatchlist(userId, courseId);
        return { action: 'removed', courseId };
      } else {
        await addToWatchlist(userId, courseId);
        return { action: 'added', courseId };
      }
    },
    onMutate: async (courseId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['watchlist', userId] });

      const previousWatchlist = queryClient.getQueryData<string[]>(['watchlist', userId]);

      queryClient.setQueryData<string[]>(['watchlist', userId], (old = []) => {
        if (old.includes(courseId)) {
          return old.filter(id => id !== courseId);
        } else {
          return [...old, courseId];
        }
      });

      return { previousWatchlist };
    },
    onSuccess: (data) => {
      if (data.action === 'added') {
        toast.success('Hozzáadva a listádhoz');
      } else {
        toast.success('Eltávolítva a listádból');
      }
    },
    onError: (error, _courseId, context) => {
      // Rollback on error
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', userId], context.previousWatchlist);
      }
      console.error('Watchlist error:', error);
      toast.error('Hiba történt');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
    },
  });

  // Helper function to check if a course is in watchlist
  const isInWatchlist = (courseId: string): boolean => {
    return watchlist.includes(courseId);
  };

  return {
    watchlist,
    isLoading,
    error,
    toggleWatchlist: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    isInWatchlist,
  };
}
