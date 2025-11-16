"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllCourses = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const firestore = (0, firestore_1.getFirestore)();
/**
 * Delete all courses from the database (Admin only)
 * WARNING: This is a destructive operation!
 * Used for migrating to the new 3-tier course type system
 */
exports.deleteAllCourses = (0, https_1.onCall)({
    region: 'us-central1',
    maxInstances: 1,
}, async (request) => {
    const uid = request.auth?.uid;
    // Authentication check
    if (!uid) {
        v2_1.logger.warn('Unauthenticated deleteAllCourses attempt');
        throw new Error('Authentication required');
    }
    // Permission check - ADMIN only
    const userDoc = await firestore.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'ADMIN') {
        v2_1.logger.warn(`Unauthorized deleteAllCourses attempt by user ${uid} with role ${userData?.role}`);
        throw new Error('Admin access required');
    }
    v2_1.logger.info(`Admin ${uid} initiated deleteAllCourses operation`);
    let deletedCourses = 0;
    let deletedModules = 0;
    let deletedLessons = 0;
    try {
        // Get all courses
        const coursesSnapshot = await firestore.collection('courses').get();
        v2_1.logger.info(`Found ${coursesSnapshot.size} courses to delete`);
        // Delete each course and its subcollections
        for (const courseDoc of coursesSnapshot.docs) {
            const courseId = courseDoc.id;
            // Delete modules and their lessons
            const modulesSnapshot = await firestore
                .collection('courses')
                .doc(courseId)
                .collection('modules')
                .get();
            for (const moduleDoc of modulesSnapshot.docs) {
                const moduleId = moduleDoc.id;
                // Delete lessons in this module
                const lessonsSnapshot = await firestore
                    .collection('courses')
                    .doc(courseId)
                    .collection('modules')
                    .doc(moduleId)
                    .collection('lessons')
                    .get();
                for (const lessonDoc of lessonsSnapshot.docs) {
                    await lessonDoc.ref.delete();
                    deletedLessons++;
                }
                // Delete the module
                await moduleDoc.ref.delete();
                deletedModules++;
            }
            // Delete the course
            await courseDoc.ref.delete();
            deletedCourses++;
            // Log progress every 10 courses
            if (deletedCourses % 10 === 0) {
                v2_1.logger.info(`Progress: ${deletedCourses} courses deleted`);
            }
        }
        // Create audit log entry
        await firestore.collection('auditLogs').add({
            userId: uid,
            userEmail: userData.email || '',
            userName: userData.displayName || userData.email || 'Admin',
            action: 'DELETE_ALL_COURSES',
            resource: 'Course',
            resourceId: 'ALL',
            details: JSON.stringify({
                deletedCourses,
                deletedModules,
                deletedLessons,
                reason: 'Migration to 3-tier course type system',
            }),
            severity: 'HIGH',
            ipAddress: request.rawRequest.ip || 'N/A',
            userAgent: request.rawRequest.headers['user-agent'] || 'N/A',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info(`✅ Successfully deleted ${deletedCourses} courses, ${deletedModules} modules, ${deletedLessons} lessons`);
        return {
            success: true,
            message: 'All courses deleted successfully',
            deletedCourses,
            deletedModules,
            deletedLessons,
        };
    }
    catch (error) {
        v2_1.logger.error('Error deleting courses:', error);
        throw new Error(`Failed to delete courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
//# sourceMappingURL=dataCleanup.js.map