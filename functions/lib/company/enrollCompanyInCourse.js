"use strict";
/**
 * Enroll Company Employees In Course Cloud Function
 *
 * Allows company admin to enroll all active employees in a course.
 * Creates enrollment records for each active employee.
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
exports.getCompanyEnrolledCourses = exports.enrollCompanyInCourse = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const firestore = admin.firestore();
/**
 * Enroll all active company employees in a course
 * Callable function - requires authentication
 */
exports.enrollCompanyInCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { companyId, courseId } = request.data;
        const userId = request.auth.uid;
        v2_1.logger.info('[enrollCompanyInCourse] Enrolling company in course', { companyId, courseId, userId });
        // 2. Validate input
        if (!companyId || !courseId) {
            throw new https_1.HttpsError('invalid-argument', 'Company ID és kurzus ID szükséges');
        }
        // 3. Get company and verify admin permissions
        const companyDoc = await firestore.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Vállalat nem található');
        }
        // Check if user is company admin
        const adminDoc = await firestore
            .collection('companies')
            .doc(companyId)
            .collection('admins')
            .doc(userId)
            .get();
        if (!adminDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'Csak a vállalat adminisztrátorai adhatnak hozzá kurzusokat');
        }
        // 4. Check if course exists
        const courseDoc = await firestore.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Kurzus nem található');
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
        const employeeUserIds = [];
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
                enrolledAt: new Date().toISOString(),
                progress: 0,
                status: 'ACTIVE',
                completedLessons: [],
                lastAccessedAt: new Date().toISOString(),
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
        v2_1.logger.info('[enrollCompanyInCourse] Company enrolled in course successfully', {
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
    }
    catch (error) {
        v2_1.logger.error('[enrollCompanyInCourse] Error:', error);
        if (error instanceof https_1.HttpsError) {
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
exports.getCompanyEnrolledCourses = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { companyId } = request.data;
        const userId = request.auth.uid;
        if (!companyId) {
            throw new https_1.HttpsError('invalid-argument', 'Company ID szükséges');
        }
        // 2. Get company and verify membership
        const companyDoc = await firestore.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Vállalat nem található');
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
            throw new https_1.HttpsError('permission-denied', 'Nincs jogosultságod ehhez a vállalathoz');
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
                    lessonCount: courseData?.lessonCount || courseData?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0,
                    enrolledAt: enrolledCourseData?.enrolledAt?.toDate?.()?.toISOString() || null,
                    employeeCount: enrolledCourseData?.employeeCount || 0,
                });
            }
        }
        return { success: true, courses };
    }
    catch (error) {
        v2_1.logger.error('[getCompanyEnrolledCourses] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Kurzusok lekérése sikertelen',
        };
    }
});
//# sourceMappingURL=enrollCompanyInCourse.js.map