import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Course Catalog Hook - Fetches courses for browse/discovery interface
 * Follows established React Query patterns from useUserProgress
 */

export interface CourseCatalogFilters {
  // Basic filtering
  categoryId?: string
  search?: string
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  language?: string
  certificateEnabled?: boolean
  isPlus?: boolean
  
  // Sorting and pagination
  sort?: 'createdAt' | 'popular' | 'trending' | 'rating' | 'new'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  
  // Catalog-specific options
  includeTrending?: boolean
  includeRecommendations?: boolean
  excludeEnrolled?: boolean
}

export interface CatalogCourse {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  language: string
  certificateEnabled: boolean
  isPlus: boolean
  createdAt: string
  updatedAt: string
  
  // Enriched data
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
  
  // Catalog metadata
  isEnrolled: boolean
  isTrending: boolean
  isRecommended: boolean
  enrollmentCount: number
  averageRating: number
  reviewCount: number
  popularityScore: number
  recommendationScore?: number
}

export interface CourseCatalogResponse {
  success: boolean
  courses: CatalogCourse[]
  total: number
  meta: {
    userEnrollmentCount: number
    userCategories: string[]
    hasRecommendations: boolean
    queryId: string
  }
  error?: string
}

/**
 * Fetches course catalog data using enhanced getCoursesWithFilters function
 */
async function fetchCoursesCatalog(filters: CourseCatalogFilters = {}): Promise<CourseCatalogResponse> {
  // DEVELOPMENT: Always return mock data to avoid Firebase calls
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [useCoursesCatalog] Development mode: using mock data');
    return {
      success: true,
      courses: [
        {
          id: 'sample-1',
          title: 'Modern React Fejlesztés',
          description: 'Alapfokú React fejlesztés modern eszközökkel',
          thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
          difficulty: 'INTERMEDIATE' as const,
          language: 'hu',
          certificateEnabled: true,
          isPlus: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructor: {
            id: 'inst-1',
            firstName: 'Dr. Kovács',
            lastName: 'János',
            profilePictureUrl: null
          },
          category: {
            id: 'cat-1',
            name: 'Webfejlesztés'
          },
          isEnrolled: false,
          isTrending: true,
          isRecommended: false,
          enrollmentCount: 2847,
          averageRating: 4.8,
          reviewCount: 234,
          popularityScore: 85,
          recommendationScore: undefined
        },
        {
          id: 'sample-2',
          title: 'Digital Marketing Stratégia',
          description: 'Hatékony digital marketing stratégiák',
          thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
          difficulty: 'BEGINNER' as const,
          language: 'hu',
          certificateEnabled: true,
          isPlus: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructor: {
            id: 'inst-2',
            firstName: 'Nagy',
            lastName: 'Éva',
            profilePictureUrl: null
          },
          category: {
            id: 'cat-2',
            name: 'Marketing'
          },
          isEnrolled: false,
          isTrending: true,
          isRecommended: true,
          enrollmentCount: 1923,
          averageRating: 4.9,
          reviewCount: 156,
          popularityScore: 92,
          recommendationScore: 88
        },
        {
          id: 'sample-3',
          title: 'Python Programozás Alapok',
          description: 'Ismerje meg a Python nyelv alapjait',
          thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
          difficulty: 'BEGINNER' as const,
          language: 'hu',
          certificateEnabled: true,
          isPlus: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructor: {
            id: 'inst-3',
            firstName: 'Szabó',
            lastName: 'Péter',
            profilePictureUrl: null
          },
          category: {
            id: 'cat-1',
            name: 'Programozás'
          },
          isEnrolled: false,
          isTrending: false,
          isRecommended: true,
          enrollmentCount: 3456,
          averageRating: 4.7,
          reviewCount: 312,
          popularityScore: 78,
          recommendationScore: 82
        }
      ],
      total: 3,
      meta: {
        userEnrollmentCount: 2,
        userCategories: ['Webfejlesztés', 'Marketing'],
        hasRecommendations: true,
        queryId: 'development-mock'
      }
    }
  }

  const getCoursesWithFilters = httpsCallable<CourseCatalogFilters, CourseCatalogResponse>(
    functions, 
    'getCoursesWithFilters'
  )
  
  try {
    console.log('🔍 [useCoursesCatalog] Fetching catalog with filters:', filters)
    const result = await getCoursesWithFilters(filters)
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to fetch courses catalog')
    }
    
    console.log('✅ [useCoursesCatalog] Successfully fetched catalog:', {
      courseCount: result.data.courses.length,
      total: result.data.total,
      hasRecommendations: result.data.meta.hasRecommendations
    })
    
    return result.data
  } catch (error) {
    console.error('❌ [useCoursesCatalog] Error fetching catalog:', error)
    
    // TEMPORARY: Return sample courses in development due to deployment issues
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ [useCoursesCatalog] Using sample data in development mode');
      return {
        success: true,
        courses: [
          {
            id: 'sample-1',
            title: 'Modern React Fejlesztés',
            description: 'Alapfokú React fejlesztés modern eszközökkel',
            thumbnailUrl: '/images/course-react.jpg',
            difficulty: 'INTERMEDIATE' as const,
            language: 'hu',
            certificateEnabled: true,
            isPlus: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            instructor: {
              id: 'inst-1',
              firstName: 'Dr. Kovács',
              lastName: 'János',
              profilePictureUrl: null
            },
            category: {
              id: 'cat-1',
              name: 'Webfejlesztés'
            },
            isEnrolled: false,
            isTrending: true,
            isRecommended: false,
            enrollmentCount: 2847,
            averageRating: 4.8,
            reviewCount: 234,
            popularityScore: 85,
            recommendationScore: undefined
          },
          {
            id: 'sample-2',
            title: 'Digital Marketing Stratégia',
            description: 'Hatékony digital marketing stratégiák',
            thumbnailUrl: '/images/course-marketing.jpg',
            difficulty: 'BEGINNER' as const,
            language: 'hu',
            certificateEnabled: true,
            isPlus: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            instructor: {
              id: 'inst-2',
              firstName: 'Nagy',
              lastName: 'Éva',
              profilePictureUrl: null
            },
            category: {
              id: 'cat-2',
              name: 'Marketing'
            },
            isEnrolled: false,
            isTrending: true,
            isRecommended: true,
            enrollmentCount: 1923,
            averageRating: 4.9,
            reviewCount: 156,
            popularityScore: 92,
            recommendationScore: 88
          }
        ],
        total: 2,
        meta: {
          userEnrollmentCount: 0,
          userCategories: ['Webfejlesztés', 'Marketing'],
          hasRecommendations: true,
          queryId: 'development-fallback'
        }
      }
    }
    
    // Production fallback with empty data
    return {
      success: true,
      courses: [],
      total: 0,
      meta: {
        userEnrollmentCount: 0,
        userCategories: [],
        hasRecommendations: false,
        queryId: 'fallback'
      }
    }
  }
}

/**
 * Hook for fetching personalized course recommendations
 */
export function usePersonalizedRecommendations(limit: number = 4) {
  return useQuery({
    queryKey: ['coursesCatalog', 'recommendations', limit],
    queryFn: () => fetchCoursesCatalog({
      includeRecommendations: true,
      excludeEnrolled: true,
      sort: 'popular',
      order: 'desc',
      limit
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes - recommendations change less frequently
  })
}

/**
 * Hook for fetching trending courses
 */
export function useTrendingCourses(limit: number = 6, type: 'trending' | 'popular' | 'new' = 'trending') {
  const getSortType = () => {
    switch (type) {
      case 'popular':
        return 'popular'
      case 'new':
        return 'createdAt'
      default:
        return 'trending'
    }
  }

  return useQuery({
    queryKey: ['coursesCatalog', type, limit],
    queryFn: () => fetchCoursesCatalog({
      includeTrending: type === 'trending',
      sort: getSortType(),
      order: 'desc',
      limit
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes - trending data changes more frequently
  })
}

/**
 * Hook for filterable course catalog with full search capabilities
 */
export function useCoursesCatalog(filters: CourseCatalogFilters = {}) {
  return useQuery({
    queryKey: ['coursesCatalog', 'filtered', filters],
    queryFn: () => fetchCoursesCatalog(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always enabled for catalog browsing
  })
}

/**
 * Hook for popular courses (high enrollment + high rating)
 */
export function usePopularCourses(limit: number = 6) {
  return useQuery({
    queryKey: ['coursesCatalog', 'popular', limit],
    queryFn: () => fetchCoursesCatalog({
      sort: 'popular',
      order: 'desc',
      limit
    }),
    staleTime: 15 * 60 * 1000, // 15 minutes - popular courses are relatively stable
  })
}

/**
 * Hook for category-specific courses
 */
export function useCoursesByCategory(categoryId: string, limit: number = 12) {
  return useQuery({
    queryKey: ['coursesCatalog', 'category', categoryId, limit],
    queryFn: () => fetchCoursesCatalog({
      categoryId,
      sort: 'popular',
      order: 'desc',
      limit
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!categoryId,
  })
}

// Export the main hook as default for convenience
export default useCoursesCatalog