import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { z } from 'zod';
import { firestore } from './config';

// Activity Types and Priorities
enum ActivityType {
  // Critical Activities (logged to dedicated collection)
  COURSE_ENROLLED = 'course_enrolled',
  COURSE_COMPLETED = 'course_completed',
  CERTIFICATE_EARNED = 'certificate_earned',
  MILESTONE_REACHED = 'milestone_reached',
  QUIZ_MASTERED = 'quiz_mastered',
  STREAK_ACHIEVED = 'streak_achieved',
  
  // Routine Activities (computed from existing data)
  LESSON_COMPLETED = 'lesson_completed',
  VIDEO_WATCHED = 'video_watched',
  QUIZ_ATTEMPTED = 'quiz_attempted',
  MODULE_FINISHED = 'module_finished',
  LEARNING_SESSION = 'learning_session'
}

enum ActivityPriority {
  HIGH = 'high',      // Major achievements, milestones
  MEDIUM = 'medium',  // Course progress, completions
  LOW = 'low'         // Daily activities, sessions
}

// Utility function to log critical activities
async function logCriticalActivity(
  userId: string,
  type: ActivityType,
  priority: ActivityPriority,
  title: string,
  description: string,
  metadata: any = {},
  courseId?: string,
  courseName?: string,
  lessonId?: string,
  lessonName?: string,
  moduleId?: string,
  moduleName?: string
) {
  try {
    const activityData = {
      userId,
      type,
      priority,
      title,
      description,
      courseId: courseId || null,
      courseName: courseName || null,
      lessonId: lessonId || null,
      lessonName: lessonName || null,
      moduleId: moduleId || null,
      moduleName: moduleName || null,
      metadata,
      createdAt: new Date().toISOString(),
    };

    await firestore.collection('activities').add(activityData);
    console.log(`✅ Critical activity logged: ${type} for user ${userId}`);
  } catch (error) {
    console.error('❌ Error logging critical activity:', error);
  }
}

/**
 * Trigger: Course Enrollment
 * Logs when a user enrolls in a course
 */
export const onCourseEnrollment = onDocumentCreated(
  'enrollments/{enrollmentId}',
  async (event) => {
    try {
      const enrollment = event.data?.data();
      if (!enrollment) return;

      const { userId, courseId } = enrollment;

      // Get course details
      const courseDoc = await firestore.collection('courses').doc(courseId).get();
      const course = courseDoc.data();

      if (!course) return;

      await logCriticalActivity(
        userId,
        ActivityType.COURSE_ENROLLED,
        ActivityPriority.MEDIUM,
        `Beiratkozott: ${course.title}`,
        `Elkezdte a tanulást a "${course.title}" kurzusban`,
        {
          enrollmentId: event.params.enrollmentId,
          difficulty: course.difficulty,
          estimatedHours: course.estimatedHours,
        },
        courseId,
        course.title
      );

    } catch (error) {
      console.error('❌ Error in onCourseEnrollment trigger:', error);
    }
  }
);

/**
 * Trigger: Course Progress Updates
 * Logs milestones and completion events
 */
export const onCourseProgressUpdate = onDocumentUpdated(
  'enrollments/{enrollmentId}',
  async (event) => {
    try {
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();
      
      if (!beforeData || !afterData) return;

      const { userId, courseId } = afterData;
      const oldProgress = beforeData.progress?.overall || 0;
      const newProgress = afterData.progress?.overall || 0;

      // Skip if no meaningful progress change
      if (newProgress <= oldProgress) return;

      // Get course details
      const courseDoc = await firestore.collection('courses').doc(courseId).get();
      const course = courseDoc.data();
      if (!course) return;

      // Check for milestone achievements (25%, 50%, 75%)
      const milestones = [25, 50, 75];
      for (const milestone of milestones) {
        if (oldProgress < milestone && newProgress >= milestone) {
          await logCriticalActivity(
            userId,
            ActivityType.MILESTONE_REACHED,
            ActivityPriority.HIGH,
            `${milestone}% teljesítve: ${course.title}`,
            `Elérte a ${milestone}%-os haladást a "${course.title}" kurzusban`,
            {
              milestoneType: `${milestone}%`,
              completionPercentage: newProgress,
              previousProgress: oldProgress,
            },
            courseId,
            course.title
          );
        }
      }

      // Check for course completion (100%)
      if (oldProgress < 100 && newProgress >= 100) {
        await logCriticalActivity(
          userId,
          ActivityType.COURSE_COMPLETED,
          ActivityPriority.HIGH,
          `Befejezve: ${course.title}`,
          `Sikeresen befejezte a "${course.title}" kurzust`,
          {
            milestoneType: '100%',
            completionPercentage: 100,
            totalLessons: course.modules?.reduce((acc: number, module: any) => 
              acc + (module.lessons?.length || 0), 0) || 0,
          },
          courseId,
          course.title
        );
      }

    } catch (error) {
      console.error('❌ Error in onCourseProgressUpdate trigger:', error);
    }
  }
);

/**
 * Trigger: Certificate Earned
 * Logs when a certificate is issued
 */
export const onCertificateEarned = onDocumentCreated(
  'certificates/{certificateId}',
  async (event) => {
    try {
      const certificate = event.data?.data();
      if (!certificate) return;

      const { userId, courseId } = certificate;

      // Get course details
      const courseDoc = await firestore.collection('courses').doc(courseId).get();
      const course = courseDoc.data();

      if (!course) return;

      await logCriticalActivity(
        userId,
        ActivityType.CERTIFICATE_EARNED,
        ActivityPriority.HIGH,
        `Tanúsítvány megszerzve: ${course.title}`,
        `Tanúsítványt szerzett a "${course.title}" kurzus sikeres befejezéséért`,
        {
          certificateId: event.params.certificateId,
          issuedAt: certificate.issuedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          certificateUrl: `/certificates/${event.params.certificateId}`,
        },
        courseId,
        course.title
      );

    } catch (error) {
      console.error('❌ Error in onCertificateEarned trigger:', error);
    }
  }
);

/**
 * Manual Quiz Mastery Logging
 * Called when a user achieves perfect score or passes on first attempt
 */
export const logQuizMastery = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Felhasználónak be kell jelentkeznie');
    }

    const { courseId, lessonId, quizScore, attempts, isPerfectScore } = z.object({
      courseId: z.string(),
      lessonId: z.string(),
      quizScore: z.number(),
      attempts: z.number(),
      isPerfectScore: z.boolean(),
    }).parse(request.data);

    const userId = request.auth.uid;

    // Only log for significant achievements
    if (!isPerfectScore && attempts > 1) return { success: true };

    // Get course and lesson details
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    const course = courseDoc.data();
    if (!course) return { success: false, error: 'Course not found' };

    // Find lesson details
    let lessonName = 'Quiz';
    for (const module of course.modules || []) {
      const lesson = module.lessons?.find((l: any) => l.id === lessonId);
      if (lesson) {
        lessonName = lesson.title;
        break;
      }
    }

    const achievementType = isPerfectScore ? 'tökéletes pontszám' : 'első próbálkozásra sikeres';

    await logCriticalActivity(
      userId,
      ActivityType.QUIZ_MASTERED,
      ActivityPriority.MEDIUM,
      `Quiz elsajátítva: ${lessonName}`,
      `${achievementType.charAt(0).toUpperCase() + achievementType.slice(1)} elérése - ${quizScore}%`,
      {
        quizScore,
        attempts,
        isPerfectScore,
        achievementType,
      },
      courseId,
      course.title,
      lessonId,
      lessonName
    );

    return { success: true };

  } catch (error: any) {
    console.error('❌ logQuizMastery error:', error);
    throw new HttpsError('internal', error.message || 'Hiba történt a quiz eredmény naplózása során');
  }
});

/**
 * Get Recent Activities for Dashboard
 * Fetches critical activities for activity timeline
 */
export const getRecentActivities = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Felhasználónak be kell jelentkeznie');
    }

    const { timeRange = '7days', limit = 10 } = z.object({
      timeRange: z.enum(['today', '7days', '30days', 'all']).optional(),
      limit: z.number().max(50).optional(),
    }).parse(request.data || {});

    const userId = request.auth.uid;

    // Calculate date filter
    let startDate: Date | null = null;
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    // Build query
    let query = firestore
      .collection('activities')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startDate) {
      query = query.where('createdAt', '>=', startDate.toISOString());
    }

    const activitiesSnapshot = await query.get();
    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isCritical: true, // These are all critical activities from collection
    }));

    return {
      success: true,
      activities,
      totalCount: activities.length,
      hasMore: activitiesSnapshot.size === limit,
      timeRange,
    };

  } catch (error: any) {
    console.error('❌ getRecentActivities error:', error);
    throw new HttpsError('internal', error.message || 'Hiba történt a tevékenységek lekérése során');
  }
});