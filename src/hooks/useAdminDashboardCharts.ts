import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// TypeScript interfaces for chart data
export interface UserGrowthData {
  month: string
  newUsers: number
}

export interface CourseEnrollmentData {
  courseName: string
  enrollments: number
}

export interface RevenueData {
  name: string
  revenue: number
}

export interface AdminChartData {
  userGrowthData: UserGrowthData[]
  courseEnrollmentData: CourseEnrollmentData[]
  revenueData: RevenueData[]
}

// Hungarian error messages
const ERROR_MESSAGES = {
  FETCH_FAILED: 'Nem sikerült betölteni a diagram adatokat',
  UNAUTHORIZED: 'Nincs jogosultsága a diagram adatok megtekintéséhez',
  SERVER_ERROR: 'Szerver hiba történt a diagram adatok betöltése közben',
  NETWORK_ERROR: 'Hálózati kapcsolat hiba - ellenőrizze az internetkapcsolatát',
  TIMEOUT: 'Időtúllépés a diagram adatok betöltése közben',
  UNKNOWN: 'Ismeretlen hiba történt a diagram adatok betöltése közben'
}

// Helper function to get appropriate error message
const getErrorMessage = (error: any): string => {
  if (error?.message?.includes('Nincs jogosultság')) {
    return ERROR_MESSAGES.UNAUTHORIZED
  }
  if (error?.message?.includes('Szerver hiba')) {
    return ERROR_MESSAGES.SERVER_ERROR
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT
  }
  if (error?.message?.includes('Network Error') || !error?.response) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  return ERROR_MESSAGES.FETCH_FAILED
}

// Fetch function for chart data
const fetchAdminChartData = async (): Promise<AdminChartData> => {
  try {
    const getAdminCharts = httpsCallable(functions, 'getAdminCharts')
    const result = await getAdminCharts()
    return result.data as AdminChartData
  } catch (error: any) {
    console.error('Admin chart data fetch error:', error)
    throw new Error(getErrorMessage(error))
  }
}

// Main hook for admin dashboard charts
export function useAdminDashboardCharts() {
  return useQuery<AdminChartData, Error>({
    queryKey: ['adminDashboardCharts'],
    queryFn: fetchAdminChartData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error?.message?.includes(ERROR_MESSAGES.UNAUTHORIZED)) {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
  })
}

// Individual chart data hooks for more granular control
export function useUserGrowthData() {
  const { data, isLoading, error } = useAdminDashboardCharts()
  return {
    data: data?.userGrowthData || [],
    isLoading,
    error
  }
}

export function useCourseEnrollmentData() {
  const { data, isLoading, error } = useAdminDashboardCharts()
  return {
    data: data?.courseEnrollmentData || [],
    isLoading,
    error
  }
}

export function useRevenueData() {
  const { data, isLoading, error } = useAdminDashboardCharts()
  return {
    data: data?.revenueData || [],
    isLoading,
    error
  }
}

// Connection status hook for admin dashboard
export function useAdminDashboardConnectionStatus() {
  return 'online' // Simplified for now - Firebase handles connection status
} 