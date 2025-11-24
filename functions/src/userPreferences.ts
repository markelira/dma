/**
 * User Preferences Cloud Functions
 * Handles onboarding, preferences, goals, and streaks
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

const firestore = admin.firestore();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UserPreferencesSchema = z.object({
  role: z.string().optional(),
  interests: z.array(z.string()),
  goals: z.array(z.string()),
  learningStyle: z.enum(['visual', 'reading', 'interactive', 'mixed']),
  weeklyHoursGoal: z.number().min(0),
  dailyReminderTime: z.string().optional(),
  dashboardLayout: z.enum(['default', 'compact', 'detailed', 'custom']).optional(),
  darkMode: z.boolean(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    reminders: z.boolean(),
    achievements: z.boolean(),
    courseUpdates: z.boolean(),
  }),
  onboardingCompleted: z.boolean().optional(),
});

const LearningGoalSchema = z.object({
  goalType: z.enum(['weekly_hours', 'course_completion', 'skill_mastery', 'certificate']),
  title: z.string(),
  description: z.string().optional(),
  target: z.number().min(1),
  unit: z.enum(['minutes', 'courses', 'lessons', 'skills', 'certificates']),
  deadline: z.string().optional(),
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  reminderEnabled: z.boolean(),
});

// ============================================================================
// USER PREFERENCES FUNCTIONS
// ============================================================================

/**
 * Save or update user preferences (onboarding data)
 */
export const saveUserPreferences = onCall({
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
    const validatedData = UserPreferencesSchema.parse(request.data);

    const now = new Date().toISOString();

    // Check if preferences exist
    const prefsRef = firestore.collection('userPreferences').doc(userId);
    const prefsDoc = await prefsRef.get();

    const preferencesData = {
      userId,
      ...validatedData,
      updatedAt: now,
      ...(prefsDoc.exists ? {} : { createdAt: now }),
    };

    await prefsRef.set(preferencesData, { merge: true });

    // If onboarding is completed, initialize streak and analytics
    if (validatedData.onboardingCompleted && !prefsDoc.exists) {
      await initializeUserGamification(userId);
    }

    return {
      success: true,
      data: preferencesData,
      message: 'Beállítások sikeresen mentve',
    };
  } catch (error) {
    console.error('Save user preferences error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen adatok',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a mentés során',
    };
  }
});

/**
 * Get user preferences
 */
export const getUserPreferences = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;

    const prefsDoc = await firestore.collection('userPreferences').doc(userId).get();

    if (!prefsDoc.exists) {
      return {
        success: true,
        data: null,
        message: 'Nincs még mentett beállítás',
      };
    }

    return {
      success: true,
      data: prefsDoc.data(),
    };
  } catch (error) {
    console.error('Get user preferences error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a lekérdezés során',
    };
  }
});

/**
 * Initialize gamification features for new user
 * Creates learning streak and dashboard analytics documents
 */
async function initializeUserGamification(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const batch = firestore.batch();

  // Initialize learning streak
  const streakRef = firestore.collection('learningStreaks').doc(userId);
  batch.set(streakRef, {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: today,
    activityCalendar: {},
    streakStartDate: today,
    totalActiveDays: 0,
    milestones: [],
    createdAt: now,
    updatedAt: now,
  });

  // Initialize dashboard analytics
  const analyticsRef = firestore.collection('dashboardAnalytics').doc(userId);
  batch.set(analyticsRef, {
    userId,
    totalLearningMinutes: 0,
    totalLearningHours: 0,
    learningMinutesThisWeek: 0,
    learningMinutesLastWeek: 0,
    learningMinutesThisMonth: 0,
    learningMinutesLastMonth: 0,
    weeklyLearningTrend: 0,
    monthlyLearningTrend: 0,
    averageSessionDuration: 0,
    totalSessions: 0,
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
    lastCalculatedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
}

// ============================================================================
// LEARNING GOALS FUNCTIONS
// ============================================================================

/**
 * Create a learning goal
 */
export const createLearningGoal = onCall({
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
    const validatedData = LearningGoalSchema.parse(request.data);

    const now = new Date().toISOString();
    const goalId = firestore.collection('learningGoals').doc().id;

    const goalData = {
      id: goalId,
      userId,
      ...validatedData,
      current: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection('learningGoals').doc(goalId).set(goalData);

    return {
      success: true,
      data: goalData,
      message: 'Cél sikeresen létrehozva',
    };
  } catch (error) {
    console.error('Create learning goal error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen adatok',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a létrehozás során',
    };
  }
});

/**
 * Get user's learning goals
 */
export const getLearningGoals = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;
    const { status } = request.data || {};

    let query = firestore
      .collection('learningGoals')
      .where('userId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const goals = snapshot.docs.map(doc => doc.data());

    return {
      success: true,
      data: goals,
      count: goals.length,
    };
  } catch (error) {
    console.error('Get learning goals error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a lekérdezés során',
    };
  }
});

/**
 * Update learning goal progress
 */
export const updateGoalProgress = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;
    const { goalId, progress } = request.data;

    if (!goalId || typeof progress !== 'number') {
      throw new Error('Goal ID és haladás megadása kötelező.');
    }

    const goalRef = firestore.collection('learningGoals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new Error('A cél nem található.');
    }

    const goalData = goalDoc.data();

    // Verify ownership
    if (goalData?.userId !== userId) {
      throw new Error('Nincs jogosultság ehhez a célhoz.');
    }

    const newCurrent = Math.min(progress, goalData?.target || 0);
    const isCompleted = newCurrent >= (goalData?.target || 0);

    const updates: any = {
      current: newCurrent,
      updatedAt: new Date().toISOString(),
    };

    if (isCompleted && goalData?.status === 'active') {
      updates.status = 'completed';
      updates.completedAt = new Date().toISOString();
    }

    await goalRef.update(updates);

    return {
      success: true,
      data: { ...goalData, ...updates },
      message: isCompleted ? 'Cél teljesítve! 🎉' : 'Haladás frissítve',
    };
  } catch (error) {
    console.error('Update goal progress error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a frissítés során',
    };
  }
});

/**
 * Delete a learning goal
 */
export const deleteLearningGoal = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;
    const { goalId } = request.data;

    if (!goalId) {
      throw new Error('Goal ID megadása kötelező.');
    }

    const goalRef = firestore.collection('learningGoals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new Error('A cél nem található.');
    }

    const goalData = goalDoc.data();

    // Verify ownership
    if (goalData?.userId !== userId) {
      throw new Error('Nincs jogosultság ehhez a célhoz.');
    }

    await goalRef.delete();

    return {
      success: true,
      message: 'Cél törölve',
    };
  } catch (error) {
    console.error('Delete learning goal error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a törlés során',
    };
  }
});

// ============================================================================
// LEARNING STREAK FUNCTIONS
// ============================================================================

/**
 * Get user's learning streak data
 */
export const getLearningStreak = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;

    const streakDoc = await firestore.collection('learningStreaks').doc(userId).get();

    if (!streakDoc.exists) {
      // Initialize streak if doesn't exist
      await initializeUserGamification(userId);
      const newStreakDoc = await firestore.collection('learningStreaks').doc(userId).get();
      return {
        success: true,
        data: newStreakDoc.data(),
      };
    }

    return {
      success: true,
      data: streakDoc.data(),
    };
  } catch (error) {
    console.error('Get learning streak error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a lekérdezés során',
    };
  }
});

/**
 * Update learning streak (called when user completes a learning session)
 * This should be called from lesson completion or learning session tracking
 */
export const updateLearningStreak = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;
    const { minutesLearned } = request.data;

    if (typeof minutesLearned !== 'number' || minutesLearned <= 0) {
      throw new Error('Érvénytelen tanulási idő.');
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const streakRef = firestore.collection('learningStreaks').doc(userId);
    const streakDoc = await streakRef.get();

    if (!streakDoc.exists) {
      await initializeUserGamification(userId);
      // Re-fetch after initialization
      const newStreakDoc = await streakRef.get();
      if (!newStreakDoc.exists) {
        throw new Error('Hiba a sorozat inicializálásakor.');
      }
    }

    const streakData = streakDoc.data();
    const lastActivityDate = streakData?.lastActivityDate || '';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = streakData?.currentStreak || 0;
    let longestStreak = streakData?.longestStreak || 0;
    let streakStartDate = streakData?.streakStartDate || today;
    let totalActiveDays = streakData?.totalActiveDays || 0;
    const activityCalendar = streakData?.activityCalendar || {};
    const milestones = streakData?.milestones || [];

    // Check if this is the first activity today
    if (!activityCalendar[today]) {
      // Increment total active days
      totalActiveDays += 1;

      // Update streak logic
      if (lastActivityDate === yesterdayStr) {
        // Continue streak
        currentStreak += 1;
      } else if (lastActivityDate === today) {
        // Same day, don't increment streak
      } else {
        // Streak broken, restart
        currentStreak = 1;
        streakStartDate = today;
      }

      // Update longest streak
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Check for new milestones
      const newMilestones = checkStreakMilestones(currentStreak, milestones);

      // Update calendar
      activityCalendar[today] = minutesLearned;

      // Update streak document
      await streakRef.update({
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        streakStartDate,
        totalActiveDays,
        activityCalendar,
        milestones: newMilestones,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          currentStreak,
          longestStreak,
          newMilestones: newMilestones.filter(m =>
            !milestones.find((existing: any) => existing.days === m.days)
          ),
        },
        message: currentStreak > 1
          ? `🔥 ${currentStreak} napos sorozat!`
          : 'Jó munkát! Tartsd a lendületet!',
      };
    } else {
      // Add to today's minutes
      activityCalendar[today] = (activityCalendar[today] || 0) + minutesLearned;

      await streakRef.update({
        activityCalendar,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        data: { currentStreak, longestStreak },
        message: 'Tanulási idő frissítve',
      };
    }
  } catch (error) {
    console.error('Update learning streak error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a frissítés során',
    };
  }
});

/**
 * Check and add new streak milestones
 */
function checkStreakMilestones(
  currentStreak: number,
  existingMilestones: any[]
): any[] {
  const milestoneThresholds = [7, 14, 30, 50, 100, 365];
  const now = new Date().toISOString();
  const milestones = [...existingMilestones];

  for (const threshold of milestoneThresholds) {
    if (currentStreak >= threshold) {
      const exists = milestones.find(m => m.days === threshold);
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
 * Get dashboard analytics (pre-computed metrics)
 * Also aggregates timeSpent from lessonProgress collection for accurate watch time
 */
export const getDashboardAnalytics = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;

    const analyticsDoc = await firestore.collection('dashboardAnalytics').doc(userId).get();

    if (!analyticsDoc.exists) {
      // Initialize analytics if doesn't exist
      await initializeUserGamification(userId);
      const newAnalyticsDoc = await firestore.collection('dashboardAnalytics').doc(userId).get();
      return {
        success: true,
        data: newAnalyticsDoc.data(),
      };
    }

    // Aggregate actual watch time from lessonProgress collection
    const lessonProgressSnapshot = await firestore
      .collection('lessonProgress')
      .where('userId', '==', userId)
      .get();

    let totalTimeSpentSeconds = 0;
    lessonProgressSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.timeSpent && typeof data.timeSpent === 'number') {
        totalTimeSpentSeconds += data.timeSpent;
      }
    });

    // Convert to minutes and hours
    const totalLearningMinutesFromProgress = Math.round(totalTimeSpentSeconds / 60);
    const totalLearningHoursFromProgress = Math.round((totalTimeSpentSeconds / 3600) * 10) / 10; // 1 decimal place

    const analyticsData = analyticsDoc.data() || {};

    // Use the higher value between sessions-based and progress-based tracking
    const sessionMinutes = analyticsData.totalLearningMinutes || 0;
    const actualTotalMinutes = Math.max(sessionMinutes, totalLearningMinutesFromProgress);
    const actualTotalHours = Math.round((actualTotalMinutes / 60) * 10) / 10;

    return {
      success: true,
      data: {
        ...analyticsData,
        totalLearningMinutes: actualTotalMinutes,
        totalLearningHours: actualTotalHours,
        // Include breakdown for debugging
        _sessionBasedMinutes: sessionMinutes,
        _progressBasedMinutes: totalLearningMinutesFromProgress,
      },
    };
  } catch (error) {
    console.error('Get dashboard analytics error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a lekérdezés során',
    };
  }
});
