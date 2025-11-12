import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

interface EnrollmentStats {
  totalEnrolled: number
  activeInProgress: number
  completed: number
}

interface TrendData {
  totalEnrolledTrend: number
  activeInProgressTrend: number
  completedTrend: number
}

interface DashboardStatsResponse {
  success: boolean
  data?: {
    stats: EnrollmentStats
    trends: TrendData
  }
  error?: string
}

/**
 * Calculate stats client-side from Firestore as fallback
 */
async function calculateStatsClientSide(userId: string) {
  const enrollmentsRef = collection(db, 'enrollments')
  const q = query(enrollmentsRef, where('userId', '==', userId))
  const enrollmentsSnap = await getDocs(q)

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  let totalEnrolled = 0
  let activeInProgress = 0
  let completed = 0

  let prevTotalEnrolled = 0
  let prevActiveInProgress = 0
  let prevCompleted = 0

  enrollmentsSnap.forEach((doc) => {
    const data = doc.data()
    const enrolledAt = data.enrolledAt?.toDate() || new Date(0)

    // Current stats
    totalEnrolled++
    if (data.status === 'in_progress') activeInProgress++
    if (data.status === 'completed') completed++

    // Previous period stats
    if (enrolledAt >= sixtyDaysAgo && enrolledAt < thirtyDaysAgo) {
      prevTotalEnrolled++
      if (data.status === 'in_progress') prevActiveInProgress++
      if (data.status === 'completed') prevCompleted++
    }
  })

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    stats: {
      totalEnrolled,
      activeInProgress,
      completed,
    },
    trends: {
      totalEnrolledTrend: calculateTrend(totalEnrolled, prevTotalEnrolled),
      activeInProgressTrend: calculateTrend(activeInProgress, prevActiveInProgress),
      completedTrend: calculateTrend(completed, prevCompleted),
    },
  }
}

/**
 * Custom hook to fetch dashboard statistics
 *
 * Features:
 * - Tries to fetch from Cloud Function first
 * - Falls back to client-side calculation if function unavailable
 * - Automatic caching with 5-minute stale time
 * - Error handling
 * - Loading states
 *
 * @returns Query result with stats data, loading, and error states
 */
export function useDashboardStats() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['dashboardStats', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated')
      }

      try {
        // Try Cloud Function first
        const getDashboardStats = httpsCallable<{}, DashboardStatsResponse>(
          functions,
          'getDashboardStats'
        )

        const result = await getDashboardStats({})

        if (result.data.success && result.data.data) {
          return result.data.data
        }

        throw new Error('Cloud function returned no data')
      } catch (error) {
        console.warn('Cloud Function unavailable, using client-side calculation:', error)

        // Fallback to client-side calculation
        return await calculateStatsClientSide(user.uid)
      }
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 0, // Don't retry, fallback handles errors
    refetchOnWindowFocus: false,
  })
}
