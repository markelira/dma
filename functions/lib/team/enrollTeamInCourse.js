"use strict";
/**
 * Enroll Team In Course Cloud Function
 *
 * Allows team owner to enroll all team members in a course.
 * Creates enrollment records for each active team member.
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
exports.getTeamEnrolledCourses = exports.enrollTeamInCourse = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const team_1 = require("../types/team");
const firestore = admin.firestore();
/**
 * Enroll all active team members in a course
 * Callable function - requires authentication
 */
exports.enrollTeamInCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { teamId, courseId } = request.data;
        const userId = request.auth.uid;
        v2_1.logger.info('[enrollTeamInCourse] Enrolling team in course', { teamId, courseId, userId });
        // 2. Validate input
        if (!teamId || !courseId) {
            throw new https_1.HttpsError('invalid-argument', 'Team ID és kurzus ID szükséges');
        }
        // 3. Get team and verify permissions
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        // Check if user is team owner
        if (!(0, team_1.isTeamOwner)(team, userId)) {
            throw new https_1.HttpsError('permission-denied', 'Csak a csapat tulajdonosa adhat hozzá kurzusokat');
        }
        // Check if subscription is active
        if (!(0, team_1.hasActiveSubscription)(team.subscriptionStatus)) {
            throw new https_1.HttpsError('failed-precondition', 'Az előfizetés nem aktív. Kérjük, aktiváld az előfizetést.');
        }
        // 4. Check if course exists
        const courseDoc = await firestore.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Kurzus nem található');
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
        const memberUserIds = [];
        membersSnapshot.docs.forEach((doc) => {
            const member = doc.data();
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
        v2_1.logger.info('[enrollTeamInCourse] Team enrolled in course successfully', {
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
    }
    catch (error) {
        v2_1.logger.error('[enrollTeamInCourse] Error:', error);
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
 * Get team's enrolled courses
 * Callable function - requires authentication
 */
exports.getTeamEnrolledCourses = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // 1. Check authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Hitelesítés szükséges');
        }
        const { teamId } = request.data;
        const userId = request.auth.uid;
        if (!teamId) {
            throw new https_1.HttpsError('invalid-argument', 'Team ID szükséges');
        }
        // 2. Get team and verify membership
        const teamDoc = await firestore.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Csapat nem található');
        }
        const team = teamDoc.data();
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
            throw new https_1.HttpsError('permission-denied', 'Nincs jogosultságod ehhez a csapathoz');
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
                    lessonCount: courseData?.lessonCount || courseData?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0,
                    enrolledAt: enrolledCourseData?.enrolledAt?.toDate?.()?.toISOString() || null,
                    memberCount: enrolledCourseData?.memberCount || 0,
                });
            }
        }
        return { success: true, courses };
    }
    catch (error) {
        v2_1.logger.error('[getTeamEnrolledCourses] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        return {
            success: false,
            error: error.message || 'Kurzusok lekérése sikertelen',
        };
    }
});
//# sourceMappingURL=enrollTeamInCourse.js.map