/**
 * Progress Tracking Functions for Company Admins
 * Track and analyze employee progress across purchased masterclasses
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface GetCompanyDashboardInput {
  companyId: string;
  masterclassId?: string; // Optional: filter by specific masterclass
}

interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  email: string;
  jobTitle?: string;
  masterclassId: string;
  masterclassTitle: string;
  currentModule: number;
  completedModules: number[];
  totalModules: number;
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
 * Returns aggregated progress for all employees or specific masterclass
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

    const { companyId, masterclassId } = request.data;
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
      const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];

      // Filter to specific masterclass if requested
      const masterclassesToTrack = masterclassId
        ? [masterclassId]
        : purchasedMasterclasses;

      // 3. Get all active employees
      const employeesSnapshot = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('status', '==', 'active')
        .get();

      // 4. Get masterclass details
      const masterclassesData = new Map();
      for (const id of masterclassesToTrack) {
        const masterclassDoc = await db.collection('course-content').doc(id).get();
        if (masterclassDoc.exists) {
          masterclassesData.set(id, {
            id: masterclassDoc.id,
            title: masterclassDoc.data()?.title || 'Unknown Course',
            duration: masterclassDoc.data()?.duration || 10,
          });
        }
      }

      // 5. Aggregate employee progress
      const employeeProgressList: EmployeeProgress[] = [];
      const stats: DashboardStats = {
        totalEmployees: employeesSnapshot.size,
        activeEmployees: 0,
        completedCourses: 0,
        averageProgress: 0,
        atRiskCount: 0,
      };

      let totalProgress = 0;
      let progressCount = 0;

      for (const employeeDoc of employeesSnapshot.docs) {
        const employeeData = employeeDoc.data();
        const enrolledMasterclasses = employeeData.enrolledMasterclasses || [];

        // Skip if employee not enrolled in any tracked masterclasses
        const relevantEnrollments = enrolledMasterclasses.filter((id: string) =>
          masterclassesToTrack.includes(id)
        );

        if (relevantEnrollments.length === 0) {
          continue;
        }

        // Track if employee is active in any course
        let isActive = false;

        // Get progress for each enrolled masterclass
        for (const mcId of relevantEnrollments) {
          const masterclass = masterclassesData.get(mcId);
          if (!masterclass) continue;

          let progressData = null;
          let progressPercent = 0;

          // Get progress if employee has userId (accepted invite)
          if (employeeData.userId) {
            // 🔴 CRITICAL FIX: Use correct flat collection structure
            // Format: userProgress/{userId}_{masterclassId}
            const progressId = `${employeeData.userId}_${mcId}`;
            const courseProgressDoc = await db
              .collection('userProgress')
              .doc(progressId)
              .get();

            if (courseProgressDoc.exists) {
              progressData = courseProgressDoc.data();
              progressPercent = progressData?.overallProgress || 0;
            }
          }

          // Fallback values for module-based display (if needed)
          const completedLessons = progressData?.completedLessons || [];
          const totalLessons = progressData?.totalLessons || 0;
          const currentModule = progressData?.currentModule || 1;

          // Calculate status
          let status: 'active' | 'completed' | 'at-risk' | 'not-started' = 'not-started';

          if (progressData) {
            if (progressPercent === 100) {
              status = 'completed';
              stats.completedCourses++;
            } else if (progressData.lastAccessedAt) {
              const lastActivity = progressData.lastAccessedAt.toDate();
              const daysSinceActivity = Math.floor(
                (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (daysSinceActivity > 7) {
                status = 'at-risk';
                stats.atRiskCount++;
              } else {
                status = 'active';
                isActive = true;
              }
            }
          }

          // Calculate days active
          const enrolledAt = employeeData.inviteAcceptedAt?.toDate() || new Date();
          const daysActive = Math.floor(
            (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          employeeProgressList.push({
            employeeId: employeeDoc.id,
            employeeName: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
            email: employeeData.email,
            jobTitle: employeeData.jobTitle,
            masterclassId: mcId,
            masterclassTitle: masterclass.title,
            currentModule,
            completedModules: completedLessons, // Use completedLessons from new data structure
            totalModules: totalLessons, // Use totalLessons from new data structure
            progressPercent,
            status,
            lastActivityAt: progressData?.lastAccessedAt?.toDate(),
            enrolledAt,
            daysActive,
          });

          totalProgress += progressPercent;
          progressCount++;
        }

        if (isActive) {
          stats.activeEmployees++;
        }
      }

      // Calculate average progress
      stats.averageProgress = progressCount > 0
        ? Math.round(totalProgress / progressCount)
        : 0;

      // 6. Sort employees by progress (lowest first to highlight at-risk)
      employeeProgressList.sort((a, b) => {
        // At-risk first
        if (a.status === 'at-risk' && b.status !== 'at-risk') return -1;
        if (a.status !== 'at-risk' && b.status === 'at-risk') return 1;

        // Then by progress percent
        return a.progressPercent - b.progressPercent;
      });

      return {
        success: true,
        companyName: companyData?.name,
        stats,
        employees: employeeProgressList,
        masterclasses: Array.from(masterclassesData.values()),
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

      const enrolledMasterclasses = employeeData.enrolledMasterclasses || [];

      // Get progress for each enrolled masterclass
      const progressDetails = await Promise.all(
        enrolledMasterclasses.map(async (masterclassId: string) => {
          const masterclassDoc = await db
            .collection('course-content')
            .doc(masterclassId)
            .get();

          if (!masterclassDoc.exists) return null;

          let progressData = null;

          if (employeeData.userId) {
            const progressId = `${employeeData.userId}_${masterclassId}`;
            const progressDoc = await db
              .collection('userProgress')
              .doc(progressId)
              .get();

            if (progressDoc.exists) {
              progressData = progressDoc.data();
            }
          }

          return {
            masterclass: {
              id: masterclassDoc.id,
              ...masterclassDoc.data(),
            },
            progress: progressData
              ? {
                  currentModule: progressData.currentModule,
                  completedModules: progressData.completedModules,
                  status: progressData.status,
                  enrolledAt: progressData.enrolledAt?.toDate(),
                  lastActivityAt: progressData.lastActivityAt?.toDate(),
                }
              : null,
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
