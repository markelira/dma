import { useQuery } from '@tanstack/react-query'
import { Category } from '@/types'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

interface GetCategoriesResponse {
  success: boolean
  categories: Category[]
  error?: string
}

// Fix sorrend a kategóriákhoz
const CATEGORY_ORDER = ['Ügyvezetés', 'HR', 'Marketing', 'Értékesítés', 'Működés'];

export const useCategories = () => {
  const { authReady } = useAuthStore()

  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const getCategoriesFn = httpsCallable<{}, GetCategoriesResponse>(
          functions,
          'getCategories'
        )
        const result = await getCategoriesFn({})

        if (!result.data.success) {
          throw new Error(result.data.error || 'Kategóriák betöltése sikertelen')
        }

        // Sorrendezés a fix sorrend szerint
        const sorted = [...result.data.categories].sort((a, b) => {
          const indexA = CATEGORY_ORDER.indexOf(a.name);
          const indexB = CATEGORY_ORDER.indexOf(b.name);
          // Ha nincs a listában, a végére kerül
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        return sorted
      } catch (error) {
        console.error('[useCategories] Error fetching categories:', error)
        throw error
      }
    },
    // Wait for Firebase Auth to initialize before calling the function
    // This ensures the auth context is ready (even if user is not logged in)
    enabled: authReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
} 