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
exports.trackLearningProgress = exports.endLearningSession = exports.startLearningSession = void 0;
/**
 * Learning Session Tracking System
 * Automatically tracks learning sessions, updates streaks, and calculates analytics
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const zod_1 = require("zod");
const firestore = admin.firestore();
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const StartSessionSchema = zod_1.z.object({
    courseId: zod_1.z.string(),
    courseName: zod_1.z.string(),
    lessonId: zod_1.z.string().optional(),
    lessonName: zod_1.z.string().optional(),
    activityType: zod_1.z.enum(['video', 'reading', 'quiz', 'interactive', 'mixed']),
    deviceType: zod_1.z.enum(['desktop', 'mobile', 'tablet']).optional(),
});
const EndSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    progressMade: zod_1.z.number().min(0).max(100),
});
const TrackProgressSchema = zod_1.z.object({
    courseId: zod_1.z.string(),
    lessonId: zod_1.z.string().optional(),
    minutesSpent: zod_1.z.number().min(0),
    activityType: zod_1.z.enum(['video', 'reading', 'quiz', 'interactive', 'mixed']).optional(),
});
// ============================================================================
// SESSION TRACKING FUNCTIONS
// ============================================================================
/**
 * Start a learning session
 * Creates session record and initializes tracking
 */
exports.startLearningSession = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Authentication check
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        const userId = request.auth.uid;
        // Validate input
        const validatedData = StartSessionSchema.parse(request.data);
        const now = new Date().toISOString();
        const sessionId = firestore.collection('learningSessions').doc().id;
        const sessionData = {
            id: sessionId,
            userId,
            ...validatedData,
            deviceType: validatedData.deviceType || 'desktop',
            startTime: now,
            endTime: null,
            duration: 0,
            progressMade: 0,
            completed: false,
            createdAt: now,
            updatedAt: now,
        };
        await firestore.collection('learningSessions').doc(sessionId).set(sessionData);
        return {
            success: true,
            data: { sessionId, startTime: now },
            message: 'Tanulási munkamenet elindítva',
        };
    }
    catch (error) {
        console.error('Start learning session error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Érvénytelen adatok',
                details: error.errors,
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Hiba történt a munkamenet indításakor',
        };
    }
});
/**
 * End a learning session
 * Finalizes session, updates analytics, streaks, and checks achievements
 */
exports.endLearningSession = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Authentication check
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        const userId = request.auth.uid;
        // Validate input
        const validatedData = EndSessionSchema.parse(request.data);
        const { sessionId, progressMade } = validatedData;
        // Get session
        const sessionRef = firestore.collection('learningSessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            throw new Error('Tanulási munkamenet nem található.');
        }
        const sessionData = sessionDoc.data();
        // Verify ownership
        if (sessionData?.userId !== userId) {
            throw new Error('Nincs jogosultság ehhez a munkamenethez.');
        }
        const now = new Date().toISOString();
        const startTime = new Date(sessionData?.startTime);
        const endTime = new Date(now);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // Minutes
        // Update session
        await sessionRef.update({
            endTime: now,
            duration,
            progressMade,
            completed: true,
            updatedAt: now,
        });
        // Update analytics and streaks (run in parallel)
        const [analyticsResult, streakResult] = await Promise.all([
            updateDashboardAnalyticsOnSession(userId, duration, sessionData?.activityType),
            updateStreakOnSession(userId, duration),
        ]);
        // Check for achievements
        await checkSessionAchievements(userId, duration, progressMade);
        return {
            success: true,
            data: {
                sessionId,
                duration,
                analyticsUpdated: analyticsResult,
                streakUpdated: streakResult,
            },
            message: `Tanulási munkamenet befejezve (${duration} perc)`,
        };
    }
    catch (error) {
        console.error('End learning session error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Érvénytelen adatok',
                details: error.errors,
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Hiba történt a munkamenet befejezésekor',
        };
    }
});
/**
 * Quick track learning progress (without explicit session)
 * Simplified tracking for quick updates
 */
exports.trackLearningProgress = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Authentication check
        if (!request.auth) {
            throw new Error('Hitelesítés szükséges.');
        }
        const userId = request.auth.uid;
        // Validate input
        const validatedData = TrackProgressSchema.parse(request.data);
        const { minutesSpent } = validatedData;
        // Update analytics and streaks
        await Promise.all([
            updateDashboardAnalyticsOnSession(userId, minutesSpent, validatedData.activityType || 'mixed'),
            updateStreakOnSession(userId, minutesSpent),
        ]);
        return {
            success: true,
            data: { minutesTracked: minutesSpent },
            message: 'Tanulási haladás rögzítve',
        };
    }
    catch (error) {
        console.error('Track learning progress error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Érvénytelen adatok',
                details: error.errors,
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Hiba történt a haladás rögzítésekor',
        };
    }
});
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Update dashboard analytics when a session ends
 */
async function updateDashboardAnalyticsOnSession(userId, minutesSpent, activityType) {
    try {
        const analyticsRef = firestore.collection('dashboardAnalytics').doc(userId);
        const analyticsDoc = await analyticsRef.get();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of this week
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (!analyticsDoc.exists) {
            // Create new analytics document
            await analyticsRef.set({
                userId,
                totalLearningMinutes: minutesSpent,
                totalLearningHours: minutesSpent / 60,
                learningMinutesThisWeek: minutesSpent,
                learningMinutesLastWeek: 0,
                learningMinutesThisMonth: minutesSpent,
                learningMinutesLastMonth: 0,
                weeklyLearningTrend: 0,
                monthlyLearningTrend: 0,
                averageSessionDuration: minutesSpent,
                totalSessions: 1,
                coursesEnrolled: 0,
                coursesInProgress: 0,
                coursesCompleted: 0,
                lessonsCompleted: 0,
                certificatesEarned: 0,
                achievementsUnlocked: 0,
                currentStreak: 0,
                longestStreak: 0,
                averageQuizScore: 0,
                skillsAcquired: [],
                lastCalculatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
        else {
            // Update existing analytics
            const data = analyticsDoc.data();
            const totalMinutes = (data?.totalLearningMinutes || 0) + minutesSpent;
            const totalSessions = (data?.totalSessions || 0) + 1;
            const avgSessionDuration = totalMinutes / totalSessions;
            const weeklyMinutes = (data?.learningMinutesThisWeek || 0) + minutesSpent;
            const monthlyMinutes = (data?.learningMinutesThisMonth || 0) + minutesSpent;
            const weeklyTrend = data?.learningMinutesLastWeek
                ? ((weeklyMinutes - data.learningMinutesLastWeek) / data.learningMinutesLastWeek) * 100
                : 0;
            const monthlyTrend = data?.learningMinutesLastMonth
                ? ((monthlyMinutes - data.learningMinutesLastMonth) / data.learningMinutesLastMonth) * 100
                : 0;
            await analyticsRef.update({
                totalLearningMinutes: totalMinutes,
                totalLearningHours: totalMinutes / 60,
                learningMinutesThisWeek: weeklyMinutes,
                learningMinutesThisMonth: monthlyMinutes,
                weeklyLearningTrend: weeklyTrend,
                monthlyLearningTrend: monthlyTrend,
                averageSessionDuration: avgSessionDuration,
                totalSessions,
                lastCalculatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
        return true;
    }
    catch (error) {
        console.error('Update analytics error:', error);
        return false;
    }
}
/**
 * Update learning streak when a session ends
 */
async function updateStreakOnSession(userId, minutesSpent) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const streakRef = firestore.collection('learningStreaks').doc(userId);
        const streakDoc = await streakRef.get();
        if (!streakDoc.exists) {
            // Create new streak
            await streakRef.set({
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: today,
                activityCalendar: { [today]: minutesSpent },
                streakStartDate: today,
                totalActiveDays: 1,
                milestones: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
        else {
            // Update existing streak
            const data = streakDoc.data();
            const lastActivityDate = data?.lastActivityDate || '';
            const activityCalendar = data?.activityCalendar || {};
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            let currentStreak = data?.currentStreak || 0;
            let longestStreak = data?.longestStreak || 0;
            let totalActiveDays = data?.totalActiveDays || 0;
            let streakStartDate = data?.streakStartDate || today;
            // Check if this is first activity today
            if (!activityCalendar[today]) {
                totalActiveDays += 1;
                // Update streak logic
                if (lastActivityDate === yesterdayStr) {
                    // Continue streak
                    currentStreak += 1;
                }
                else if (lastActivityDate === today) {
                    // Same day, don't change streak
                }
                else {
                    // Streak broken, restart
                    currentStreak = 1;
                    streakStartDate = today;
                }
                // Update longest streak
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            }
            // Update or add today's minutes
            activityCalendar[today] = (activityCalendar[today] || 0) + minutesSpent;
            // Check for new milestones
            const milestones = data?.milestones || [];
            const newMilestones = checkStreakMilestones(currentStreak, milestones);
            await streakRef.update({
                currentStreak,
                longestStreak,
                lastActivityDate: today,
                activityCalendar,
                streakStartDate,
                totalActiveDays,
                milestones: newMilestones,
                updatedAt: new Date().toISOString(),
            });
            // Update analytics with streak data
            const analyticsRef = firestore.collection('dashboardAnalytics').doc(userId);
            await analyticsRef.update({
                currentStreak,
                longestStreak,
            });
        }
        return true;
    }
    catch (error) {
        console.error('Update streak error:', error);
        return false;
    }
}
/**
 * Check and add new streak milestones
 */
function checkStreakMilestones(currentStreak, existingMilestones) {
    const milestoneThresholds = [7, 14, 30, 50, 100, 365];
    const now = new Date().toISOString();
    const milestones = [...existingMilestones];
    for (const threshold of milestoneThresholds) {
        if (currentStreak >= threshold) {
            const exists = milestones.find((m) => m.days === threshold);
            if (!exists) {
                milestones.push({
                    days: threshold,
                    earnedAt: now,
                    celebrated: false,
                });
            }
        }
    }
    return milestones;
}
/**
 * Check for session-based achievements
 */
async function checkSessionAchievements(userId, duration, progressMade) {
    try {
        // This would trigger achievement checking
        // For now, we'll implement basic checks
        // Get user's total sessions
        const sessionsSnapshot = await firestore
            .collection('learningSessions')
            .where('userId', '==', userId)
            .where('completed', '==', true)
            .get();
        const totalSessions = sessionsSnapshot.size;
        // Check for "First Session" achievement
        if (totalSessions === 1) {
            await unlockAchievement(userId, 'first_session', {
                sessionDuration: duration,
                progressMade,
            });
        }
        // Check for "Consistent Learner" (10 sessions)
        if (totalSessions === 10) {
            await unlockAchievement(userId, 'consistent_learner', {
                totalSessions,
            });
        }
        // More achievement checks can be added here
    }
    catch (error) {
        console.error('Check achievements error:', error);
    }
}
/**
 * Unlock an achievement
 */
async function unlockAchievement(userId, achievementId, metadata) {
    try {
        // Check if already unlocked
        const existingSnapshot = await firestore
            .collection('userAchievements')
            .where('userId', '==', userId)
            .where('achievementId', '==', achievementId)
            .get();
        if (!existingSnapshot.empty) {
            return; // Already unlocked
        }
        // Get achievement definition (hardcoded for now, could be from DB)
        const achievementDefs = {
            first_session: {
                title: 'Első lépés',
                description: 'Teljesítetted az első tanulási munkamenetedet',
                iconName: 'zap',
                tier: 'bronze',
                type: 'engagement',
                points: 50,
            },
            consistent_learner: {
                title: 'Rendszeres tanuló',
                description: '10 tanulási munkamenetet teljesítettél',
                iconName: 'target',
                tier: 'silver',
                type: 'engagement',
                points: 200,
            },
        };
        const def = achievementDefs[achievementId];
        if (!def)
            return;
        const now = new Date().toISOString();
        const achievementData = {
            id: firestore.collection('userAchievements').doc().id,
            userId,
            achievementId,
            achievementType: def.type,
            title: def.title,
            description: def.description,
            iconName: def.iconName,
            tier: def.tier,
            earnedAt: now,
            notificationSent: false,
            celebrated: false,
            metadata: {
                ...metadata,
                points: def.points,
            },
            createdAt: now,
        };
        await firestore
            .collection('userAchievements')
            .doc(achievementData.id)
            .set(achievementData);
        // Update analytics
        const analyticsRef = firestore.collection('dashboardAnalytics').doc(userId);
        const analyticsDoc = await analyticsRef.get();
        if (analyticsDoc.exists) {
            const current = analyticsDoc.data()?.achievementsUnlocked || 0;
            await analyticsRef.update({
                achievementsUnlocked: current + 1,
            });
        }
    }
    catch (error) {
        console.error('Unlock achievement error:', error);
    }
}
//# sourceMappingURL=learningTracking.js.map