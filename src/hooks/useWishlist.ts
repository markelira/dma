import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { toast } from 'sonner'

interface WishlistItem {
  id: string
  courseId: string
  createdAt: string
  course: {
    id: string
    title: string
    description: string
    thumbnailUrl?: string
    status: string
    instructor: {
      id: string
      firstName: string
      lastName: string
      profilePictureUrl?: string
    }
    category: {
      id: string
      name: string
    }
  }
}

interface WishlistResponse {
  wishlist: WishlistItem[]
}

interface WishlistStatusResponse {
  isInWishlist: boolean
}

// Hook to get user's wishlist
export const useWishlist = () => {
  return useQuery<WishlistResponse>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const getWishlist = httpsCallable(functions, 'getWishlist')
      const result: any = await getWishlist()
      return result.data as WishlistResponse
    },
    enabled: false, // Only fetch when explicitly called
  })
}

// Hook to check if a course is in wishlist
export const useWishlistStatus = (courseId: string) => {
  return useQuery<WishlistStatusResponse>({
    queryKey: ['wishlist-status', courseId],
    queryFn: async () => {
      const getWishlistStatus = httpsCallable(functions, 'getWishlistStatus')
      const result: any = await getWishlistStatus({ courseId })
      return result.data as WishlistStatusResponse
    },
    enabled: !!courseId,
  })
}

// Hook to add course to wishlist
export const useAddToWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      const addToWishlist = httpsCallable(functions, 'addToWishlist')
      const result: any = await addToWishlist({ courseId })
      return result.data
    },
    onSuccess: (data, courseId) => {
      toast.success('Kurzus hozzáadva a kívánságlistához')
      
      // Update wishlist status
      queryClient.setQueryData(['wishlist-status', courseId], { isInWishlist: true })
      
      // Invalidate wishlist to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Hiba történt a kívánságlistához adáskor')
    }
  })
}

// Hook to remove course from wishlist
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      const removeFromWishlist = httpsCallable(functions, 'removeFromWishlist')
      const result: any = await removeFromWishlist({ courseId })
      return result.data
    },
    onSuccess: (data, courseId) => {
      toast.success('Kurzus eltávolítva a kívánságlistából')
      
      // Update wishlist status
      queryClient.setQueryData(['wishlist-status', courseId], { isInWishlist: false })
      
      // Invalidate wishlist to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Hiba történt a kívánságlistából való eltávolításkor')
    }
  })
}

// Hook to toggle wishlist status
export const useToggleWishlist = () => {
  const addToWishlist = useAddToWishlist()
  const removeFromWishlist = useRemoveFromWishlist()

  return {
    toggle: (courseId: string, isInWishlist: boolean) => {
      if (isInWishlist) {
        removeFromWishlist.mutate(courseId)
      } else {
        addToWishlist.mutate(courseId)
      }
    },
    isLoading: addToWishlist.isPending || removeFromWishlist.isPending
  }
} 