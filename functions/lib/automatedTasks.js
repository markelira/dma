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
exports.getPersonalizedRecommendations = exports.generateRecommendationsForUser = exports.generateDailyRecommendations = exports.calculateDailyAnalytics = void 0;
/**
 * Automated Background Tasks
 * Scheduled functions for analytics calculation and recommendations
 */
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firestore = admin.firestore();
// ============================================================================
// SCHEDULED ANALYTICS CALCULATION
// ============================================================================
/**
 * Calculate dashboard analytics for all users
 * Runs daily at midnight UTC
 */
exports.calculateDailyAnalytics = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * *', // Midnight UTC
    timeZone: 'UTC',
    region: 'us-central1',
}, async (event) => {
    console.log('Starting daily analytics calculation...');
    try {
        // Get all users
        const usersSnapshot = await firestore.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${users.length} users to process`);
        // Process in batches of 10
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.all(batch.map(user => calculateUserAnalytics(user.id)));
            console.log(`Processed ${Math.min(i + batchSize, users.length)}/${users.length} users`);
        }
        console.log('Daily analytics calculation completed successfully');
    }
    catch (error) {
        console.error('Daily analytics calculation error:', error);
        throw error;
    }
});
/**
 * Calculate analytics for a single user
 */
async function calculateUserAnalytics(userId) {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Calculate week boundaries
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        // Calculate month boundaries
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        // Get enrollments data
        const enrollmentsSnapshot = await firestore
            .collection('enrollments')
            .where('userId', '==', userId)
            .get();
        const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data());
        const totalEnrolled = enrollments.length;
        const inProgress = enrollments.filter(e => e.status === 'in_progress').length;
        const completed = enrollments.filter(e => e.status === 'completed').length;
        // Get lessons completed
        const lessonsSnapshot = await firestore
            .collection('lessonProgress')
            .where('userId', '==', userId)
            .where('completed', '==', true)
            .get();
        const lessonsCompleted = lessonsSnapshot.size;
        // Get certificates
        const certificatesSnapshot = await firestore
            .collection('certificates')
            .where('userId', '==', userId)
            .get();
        const certificatesEarned = certificatesSnapshot.size;
        // Get achievements
        const achievementsSnapshot = await firestore
            .collection('userAchievements')
            .where('userId', '==', userId)
            .get();
        const achievementsUnlocked = achievementsSnapshot.size;
        // Get streak data
        const streakDoc = await firestore.collection('learningStreaks').doc(userId).get();
        const streakData = streakDoc.data() || {};
        const currentStreak = streakData.currentStreak || 0;
        const longestStreak = streakData.longestStreak || 0;
        const activityCalendar = streakData.activityCalendar || {};
        // Calculate learning minutes
        let totalMinutes = 0;
        let thisWeekMinutes = 0;
        let lastWeekMinutes = 0;
        let thisMonthMinutes = 0;
        let lastMonthMinutes = 0;
        for (const [dateStr, minutes] of Object.entries(activityCalendar)) {
            const date = new Date(dateStr);
            totalMinutes += minutes;
            if (date >= thisWeekStart) {
                thisWeekMinutes += minutes;
            }
            else if (date >= lastWeekStart && date < lastWeekEnd) {
                lastWeekMinutes += minutes;
            }
            if (date >= thisMonthStart) {
                thisMonthMinutes += minutes;
            }
            else if (date >= lastMonthStart && date < lastMonthEnd) {
                lastMonthMinutes += minutes;
            }
        }
        // Calculate trends
        const weeklyTrend = lastWeekMinutes > 0
            ? ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
            : 0;
        const monthlyTrend = lastMonthMinutes > 0
            ? ((thisMonthMinutes - lastMonthMinutes) / lastMonthMinutes) * 100
            : 0;
        // Get session data
        const sessionsSnapshot = await firestore
            .collection('learningSessions')
            .where('userId', '==', userId)
            .where('completed', '==', true)
            .get();
        const sessions = sessionsSnapshot.docs.map(doc => doc.data());
        const totalSessions = sessions.length;
        const avgSessionDuration = totalSessions > 0
            ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions
            : 0;
        // Get quiz scores
        const quizResultsSnapshot = await firestore
            .collection('quizResults')
            .where('userId', '==', userId)
            .get();
        const quizResults = quizResultsSnapshot.docs.map(doc => doc.data());
        const avgQuizScore = quizResults.length > 0
            ? quizResults.reduce((sum, q) => sum + (q.score || 0), 0) / quizResults.length
            : 0;
        // Get skills (from completed courses)
        const completedCourses = enrollments.filter(e => e.status === 'completed');
        const skillsAcquired = [];
        for (const enrollment of completedCourses) {
            if (enrollment.courseId) {
                const courseDoc = await firestore.collection('courses').doc(enrollment.courseId).get();
                const courseData = courseDoc.data();
                if (courseData?.category?.name && !skillsAcquired.includes(courseData.category.name)) {
                    skillsAcquired.push(courseData.category.name);
                }
            }
        }
        // Update or create analytics document
        const analyticsRef = firestore.collection('dashboardAnalytics').doc(userId);
        const analyticsData = {
            userId,
            totalLearningMinutes: totalMinutes,
            totalLearningHours: totalMinutes / 60,
            learningMinutesThisWeek: thisWeekMinutes,
            learningMinutesLastWeek: lastWeekMinutes,
            learningMinutesThisMonth: thisMonthMinutes,
            learningMinutesLastMonth: lastMonthMinutes,
            weeklyLearningTrend: weeklyTrend,
            monthlyLearningTrend: monthlyTrend,
            averageSessionDuration: avgSessionDuration,
            totalSessions,
            coursesEnrolled: totalEnrolled,
            coursesInProgress: inProgress,
            coursesCompleted: completed,
            lessonsCompleted,
            certificatesEarned,
            achievementsUnlocked,
            currentStreak,
            longestStreak,
            averageQuizScore: avgQuizScore,
            skillsAcquired,
            lastCalculatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const analyticsDoc = await analyticsRef.get();
        if (analyticsDoc.exists) {
            await analyticsRef.update(analyticsData);
        }
        else {
            await analyticsRef.set({
                ...analyticsData,
                createdAt: new Date().toISOString(),
            });
        }
        console.log(`Analytics calculated for user ${userId}`);
    }
    catch (error) {
        console.error(`Error calculating analytics for user ${userId}:`, error);
    }
}
// ============================================================================
// COURSE RECOMMENDATIONS
// ============================================================================
/**
 * Generate personalized course recommendations
 * Runs daily at 2 AM UTC
 */
exports.generateDailyRecommendations = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *', // 2 AM UTC
    timeZone: 'UTC',
    region: 'us-central1',
}, async (event) => {
    console.log('Starting daily recommendations generation...');
    try {
        // Get all users
        const usersSnapshot = await firestore.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${users.length} users to process`);
        // Process in batches
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.all(batch.map(user => generateUserRecommendations(user.id)));
            console.log(`Processed ${Math.min(i + batchSize, users.length)}/${users.length} users`);
        }
        console.log('Daily recommendations generation completed successfully');
    }
    catch (error) {
        console.error('Daily recommendations generation error:', error);
        throw error;
    }
});
/**
 * Generate recommendations for a single user
 */
async function generateUserRecommendations(userId) {
    try {
        // Get user's enrollments
        const enrollmentsSnapshot = await firestore
            .collection('enrollments')
            .where('userId', '==', userId)
            .get();
        const enrolledCourseIds = new Set(enrollmentsSnapshot.docs.map(doc => doc.data().courseId));
        // Get user preferences
        const prefsDoc = await firestore.collection('userPreferences').doc(userId).get();
        const preferences = prefsDoc.data();
        const userInterests = preferences?.interests || [];
        // Get user's completed courses to analyze patterns
        const completedEnrollments = enrollmentsSnapshot.docs
            .map(doc => doc.data())
            .filter(e => e.status === 'completed');
        // Get course categories from completed courses
        const completedCategories = [];
        for (const enrollment of completedEnrollments) {
            const courseDoc = await firestore.collection('courses').doc(enrollment.courseId).get();
            const courseData = courseDoc.data();
            if (courseData?.category?.id) {
                completedCategories.push(courseData.category.id);
            }
        }
        // Get all published courses
        const coursesSnapshot = await firestore
            .collection('courses')
            .where('status', '==', 'PUBLISHED')
            .get();
        const courses = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        // Filter out already enrolled courses
        const availableCourses = courses.filter(c => !enrolledCourseIds.has(c.id));
        // Score and rank recommendations
        const recommendations = availableCourses.map(course => {
            let score = 0;
            let reasoning = [];
            let recommendationType = 'trending';
            // Interest-based scoring
            if (userInterests.length > 0 && course.category?.id) {
                if (userInterests.includes(course.category.id)) {
                    score += 3;
                    reasoning.push('Matches your interests');
                    recommendationType = 'content_based';
                }
            }
            // Category-based (similar to completed courses)
            if (completedCategories.length > 0 && course.category?.id) {
                if (completedCategories.includes(course.category.id)) {
                    score += 2;
                    reasoning.push('Similar to courses you completed');
                    recommendationType = 'content_based';
                }
            }
            // Popularity scoring
            const enrollmentCount = course.enrollmentCount || 0;
            if (enrollmentCount > 1000) {
                score += 1.5;
                reasoning.push('Popular among learners');
            }
            else if (enrollmentCount > 500) {
                score += 1;
            }
            // Rating scoring
            const rating = course.averageRating || 0;
            if (rating >= 4.8) {
                score += 1.5;
                reasoning.push('Highly rated');
            }
            else if (rating >= 4.5) {
                score += 1;
            }
            // Difficulty matching (prefer beginner to intermediate for new users)
            if (completedEnrollments.length === 0) {
                if (course.difficulty === 'BEGINNER') {
                    score += 1;
                    reasoning.push('Great for beginners');
                }
            }
            return {
                courseId: course.id,
                score: score / 10, // Normalize to 0-1
                reasoning: reasoning.join(', ') || 'Trending course',
                recommendationType,
                metadata: {
                    enrollmentCount,
                    rating,
                    category: course.category?.name,
                },
            };
        });
        // Sort by score and take top 10
        const topRecommendations = recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        // Store recommendations
        const batch = firestore.batch();
        const now = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        // Delete old recommendations
        const oldRecsSnapshot = await firestore
            .collection('courseRecommendations')
            .where('userId', '==', userId)
            .get();
        oldRecsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        // Add new recommendations
        topRecommendations.forEach(rec => {
            const recRef = firestore.collection('courseRecommendations').doc();
            batch.set(recRef, {
                id: recRef.id,
                userId,
                courseId: rec.courseId,
                recommendationType: rec.recommendationType,
                score: rec.score,
                reasoning: rec.reasoning,
                metadata: rec.metadata,
                dismissed: false,
                enrolled: false,
                createdAt: now,
                expiresAt: expiresAt.toISOString(),
            });
        });
        await batch.commit();
        console.log(`Generated ${topRecommendations.length} recommendations for user ${userId}`);
    }
    catch (error) {
        console.error(`Error generating recommendations for user ${userId}:`, error);
    }
}
/**
 * Manual trigger for recommendations (callable function)
 */
exports.generateRecommendationsForUser = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Authentication check
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        const userId = request.auth.uid;
        await generateUserRecommendations(userId);
        return {
            success: true,
            message: 'Személyre szabott javaslatok generálva',
        };
    }
    catch (error) {
        console.error('Generate recommendations error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Hiba történt a javaslatok generálásakor',
        };
    }
});
/**
 * Get personalized recommendations for user
 */
exports.getPersonalizedRecommendations = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Authentication check
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        const userId = request.auth.uid;
        const { limit = 5 } = request.data || {};
        // Get recommendations
        const recsSnapshot = await firestore
            .collection('courseRecommendations')
            .where('userId', '==', userId)
            .where('dismissed', '==', false)
            .where('enrolled', '==', false)
            .orderBy('score', 'desc')
            .limit(limit)
            .get();
        const recommendations = recsSnapshot.docs.map(doc => doc.data());
        // Enrich with course data
        const enrichedRecs = await Promise.all(recommendations.map(async (rec) => {
            const courseDoc = await firestore.collection('courses').doc(rec.courseId).get();
            return {
                ...rec,
                course: courseDoc.data(),
            };
        }));
        return {
            success: true,
            data: enrichedRecs,
            count: enrichedRecs.length,
        };
    }
    catch (error) {
        console.error('Get recommendations error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Hiba történt a javaslatok lekérdezésekor',
        };
    }
});
//# sourceMappingURL=automatedTasks.js.map