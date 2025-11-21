import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { firestore } from './admin';
import * as z from 'zod';

/**
 * Dashboard Statistics Cloud Functions
 *
 * Provides analytics and statistics for the student dashboard
 */

// Schema for getDashboardStats input (no input needed, uses auth context)
const GetDashboardStatsSchema = z.object({
  // Optional: date range filter
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface EnrollmentStats {
  totalEnrolled: number;
  activeInProgress: number;
  completed: number;
}

interface TrendData {
  totalEnrolledTrend: number;
  activeInProgressTrend: number;
  completedTrend: number;
}

interface DashboardStatsResponse {
  success: boolean;
  data?: {
    stats: EnrollmentStats;
    trends: TrendData;
  };
  error?: string;
}

/**
 * Calculate percentage change between two numbers
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get Dashboard Statistics
 *
 * Retrieves enrollment statistics and trends for the authenticated user
 */
export const getDashboardStats = onCall<typeof GetDashboardStatsSchema>(
  async (request): Promise<DashboardStatsResponse> => {
    try {
      // 1. Authentication check
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
      }

      const userId = request.auth.uid;

      // 2. Calculate date ranges for trend comparison
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // 3. Get current period enrollments (last 30 days and all time)
      const enrollmentsRef = firestore
        .collection('enrollments')
        .where('userId', '==', userId);

      const allEnrollmentsSnap = await enrollmentsRef.get();

      // Count enrollments by status (current period)
      let totalEnrolled = 0;
      let activeInProgress = 0;
      let completed = 0;

      // Count previous period for trends (30-60 days ago)
      let prevTotalEnrolled = 0;
      let prevActiveInProgress = 0;
      let prevCompleted = 0;

      allEnrollmentsSnap.forEach((doc) => {
        const data = doc.data();

        // Handle both Firestore Timestamp and ISO string formats
        let enrolledAt: Date;
        if (data.enrolledAt?.toDate) {
          enrolledAt = data.enrolledAt.toDate();
        } else if (typeof data.enrolledAt === 'string') {
          enrolledAt = new Date(data.enrolledAt);
        } else {
          enrolledAt = new Date(0);
        }

        // Current stats (all enrollments)
        totalEnrolled++;
        // Count both 'in_progress', 'active', and 'ACTIVE' as active courses
        if (data.status === 'in_progress' || data.status === 'active' || data.status === 'ACTIVE') {
          activeInProgress++;
        }
        if (data.status === 'completed') completed++;

        // Previous period stats (enrolled between 30-60 days ago)
        if (enrolledAt >= sixtyDaysAgo && enrolledAt < thirtyDaysAgo) {
          prevTotalEnrolled++;
          if (data.status === 'in_progress' || data.status === 'active' || data.status === 'ACTIVE') {
            prevActiveInProgress++;
          }
          if (data.status === 'completed') prevCompleted++;
        }
      });

      // 4. Calculate trends
      const trends: TrendData = {
        totalEnrolledTrend: calculateTrend(totalEnrolled, prevTotalEnrolled),
        activeInProgressTrend: calculateTrend(activeInProgress, prevActiveInProgress),
        completedTrend: calculateTrend(completed, prevCompleted),
      };

      // 5. Return stats
      return {
        success: true,
        data: {
          stats: {
            totalEnrolled,
            activeInProgress,
            completed,
          },
          trends,
        },
      };
    } catch (error) {
      console.error('getDashboardStats error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      if (error instanceof z.ZodError) {
        throw new HttpsError(
          'invalid-argument',
          'Érvénytelen bemeneti adatok',
          { details: error.errors }
        );
      }

      throw new HttpsError(
        'internal',
        'Hiba történt a statisztikák lekérése közben',
        { details: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
);
