/**
 * Progress Tracking Functions for Company Admins
 * Track and analyze employee progress across purchased courses
 *
 * Uses the same progress tracking system as individual users:
 * - enrollments collection: enrollment status and progress percentage
 * - lessonProgress collection: individual lesson completion
 * - courses collection: course details with lessons subcollection
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface GetCompanyDashboardInput {
  companyId: string;
  courseId?: string; // Optional: filter by specific course
}

interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  email: string;
  jobTitle?: string;
  masterclassId: string; // Keep for backwards compatibility with frontend
  masterclassTitle: string;
  currentModule: number;
  completedModules: number[]; // Actually completed lesson count for display
  totalModules: number; // Actually total lessons
  progressPercent: number;
  status: 'active' | 'completed' | 'at-risk' | 'not-started';
  lastActivityAt?: Date;
  enrolledAt: Date;
  daysActive: number;
  weeksBehind?: number;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  completedCourses: number;
  averageProgress: number;
  atRiskCount: number;
}

/**
 * Get Company Dashboard Data
 * Returns aggregated progress for all employees using enrollments and lessonProgress collections
 */
export const getCompanyDashboard = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    cors: true,
  },
  async (request: CallableRequest<GetCompanyDashboardInput>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, courseId } = request.data;
    // Support both 'courseId' and legacy 'masterclassId' parameter
    const filterCourseId = courseId || (request.data as any).masterclassId;
    const userId = request.auth.uid;

    if (!companyId) {
      throw new HttpsError('invalid-argument', 'Missing companyId');
    }

    try {
      // 1. Verify admin permission
      const adminDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .get();

      if (!adminDoc.exists) {
        throw new HttpsError(
          'permission-denied',
          'You are not an admin of this company'
        );
      }

      // 2. Get company data
      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Company not found');
      }

      const companyData = companyDoc.data();

      // 3. Get all company enrollments from enrollments collection
      // These are enrollments where enrolledByCompany matches this company
      let enrollmentsQuery = db
        .collection('enrollments')
        .where('enrolledByCompany', '==', companyId);

      // Filter by specific course if requested
      if (filterCourseId) {
        enrollmentsQuery = enrollmentsQuery.where('courseId', '==', filterCourseId);
      }

      const enrollmentsSnapshot = await enrollmentsQuery.get();

      console.log(`📊 Found ${enrollmentsSnapshot.size} company enrollments for ${companyId}`);

      // 4. Get unique course IDs and fetch course details
      const courseIds = new Set<string>();
      enrollmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.courseId) {
          courseIds.add(data.courseId);
        }
      });

      // Fetch course details and lesson counts
      const coursesData = new Map<string, { id: string; title: string; totalLessons: number }>();
      for (const cId of courseIds) {
        const courseDoc = await db.collection('courses').doc(cId).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          const courseType = courseData?.courseType || courseData?.type;

          // Get total lessons - check lessonCount field first, then query subcollection
          let totalLessons = courseData?.lessonCount || 0;

          if (totalLessons === 0) {
            // Query the flat lessons subcollection
            const lessonsSnapshot = await db
              .collection('courses')
              .doc(cId)
              .collection('lessons')
              .get();
            totalLessons = lessonsSnapshot.size;
          }

          // For ACADEMIA courses, also check modules subcollection
          if (totalLessons === 0 && courseType === 'ACADEMIA') {
            const modulesSnapshot = await db
              .collection('courses')
              .doc(cId)
              .collection('modules')
              .get();

            for (const moduleDoc of modulesSnapshot.docs) {
              const moduleLessonsSnapshot = await db
                .collection('courses')
                .doc(cId)
                .collection('modules')
                .doc(moduleDoc.id)
                .collection('lessons')
                .get();
              totalLessons += moduleLessonsSnapshot.size;
            }
            console.log(`📊 Counted ${totalLessons} lessons from ACADEMIA modules for course ${cId}`);
          }

          coursesData.set(cId, {
            id: cId,
            title: courseData?.title || 'Unknown Course',
            totalLessons,
          });
        }
      }

      // 5. Get unique user IDs from enrollments and fetch user details
      const userIds = new Set<string>();
      enrollmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          userIds.add(data.userId);
        }
      });

      // Fetch user details
      const usersData = new Map<string, { displayName: string; email: string }>();
      for (const uid of userIds) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          usersData.set(uid, {
            displayName: userData?.displayName || userData?.email || 'Unknown User',
            email: userData?.email || '',
          });
        }
      }

      // Also fetch employee data for job titles
      const employeesSnapshot = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .get();

      const employeesDataMap = new Map<string, { jobTitle?: string; employeeId: string }>();
      employeesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          employeesDataMap.set(data.userId, {
            jobTitle: data.jobTitle,
            employeeId: doc.id,
          });
        }
      });

      // 6. Build employee progress list from enrollments
      const employeeProgressList: EmployeeProgress[] = [];
      const stats: DashboardStats = {
        totalEmployees: userIds.size,
        activeEmployees: 0,
        completedCourses: 0,
        averageProgress: 0,
        atRiskCount: 0,
      };

      let totalProgress = 0;
      let progressCount = 0;
      const activeUserIds = new Set<string>();

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        const enrollmentUserId = enrollment.userId;
        const enrollmentCourseId = enrollment.courseId;

        if (!enrollmentUserId || !enrollmentCourseId) continue;

        const course = coursesData.get(enrollmentCourseId);
        if (!course) continue;

        const user = usersData.get(enrollmentUserId);
        const employee = employeesDataMap.get(enrollmentUserId);

        // Get progress from enrollment document (same logic as frontend)
        const progressPercent = Math.round(enrollment.progress || 0);

        // Count completed lessons for this user in this course
        const completedLessonsQuery = await db
          .collection('lessonProgress')
          .where('userId', '==', enrollmentUserId)
          .where('courseId', '==', enrollmentCourseId)
          .where('completed', '==', true)
          .get();

        const completedLessonsCount = completedLessonsQuery.size;

        // Determine status based on enrollment status and activity
        let status: 'active' | 'completed' | 'at-risk' | 'not-started' = 'not-started';

        if (enrollment.status === 'completed' || progressPercent === 100) {
          status = 'completed';
          stats.completedCourses++;
        } else if (enrollment.lastAccessedAt) {
          const lastActivity = enrollment.lastAccessedAt.toDate();
          const daysSinceActivity = Math.floor(
            (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceActivity > 7) {
            status = 'at-risk';
            stats.atRiskCount++;
          } else {
            status = 'active';
            activeUserIds.add(enrollmentUserId);
          }
        } else if (progressPercent > 0) {
          status = 'active';
          activeUserIds.add(enrollmentUserId);
        }

        // Calculate days since enrollment
        const enrolledAt = enrollment.enrolledAt?.toDate() || new Date();
        const daysActive = Math.floor(
          (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        employeeProgressList.push({
          employeeId: employee?.employeeId || enrollmentUserId,
          employeeName: user?.displayName || 'Unknown User',
          email: user?.email || '',
          jobTitle: employee?.jobTitle,
          masterclassId: enrollmentCourseId, // Keep for backwards compatibility
          masterclassTitle: course.title,
          currentModule: 1, // Not using modules anymore
          completedModules: Array.from({ length: completedLessonsCount }, (_, i) => i + 1), // For display
          totalModules: course.totalLessons,
          progressPercent,
          status,
          lastActivityAt: enrollment.lastAccessedAt?.toDate(),
          enrolledAt,
          daysActive,
        });

        totalProgress += progressPercent;
        progressCount++;
      }

      // Set active employees count
      stats.activeEmployees = activeUserIds.size;

      // Calculate average progress
      stats.averageProgress = progressCount > 0
        ? Math.round(totalProgress / progressCount)
        : 0;

      // 7. Sort employees by progress (lowest first to highlight at-risk)
      employeeProgressList.sort((a, b) => {
        // At-risk first
        if (a.status === 'at-risk' && b.status !== 'at-risk') return -1;
        if (a.status !== 'at-risk' && b.status === 'at-risk') return 1;

        // Then by progress percent
        return a.progressPercent - b.progressPercent;
      });

      console.log(`📊 Company dashboard stats:`, stats);

      return {
        success: true,
        companyName: companyData?.name,
        stats,
        employees: employeeProgressList,
        masterclasses: Array.from(coursesData.values()).map(c => ({
          id: c.id,
          title: c.title,
          duration: c.totalLessons, // Use lesson count as duration indicator
        })),
      };
    } catch (error: any) {
      console.error('Error fetching company dashboard:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Get Individual Employee Progress Detail
 * Uses enrollments and lessonProgress collections
 */
export const getEmployeeProgressDetail = https.onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
  },
  async (
    request: CallableRequest<{ companyId: string; employeeId: string }>
  ) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { companyId, employeeId } = request.data;
    const userId = request.auth.uid;

    if (!companyId || !employeeId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // Verify admin permission
      const adminDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .get();

      if (!adminDoc.exists) {
        throw new HttpsError(
          'permission-denied',
          'You are not an admin of this company'
        );
      }

      // Get employee data
      const employeeDoc = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        throw new HttpsError('not-found', 'Employee not found');
      }

      const employeeData = employeeDoc.data();

      if (!employeeData) {
        throw new HttpsError('not-found', 'Employee data not found');
      }

      // Get all enrollments for this employee's userId (from enrollments collection)
      if (!employeeData.userId) {
        return {
          success: true,
          employee: {
            id: employeeDoc.id,
            ...employeeData,
            inviteAcceptedAt: employeeData.inviteAcceptedAt?.toDate(),
            invitedAt: employeeData.invitedAt?.toDate(),
          },
          courses: [],
        };
      }

      // Query enrollments for this user that belong to this company
      const enrollmentsSnapshot = await db
        .collection('enrollments')
        .where('userId', '==', employeeData.userId)
        .where('enrolledByCompany', '==', companyId)
        .get();

      // Get progress for each enrollment
      const progressDetails = await Promise.all(
        enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
          const enrollment = enrollmentDoc.data();
          const courseId = enrollment.courseId;

          // Get course details
          const courseDoc = await db.collection('courses').doc(courseId).get();
          if (!courseDoc.exists) return null;

          const courseData = courseDoc.data();
          const courseType = courseData?.courseType || courseData?.type;

          // Get total lessons
          let totalLessons = courseData?.lessonCount || 0;
          if (totalLessons === 0) {
            const lessonsSnapshot = await db
              .collection('courses')
              .doc(courseId)
              .collection('lessons')
              .get();
            totalLessons = lessonsSnapshot.size;
          }

          // For ACADEMIA courses, also check modules subcollection
          if (totalLessons === 0 && courseType === 'ACADEMIA') {
            const modulesSnapshot = await db
              .collection('courses')
              .doc(courseId)
              .collection('modules')
              .get();

            for (const moduleDoc of modulesSnapshot.docs) {
              const moduleLessonsSnapshot = await db
                .collection('courses')
                .doc(courseId)
                .collection('modules')
                .doc(moduleDoc.id)
                .collection('lessons')
                .get();
              totalLessons += moduleLessonsSnapshot.size;
            }
          }

          // Count completed lessons
          const completedLessonsSnapshot = await db
            .collection('lessonProgress')
            .where('userId', '==', employeeData.userId)
            .where('courseId', '==', courseId)
            .where('completed', '==', true)
            .get();

          const completedLessonsCount = completedLessonsSnapshot.size;

          return {
            masterclass: {
              id: courseId,
              title: courseData?.title || 'Unknown Course',
              totalLessons,
            },
            progress: {
              completedLessons: completedLessonsCount,
              totalLessons,
              progressPercent: Math.round(enrollment.progress || 0),
              status: enrollment.status,
              enrolledAt: enrollment.enrolledAt?.toDate(),
              lastActivityAt: enrollment.lastAccessedAt?.toDate(),
            },
          };
        })
      );

      return {
        success: true,
        employee: {
          id: employeeDoc.id,
          ...employeeData,
          inviteAcceptedAt: employeeData.inviteAcceptedAt?.toDate(),
          invitedAt: employeeData.invitedAt?.toDate(),
        },
        courses: progressDetails.filter(Boolean),
      };
    } catch (error: any) {
      console.error('Error fetching employee progress detail:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);
