/**
 * Achievement System Cloud Functions
 * Handles achievement tracking, unlocking, and rewards
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

const firestore = admin.firestore();

// ============================================================================
// ACHIEVEMENT DEFINITIONS (These could also be stored in Firestore)
// ============================================================================

const ACHIEVEMENT_DEFINITIONS = [
  // Completion Achievements
  {
    id: 'first_course_complete',
    type: 'completion',
    title: 'Első kurzus',
    description: 'Teljesítetted az első kurzusodat',
    iconName: 'trophy',
    tier: 'bronze',
    unlockCondition: { type: 'course_complete', threshold: 1 },
    points: 100,
  },
  {
    id: 'three_courses_complete',
    type: 'completion',
    title: 'Tanulási úton',
    description: '3 kurzust teljesítettél',
    iconName: 'award',
    tier: 'silver',
    unlockCondition: { type: 'course_complete', threshold: 3 },
    points: 250,
  },
  {
    id: 'ten_courses_complete',
    type: 'completion',
    title: 'Tudás mestere',
    description: '10 kurzust teljesítettél',
    iconName: 'trophy',
    tier: 'gold',
    unlockCondition: { type: 'course_complete', threshold: 10 },
    points: 1000,
  },

  // Streak Achievements
  {
    id: 'streak_7_days',
    type: 'streak',
    title: '7 napos sorozat',
    description: '7 egymást követő napon tanultál',
    iconName: 'flame',
    tier: 'bronze',
    unlockCondition: { type: 'streak_days', threshold: 7 },
    points: 200,
  },
  {
    id: 'streak_30_days',
    type: 'streak',
    title: '30 napos sorozat',
    description: '30 egymást követő napon tanultál',
    iconName: 'flame',
    tier: 'silver',
    unlockCondition: { type: 'streak_days', threshold: 30 },
    points: 500,
  },
  {
    id: 'streak_100_days',
    type: 'streak',
    title: '100 napos sorozat',
    description: '100 egymást követő napon tanultál',
    iconName: 'flame',
    tier: 'gold',
    unlockCondition: { type: 'streak_days', threshold: 100 },
    points: 2000,
  },

  // Mastery Achievements
  {
    id: 'quiz_perfect_first',
    type: 'mastery',
    title: 'Tökéletes pontszám',
    description: 'Elsőre 100%-ot értél el egy kvízen',
    iconName: 'star',
    tier: 'silver',
    unlockCondition: { type: 'quiz_perfect', threshold: 100 },
    points: 300,
  },
  {
    id: 'all_lessons_in_course',
    type: 'mastery',
    title: 'Teljes körű',
    description: 'Minden leckét teljesítettél egy kurzusban',
    iconName: 'target',
    tier: 'gold',
    unlockCondition: { type: 'all_lessons', threshold: 1 },
    points: 400,
  },

  // Speed Achievements
  {
    id: 'fast_learner',
    type: 'speed',
    title: 'Gyors tanuló',
    description: '1 héten belül teljesítettél egy kurzust',
    iconName: 'zap',
    tier: 'silver',
    unlockCondition: { type: 'course_complete_days', threshold: 7 },
    points: 350,
  },

  // Engagement Achievements
  {
    id: 'early_bird',
    type: 'engagement',
    title: 'Korai madár',
    description: '5-ször tanultál reggel 8 előtt',
    iconName: 'award',
    tier: 'bronze',
    unlockCondition: { type: 'early_sessions', threshold: 5 },
    points: 150,
  },
  {
    id: 'night_owl',
    type: 'engagement',
    title: 'Éjszakai bagoly',
    description: '5-ször tanultál este 10 után',
    iconName: 'award',
    tier: 'bronze',
    unlockCondition: { type: 'night_sessions', threshold: 5 },
    points: 150,
  },
];

// ============================================================================
// ACHIEVEMENT FUNCTIONS
// ============================================================================

/**
 * Get user's achievements
 */
export const getUserAchievements = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;

    const snapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .orderBy('earnedAt', 'desc')
      .get();

    const achievements = snapshot.docs.map(doc => doc.data());

    return {
      success: true,
      data: achievements,
      count: achievements.length,
    };
  } catch (error) {
    console.error('Get user achievements error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a lekérdezés során',
    };
  }
});

/**
 * Get all achievement definitions (including locked ones)
 */
export const getAllAchievements = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;

    // Get user's unlocked achievements
    const userAchievementsSnapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .get();

    const unlockedIds = new Set(
      userAchievementsSnapshot.docs.map(doc => doc.data().achievementId)
    );

    // Combine with definitions
    const allAchievements = ACHIEVEMENT_DEFINITIONS.map(def => {
      const userAchievement = userAchievementsSnapshot.docs.find(
        doc => doc.data().achievementId === def.id
      );

      if (userAchievement) {
        return userAchievement.data();
      } else {
        // Return locked achievement
        return {
          id: def.id,
          userId,
          achievementId: def.id,
          achievementType: def.type,
          title: def.title,
          description: def.description,
          iconName: def.iconName,
          tier: def.tier,
          earnedAt: null,
          notificationSent: false,
          celebrated: false,
          metadata: {},
          createdAt: new Date().toISOString(),
        };
      }
    });

    return {
      success: true,
      data: allAchievements,
      unlockedCount: unlockedIds.size,
      totalCount: ACHIEVEMENT_DEFINITIONS.length,
    };
  } catch (error) {
    console.error('Get all achievements error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a lekérdezés során',
    };
  }
});

/**
 * Check and unlock achievements for user
 * Called after significant events (course completion, streak update, etc.)
 */
export const checkAchievements = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;
    const { eventType, metadata } = request.data;

    // Get user's current achievements
    const userAchievementsSnapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .get();

    const unlockedIds = new Set(
      userAchievementsSnapshot.docs.map(doc => doc.data().achievementId)
    );

    // Get user stats for checking conditions
    const stats = await getUserStats(userId);

    // Check each achievement definition
    const newlyUnlocked: any[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked
      if (unlockedIds.has(def.id)) continue;

      // Check if conditions are met
      if (shouldUnlockAchievement(def, stats, eventType, metadata)) {
        const achievementData = {
          id: firestore.collection('userAchievements').doc().id,
          userId,
          achievementId: def.id,
          achievementType: def.type,
          title: def.title,
          description: def.description,
          iconName: def.iconName,
          tier: def.tier,
          earnedAt: new Date().toISOString(),
          notificationSent: false,
          celebrated: false,
          metadata: {
            ...metadata,
            points: def.points,
          },
          createdAt: new Date().toISOString(),
        };

        await firestore
          .collection('userAchievements')
          .doc(achievementData.id)
          .set(achievementData);

        newlyUnlocked.push(achievementData);
      }
    }

    return {
      success: true,
      newlyUnlocked,
      count: newlyUnlocked.length,
      message: newlyUnlocked.length > 0
        ? `${newlyUnlocked.length} új jelvény feloldva!`
        : 'Nincs új jelvény',
    };
  } catch (error) {
    console.error('Check achievements error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt az ellenőrzés során',
    };
  }
});

/**
 * Mark achievement as celebrated (user has seen the unlock modal)
 */
export const markAchievementCelebrated = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.');
    }

    const userId = request.auth.uid;
    const { achievementId } = request.data;

    if (!achievementId) {
      throw new Error('Achievement ID megadása kötelező.');
    }

    const snapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .where('achievementId', '==', achievementId)
      .get();

    if (snapshot.empty) {
      throw new Error('Jelvény nem található.');
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({
      celebrated: true,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Jelvény megjelölve megtekintettként',
    };
  } catch (error) {
    console.error('Mark achievement celebrated error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hiba történt a mentés során',
    };
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user statistics for achievement checking
 */
async function getUserStats(userId: string): Promise<any> {
  const analyticsDoc = await firestore
    .collection('dashboardAnalytics')
    .doc(userId)
    .get();

  const streakDoc = await firestore
    .collection('learningStreaks')
    .doc(userId)
    .get();

  const analytics = analyticsDoc.data() || {};
  const streak = streakDoc.data() || {};

  return {
    coursesCompleted: analytics.coursesCompleted || 0,
    lessonsCompleted: analytics.lessonsCompleted || 0,
    currentStreak: streak.currentStreak || 0,
    longestStreak: streak.longestStreak || 0,
    certificatesEarned: analytics.certificatesEarned || 0,
    achievementsUnlocked: analytics.achievementsUnlocked || 0,
    totalSessions: analytics.totalSessions || 0,
  };
}

/**
 * Check if achievement should be unlocked based on conditions
 */
function shouldUnlockAchievement(
  definition: any,
  stats: any,
  eventType: string,
  metadata: any
): boolean {
  const { type, threshold } = definition.unlockCondition;

  switch (type) {
    case 'course_complete':
      return stats.coursesCompleted >= threshold;

    case 'streak_days':
      return stats.currentStreak >= threshold || stats.longestStreak >= threshold;

    case 'quiz_perfect':
      return eventType === 'quiz_complete' && metadata?.quizScore === 100;

    case 'all_lessons':
      return eventType === 'course_complete' && metadata?.allLessonsCompleted === true;

    case 'course_complete_days':
      return (
        eventType === 'course_complete' &&
        metadata?.completionDays &&
        metadata.completionDays <= threshold
      );

    case 'early_sessions':
    case 'night_sessions':
      // These would require session time tracking
      return false;

    default:
      return false;
  }
}
