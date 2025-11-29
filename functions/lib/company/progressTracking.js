"use strict";
/**
 * Progress Tracking Functions for Company Admins
 * Track and analyze employee progress across purchased courses
 *
 * Uses the same progress tracking system as individual users:
 * - enrollments collection: enrollment status and progress percentage
 * - lessonProgress collection: individual lesson completion
 * - courses collection: course details with lessons subcollection
 */
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
exports.getEmployeeProgressDetail = exports.getCompanyDashboard = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Safely convert a Firestore timestamp or date to a JavaScript Date
 */
function toDate(value) {
    if (!value)
        return undefined;
    // Firestore Timestamp
    if (value.toDate && typeof value.toDate === 'function') {
        return value.toDate();
    }
    // Already a Date
    if (value instanceof Date) {
        return value;
    }
    // ISO string or timestamp number
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
}
/**
 * Get Company Dashboard Data
 * Returns aggregated progress for all employees using enrollments and lessonProgress collections
 */
exports.getCompanyDashboard = v2_1.https.onCall({
    region: 'us-central1',
    memory: '512MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, courseId } = request.data;
    // Support both 'courseId' and legacy 'masterclassId' parameter
    const filterCourseId = courseId || request.data.masterclassId;
    const userId = request.auth.uid;
    if (!companyId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing companyId');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        // 2. Get company data
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Company not found');
        }
        const companyData = companyDoc.data();
        // 3. Get all users who belong to this company
        // First, get company employees from employees subcollection
        const employeesSnapshot = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .where('status', '==', 'active')
            .get();
        // Also get users who have companyId set on their user document
        const usersWithCompanySnapshot = await db
            .collection('users')
            .where('companyId', '==', companyId)
            .get();
        // Collect all user IDs that belong to this company
        const companyUserIds = new Set();
        employeesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.userId) {
                companyUserIds.add(data.userId);
            }
        });
        usersWithCompanySnapshot.docs.forEach(doc => {
            companyUserIds.add(doc.id);
        });
        console.log(`📊 Found ${companyUserIds.size} users belonging to company ${companyId}`);
        if (companyUserIds.size === 0) {
            // No users in company, return empty stats
            return {
                success: true,
                companyName: companyData?.name,
                stats: {
                    totalEmployees: 0,
                    activeEmployees: 0,
                    completedCourses: 0,
                    averageProgress: 0,
                    atRiskCount: 0,
                },
                employees: [],
                masterclasses: [],
            };
        }
        // 4. Get all enrollments for company users
        // Firestore 'in' query is limited to 30 values, so we need to batch
        const userIdArray = Array.from(companyUserIds);
        const enrollmentDocs = [];
        // Batch queries in groups of 30 (Firestore limit for 'in' queries)
        for (let i = 0; i < userIdArray.length; i += 30) {
            const batch = userIdArray.slice(i, i + 30);
            let enrollmentsQuery = db
                .collection('enrollments')
                .where('userId', 'in', batch);
            // Filter by specific course if requested
            if (filterCourseId) {
                enrollmentsQuery = enrollmentsQuery.where('courseId', '==', filterCourseId);
            }
            const batchSnapshot = await enrollmentsQuery.get();
            enrollmentDocs.push(...batchSnapshot.docs);
        }
        console.log(`📊 Found ${enrollmentDocs.length} enrollments for company users in ${companyId}`);
        // 5. Get unique course IDs and fetch course details
        const courseIds = new Set();
        enrollmentDocs.forEach(doc => {
            const data = doc.data();
            if (data.courseId) {
                courseIds.add(data.courseId);
            }
        });
        // Fetch course details and lesson counts
        const coursesData = new Map();
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
        // 6. Get unique user IDs from enrollments and fetch user details
        const userIds = new Set();
        enrollmentDocs.forEach(doc => {
            const data = doc.data();
            if (data.userId) {
                userIds.add(data.userId);
            }
        });
        // Fetch user details
        const usersData = new Map();
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
        // Use the already-fetched employee data for job titles
        // (employeesSnapshot was fetched earlier)
        const employeesDataMap = new Map();
        employeesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.userId) {
                employeesDataMap.set(data.userId, {
                    jobTitle: data.jobTitle,
                    employeeId: doc.id,
                    fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                });
            }
        });
        // 7. Build employee progress list from enrollments
        const employeeProgressList = [];
        const stats = {
            totalEmployees: companyUserIds.size, // Use company users count, not enrollment users
            activeEmployees: 0,
            completedCourses: 0,
            averageProgress: 0,
            atRiskCount: 0,
        };
        let totalProgress = 0;
        let progressCount = 0;
        const activeUserIds = new Set();
        for (const enrollmentDoc of enrollmentDocs) {
            const enrollment = enrollmentDoc.data();
            const enrollmentUserId = enrollment.userId;
            const enrollmentCourseId = enrollment.courseId;
            if (!enrollmentUserId || !enrollmentCourseId)
                continue;
            const course = coursesData.get(enrollmentCourseId);
            if (!course)
                continue;
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
            let status = 'not-started';
            if (enrollment.status === 'completed' || progressPercent === 100) {
                status = 'completed';
                stats.completedCourses++;
            }
            else if (enrollment.lastAccessedAt) {
                const lastActivity = toDate(enrollment.lastAccessedAt);
                if (lastActivity) {
                    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceActivity > 7) {
                        status = 'at-risk';
                        stats.atRiskCount++;
                    }
                    else {
                        status = 'active';
                        activeUserIds.add(enrollmentUserId);
                    }
                }
                else {
                    status = progressPercent > 0 ? 'active' : 'not-started';
                    if (progressPercent > 0)
                        activeUserIds.add(enrollmentUserId);
                }
            }
            else if (progressPercent > 0) {
                status = 'active';
                activeUserIds.add(enrollmentUserId);
            }
            // Calculate days since enrollment
            const enrolledAt = toDate(enrollment.enrolledAt) || new Date();
            const daysActive = Math.floor((Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24));
            employeeProgressList.push({
                employeeId: employee?.employeeId || enrollmentUserId,
                employeeName: employee?.fullName || user?.displayName || 'Unknown User',
                email: user?.email || '',
                jobTitle: employee?.jobTitle,
                masterclassId: enrollmentCourseId, // Keep for backwards compatibility
                masterclassTitle: course.title,
                currentLesson: completedLessonsCount + 1, // Next lesson to complete
                completedLessons: completedLessonsCount,
                totalLessons: course.totalLessons,
                progressPercent,
                status,
                lastActivityAt: toDate(enrollment.lastAccessedAt),
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
        // 8. Sort employees by progress (lowest first to highlight at-risk)
        employeeProgressList.sort((a, b) => {
            // At-risk first
            if (a.status === 'at-risk' && b.status !== 'at-risk')
                return -1;
            if (a.status !== 'at-risk' && b.status === 'at-risk')
                return 1;
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
    }
    catch (error) {
        console.error('Error fetching company dashboard:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Get Individual Employee Progress Detail
 * Uses enrollments and lessonProgress collections
 */
exports.getEmployeeProgressDetail = v2_1.https.onCall({
    region: 'us-central1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, employeeId } = request.data;
    const userId = request.auth.uid;
    if (!companyId || !employeeId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
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
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        // Get employee data
        const employeeDoc = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc(employeeId)
            .get();
        if (!employeeDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Employee not found');
        }
        const employeeData = employeeDoc.data();
        if (!employeeData) {
            throw new https_1.HttpsError('not-found', 'Employee data not found');
        }
        // Get all enrollments for this employee's userId (from enrollments collection)
        if (!employeeData.userId) {
            return {
                success: true,
                employee: {
                    id: employeeDoc.id,
                    ...employeeData,
                    inviteAcceptedAt: toDate(employeeData.inviteAcceptedAt),
                    invitedAt: toDate(employeeData.invitedAt),
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
        const progressDetails = await Promise.all(enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
            const enrollment = enrollmentDoc.data();
            const courseId = enrollment.courseId;
            // Get course details
            const courseDoc = await db.collection('courses').doc(courseId).get();
            if (!courseDoc.exists)
                return null;
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
                    enrolledAt: toDate(enrollment.enrolledAt),
                    lastActivityAt: toDate(enrollment.lastAccessedAt),
                },
            };
        }));
        return {
            success: true,
            employee: {
                id: employeeDoc.id,
                ...employeeData,
                inviteAcceptedAt: toDate(employeeData.inviteAcceptedAt),
                invitedAt: toDate(employeeData.invitedAt),
            },
            courses: progressDetails.filter(Boolean),
        };
    }
    catch (error) {
        console.error('Error fetching employee progress detail:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=progressTracking.js.map