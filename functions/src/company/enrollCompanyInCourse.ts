/**
 * Enroll Company Employees In Course Cloud Function
 *
 * Allows company admin to enroll all active employees in a course.
 * Creates enrollment records for each active employee.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const firestore = admin.firestore();

interface EnrollCompanyInCourseInput {
  companyId: string;
  courseId: string;
}

interface EnrollCompanyInCourseResponse {
  success: boolean;
  enrolledCount?: number;
  alreadyEnrolledCount?: number;
  message?: string;
  error?: string;
}

/**
 * Enroll all active company employees in a course
 * Callable function - requires authentication
 */
export const enrollCompanyInCourse = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<EnrollCompanyInCourseResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { companyId, courseId } = request.data as EnrollCompanyInCourseInput;
    const userId = request.auth.uid;

    logger.info('[enrollCompanyInCourse] Enrolling company in course', { companyId, courseId, userId });

    // 2. Validate input
    if (!companyId || !courseId) {
      throw new HttpsError('invalid-argument', 'Company ID és kurzus ID szükséges');
    }

    // 3. Get company and verify admin permissions
    const companyDoc = await firestore.collection('companies').doc(companyId).get();

    if (!companyDoc.exists) {
      throw new HttpsError('not-found', 'Vállalat nem található');
    }

    // Check if user is company admin
    const adminDoc = await firestore
      .collection('companies')
      .doc(companyId)
      .collection('admins')
      .doc(userId)
      .get();

    if (!adminDoc.exists) {
      throw new HttpsError('permission-denied', 'Csak a vállalat adminisztrátorai adhatnak hozzá kurzusokat');
    }

    // 4. Check if course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      throw new HttpsError('not-found', 'Kurzus nem található');
    }

    const courseData = courseDoc.data();
    const courseTitle = courseData?.title || 'Ismeretlen kurzus';

    // 5. Get all active employees
    const employeesSnapshot = await firestore
      .collection('companies')
      .doc(companyId)
      .collection('employees')
      .where('status', '==', 'active')
      .get();

    // Collect user IDs from active employees
    const employeeUserIds: string[] = [];
    employeesSnapshot.docs.forEach((doc) => {
      const employee = doc.data();
      if (employee.userId) {
        employeeUserIds.push(employee.userId);
      }
    });

    if (employeeUserIds.length === 0) {
      return {
        success: true,
        enrolledCount: 0,
        alreadyEnrolledCount: 0,
        message: 'Nincs aktív alkalmazott a beiratkozáshoz',
      };
    }

    // 6. Create enrollments for each employee
    const batch = firestore.batch();
    let enrolledCount = 0;
    let alreadyEnrolledCount = 0;

    for (const employeeUserId of employeeUserIds) {
      const enrollmentId = `${employeeUserId}_${courseId}`;
      const enrollmentRef = firestore.collection('enrollments').doc(enrollmentId);
      const existingEnrollment = await enrollmentRef.get();

      if (existingEnrollment.exists) {
        alreadyEnrolledCount++;
        continue;
      }

      const enrollmentData = {
        userId: employeeUserId,
        courseId,
        enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
        progress: 0,
        status: 'ACTIVE',
        completedLessons: [],
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
        enrolledByCompany: companyId, // Track that this was a company enrollment
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

    // 7. Track the course in company's enrolled courses
    const companyEnrolledCourseRef = firestore
      .collection('companies')
      .doc(companyId)
      .collection('enrolledCourses')
      .doc(courseId);

    await companyEnrolledCourseRef.set({
      courseId,
      courseTitle,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      enrolledBy: userId,
      employeeCount: enrolledCount + alreadyEnrolledCount,
    });

    logger.info('[enrollCompanyInCourse] Company enrolled in course successfully', {
      companyId,
      courseId,
      enrolledCount,
      alreadyEnrolledCount,
    });

    return {
      success: true,
      enrolledCount,
      alreadyEnrolledCount,
      message: `${enrolledCount} alkalmazott beiratkoztatva a kurzusra${alreadyEnrolledCount > 0 ? ` (${alreadyEnrolledCount} már be volt iratkozva)` : ''}`,
    };

  } catch (error: any) {
    logger.error('[enrollCompanyInCourse] Error:', error);

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
 * Get company's enrolled courses
 * Callable function - requires authentication
 */
export const getCompanyEnrolledCourses = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{ success: boolean; courses?: any[]; error?: string }> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { companyId } = request.data as { companyId: string };
    const userId = request.auth.uid;

    if (!companyId) {
      throw new HttpsError('invalid-argument', 'Company ID szükséges');
    }

    // 2. Get company and verify membership
    const companyDoc = await firestore.collection('companies').doc(companyId).get();

    if (!companyDoc.exists) {
      throw new HttpsError('not-found', 'Vállalat nem található');
    }

    // Check if user is admin or employee
    const adminDoc = await firestore
      .collection('companies')
      .doc(companyId)
      .collection('admins')
      .doc(userId)
      .get();

    let isEmployee = false;
    if (!adminDoc.exists) {
      const employeeSnapshot = await firestore
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      isEmployee = !employeeSnapshot.empty;
    }

    if (!adminDoc.exists && !isEmployee) {
      throw new HttpsError('permission-denied', 'Nincs jogosultságod ehhez a vállalathoz');
    }

    // 3. Get enrolled courses
    const enrolledCoursesSnapshot = await firestore
      .collection('companies')
      .doc(companyId)
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
          employeeCount: enrolledCourseData?.employeeCount || 0,
        });
      }
    }

    return { success: true, courses };

  } catch (error: any) {
    logger.error('[getCompanyEnrolledCourses] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Kurzusok lekérése sikertelen',
    };
  }
});
