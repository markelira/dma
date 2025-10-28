/**
 * Generate CSV Report for Company Dashboard
 * Exports employee progress data as CSV file
 */

import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface GenerateCSVInput {
  companyId: string;
  masterclassId?: string; // Optional: filter by specific masterclass
}

/**
 * Convert dashboard data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available';
  }

  // CSV Headers
  const headers = [
    'Employee Name',
    'Email',
    'Job Title',
    'Masterclass',
    'Progress (%)',
    'Current Module',
    'Completed Modules',
    'Total Modules',
    'Status',
    'Last Activity',
    'Days Active',
    'Enrolled At',
  ];

  // CSV Rows
  const rows = data.map((employee) => [
    `"${employee.employeeName || ''}"`,
    `"${employee.email || ''}"`,
    `"${employee.jobTitle || 'N/A'}"`,
    `"${employee.masterclassTitle || ''}"`,
    employee.progressPercent || 0,
    employee.currentModule || 0,
    employee.completedModules?.length || 0,
    employee.totalModules || 0,
    `"${employee.status || 'not-started'}"`,
    employee.lastActivityAt
      ? `"${new Date(employee.lastActivityAt).toLocaleDateString('hu-HU')}"`
      : '"Never"',
    employee.daysActive || 0,
    employee.enrolledAt
      ? `"${new Date(employee.enrolledAt).toLocaleDateString('hu-HU')}"`
      : '"N/A"',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Generate CSV Report
 */
export const generateCSVReport = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 5, // Limit concurrent exports (expensive operation)
    timeoutSeconds: 300, // 5 minutes for large datasets
    cors: true,
  },
  async (request: CallableRequest<GenerateCSVInput>) => {
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

      const adminData = adminDoc.data();
      if (!adminData?.permissions?.canViewReports) {
        throw new HttpsError(
          'permission-denied',
          'No permission to view reports'
        );
      }

      // 2. Get company data
      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Company not found');
      }

      const companyData = companyDoc.data();
      const companyName = companyData?.name || 'Company';
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
        const masterclassDoc = await db
          .collection('course-content')
          .doc(id)
          .get();
        if (masterclassDoc.exists) {
          masterclassesData.set(id, {
            id: masterclassDoc.id,
            title: masterclassDoc.data()?.title || 'Unknown Course',
            duration: masterclassDoc.data()?.duration || 10,
          });
        }
      }

      // 5. Aggregate employee progress
      const employeeProgressList = [];

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

        // Get progress for each enrolled masterclass
        for (const mcId of relevantEnrollments) {
          const masterclass = masterclassesData.get(mcId);
          if (!masterclass) continue;

          let progressData = null;
          let progressPercent = 0;

          // Get progress if employee has userId (accepted invite)
          if (employeeData.userId) {
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

          const completedLessons = progressData?.completedLessons || [];
          const totalLessons = progressData?.totalLessons || 0;
          const currentModule = progressData?.currentModule || 1;

          // Calculate status
          let status = 'not-started';

          if (progressData) {
            if (progressPercent === 100) {
              status = 'completed';
            } else if (progressData.lastAccessedAt) {
              const lastActivity = progressData.lastAccessedAt.toDate();
              const daysSinceActivity = Math.floor(
                (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (daysSinceActivity > 7) {
                status = 'at-risk';
              } else {
                status = 'active';
              }
            }
          }

          // Calculate days active
          const enrolledAt =
            employeeData.inviteAcceptedAt?.toDate() || new Date();
          const daysActive = Math.floor(
            (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          employeeProgressList.push({
            employeeId: employeeDoc.id,
            employeeName:
              employeeData.fullName ||
              `${employeeData.firstName} ${employeeData.lastName}`,
            email: employeeData.email,
            jobTitle: employeeData.jobTitle,
            masterclassId: mcId,
            masterclassTitle: masterclass.title,
            currentModule,
            completedModules: completedLessons,
            totalModules: totalLessons,
            progressPercent,
            status,
            lastActivityAt: progressData?.lastAccessedAt?.toDate(),
            enrolledAt,
            daysActive,
          });
        }
      }

      // 6. Convert to CSV
      const csvContent = convertToCSV(employeeProgressList);

      // 7. Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `reports/${companyId}_${timestamp}.csv`;
      const file = bucket.file(fileName);

      await file.save(csvContent, {
        metadata: {
          contentType: 'text/csv',
          metadata: {
            companyId,
            generatedBy: userId,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      // 8. Generate signed URL (valid for 1 hour)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 3600000, // 1 hour
      });

      console.log(
        `Generated CSV report for company ${companyId}: ${employeeProgressList.length} employees`
      );

      return {
        success: true,
        downloadUrl: url,
        fileName: `${companyName}_progress_${timestamp}.csv`,
        employeeCount: employeeProgressList.length,
        message: 'CSV report generated successfully',
      };
    } catch (error: any) {
      console.error('Error generating CSV report:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error.message);
    }
  }
);
