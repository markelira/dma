/**
 * Enroll Team In Course Cloud Function
 *
 * Allows team owner to enroll all team members in a course.
 * Creates enrollment records for each active team member.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  Team,
  TeamMember,
  hasActiveSubscription,
  isTeamOwner,
} from '../types/team';

const firestore = admin.firestore();

interface EnrollTeamInCourseInput {
  teamId: string;
  courseId: string;
}

interface EnrollTeamInCourseResponse {
  success: boolean;
  enrolledCount?: number;
  alreadyEnrolledCount?: number;
  message?: string;
  error?: string;
}

/**
 * Enroll all active team members in a course
 * Callable function - requires authentication
 */
export const enrollTeamInCourse = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<EnrollTeamInCourseResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId, courseId } = request.data as EnrollTeamInCourseInput;
    const userId = request.auth.uid;

    logger.info('[enrollTeamInCourse] Enrolling team in course', { teamId, courseId, userId });

    // 2. Validate input
    if (!teamId || !courseId) {
      throw new HttpsError('invalid-argument', 'Team ID és kurzus ID szükséges');
    }

    // 3. Get team and verify permissions
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    // Check if user is team owner
    if (!isTeamOwner(team, userId)) {
      throw new HttpsError('permission-denied', 'Csak a csapat tulajdonosa adhat hozzá kurzusokat');
    }

    // Check if subscription is active
    if (!hasActiveSubscription(team.subscriptionStatus)) {
      throw new HttpsError(
        'failed-precondition',
        'Az előfizetés nem aktív. Kérjük, aktiváld az előfizetést.'
      );
    }

    // 4. Check if course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      throw new HttpsError('not-found', 'Kurzus nem található');
    }

    const courseData = courseDoc.data();
    const courseTitle = courseData?.title || 'Ismeretlen kurzus';

    // 5. Get all active team members
    const membersSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('status', '==', 'active')
      .get();

    if (membersSnapshot.empty) {
      return {
        success: true,
        enrolledCount: 0,
        alreadyEnrolledCount: 0,
        message: 'Nincs aktív csapattag a beiratkozáshoz',
      };
    }

    // 6. Collect user IDs from active members
    const memberUserIds: string[] = [];
    membersSnapshot.docs.forEach((doc) => {
      const member = doc.data() as TeamMember;
      if (member.userId) {
        memberUserIds.push(member.userId);
      }
    });

    // Also include the team owner
    if (!memberUserIds.includes(team.ownerId)) {
      memberUserIds.push(team.ownerId);
    }

    // 7. Create enrollments for each member
    const batch = firestore.batch();
    let enrolledCount = 0;
    let alreadyEnrolledCount = 0;

    for (const memberUserId of memberUserIds) {
      const enrollmentId = `${memberUserId}_${courseId}`;
      const enrollmentRef = firestore.collection('enrollments').doc(enrollmentId);
      const existingEnrollment = await enrollmentRef.get();

      if (existingEnrollment.exists) {
        alreadyEnrolledCount++;
        continue;
      }

      const enrollmentData = {
        userId: memberUserId,
        courseId,
        enrolledAt: new Date().toISOString(),
        progress: 0,
        status: 'ACTIVE',
        completedLessons: [],
        lastAccessedAt: new Date().toISOString(),
        enrolledByTeam: teamId, // Track that this was a team enrollment
      };

      batch.set(enrollmentRef, enrollmentData);
      enrolledCount++;
    }

    // Commit the batch
    if (enrolledCount > 0) {
      await batch.commit();

      // Update course enrollment count
      await firestore.collection('courses').doc(courseId).update({
        enrollmentCount: admin.firestore.FieldValue.increment(enrolledCount),
      });
    }

    // 8. Track the course in team's enrolled courses
    const teamEnrolledCourseRef = firestore
      .collection('teams')
      .doc(teamId)
      .collection('enrolledCourses')
      .doc(courseId);

    await teamEnrolledCourseRef.set({
      courseId,
      courseTitle,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      enrolledBy: userId,
      memberCount: enrolledCount + alreadyEnrolledCount,
    });

    logger.info('[enrollTeamInCourse] Team enrolled in course successfully', {
      teamId,
      courseId,
      enrolledCount,
      alreadyEnrolledCount,
    });

    return {
      success: true,
      enrolledCount,
      alreadyEnrolledCount,
      message: `${enrolledCount} tag beiratkoztatva a kurzusra${alreadyEnrolledCount > 0 ? ` (${alreadyEnrolledCount} már be volt iratkozva)` : ''}`,
    };

  } catch (error: any) {
    logger.error('[enrollTeamInCourse] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Beiratkozás sikertelen',
    };
  }
});

/**
 * Get team's enrolled courses
 * Callable function - requires authentication
 */
export const getTeamEnrolledCourses = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{ success: boolean; courses?: any[]; error?: string }> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId } = request.data as { teamId: string };
    const userId = request.auth.uid;

    if (!teamId) {
      throw new HttpsError('invalid-argument', 'Team ID szükséges');
    }

    // 2. Get team and verify membership
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = teamDoc.data() as Team;

    // Check if user is team owner or member
    const isOwner = team.ownerId === userId;
    let isMember = false;

    if (!isOwner) {
      const memberSnapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('members')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      isMember = !memberSnapshot.empty;
    }

    if (!isOwner && !isMember) {
      throw new HttpsError('permission-denied', 'Nincs jogosultságod ehhez a csapathoz');
    }

    // 3. Get enrolled courses
    const enrolledCoursesSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('enrolledCourses')
      .orderBy('enrolledAt', 'desc')
      .get();

    const courseIds = enrolledCoursesSnapshot.docs.map((doc) => doc.id);

    if (courseIds.length === 0) {
      return { success: true, courses: [] };
    }

    // 4. Get course details
    const courses = [];
    for (const courseId of courseIds) {
      const courseDoc = await firestore.collection('courses').doc(courseId).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        const enrolledCourseData = enrolledCoursesSnapshot.docs
          .find((doc) => doc.id === courseId)?.data();

        courses.push({
          id: courseId,
          title: courseData?.title,
          thumbnail: courseData?.thumbnail,
          description: courseData?.description,
          duration: courseData?.duration,
          lessonCount: courseData?.lessonCount || courseData?.modules?.reduce(
            (acc: number, m: any) => acc + (m.lessons?.length || 0), 0
          ) || 0,
          enrolledAt: enrolledCourseData?.enrolledAt?.toDate?.()?.toISOString() || null,
          memberCount: enrolledCourseData?.memberCount || 0,
        });
      }
    }

    return { success: true, courses };

  } catch (error: any) {
    logger.error('[getTeamEnrolledCourses] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Kurzusok lekérése sikertelen',
    };
  }
});
