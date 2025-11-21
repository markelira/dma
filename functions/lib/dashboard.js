"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("./admin");
const z = __importStar(require("zod"));
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
/**
 * Calculate percentage change between two numbers
 */
function calculateTrend(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}
/**
 * Get Dashboard Statistics
 *
 * Retrieves enrollment statistics and trends for the authenticated user
 */
exports.getDashboardStats = (0, https_1.onCall)(async (request) => {
    try {
        // 1. Authentication check
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const userId = request.auth.uid;
        // 2. Calculate date ranges for trend comparison
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        // 3. Get current period enrollments (last 30 days and all time)
        const enrollmentsRef = admin_1.firestore
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
            let enrolledAt;
            if (data.enrolledAt?.toDate) {
                enrolledAt = data.enrolledAt.toDate();
            }
            else if (typeof data.enrolledAt === 'string') {
                enrolledAt = new Date(data.enrolledAt);
            }
            else {
                enrolledAt = new Date(0);
            }
            // Current stats (all enrollments)
            totalEnrolled++;
            // Count both 'in_progress', 'active', and 'ACTIVE' as active courses
            if (data.status === 'in_progress' || data.status === 'active' || data.status === 'ACTIVE') {
                activeInProgress++;
            }
            if (data.status === 'completed')
                completed++;
            // Previous period stats (enrolled between 30-60 days ago)
            if (enrolledAt >= sixtyDaysAgo && enrolledAt < thirtyDaysAgo) {
                prevTotalEnrolled++;
                if (data.status === 'in_progress' || data.status === 'active' || data.status === 'ACTIVE') {
                    prevActiveInProgress++;
                }
                if (data.status === 'completed')
                    prevCompleted++;
            }
        });
        // 4. Calculate trends
        const trends = {
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
    }
    catch (error) {
        console.error('getDashboardStats error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        if (error instanceof z.ZodError) {
            throw new https_1.HttpsError('invalid-argument', 'Érvénytelen bemeneti adatok', { details: error.errors });
        }
        throw new https_1.HttpsError('internal', 'Hiba történt a statisztikák lekérése közben', { details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
//# sourceMappingURL=dashboard.js.map