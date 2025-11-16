"use strict";
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
exports.markLessonComplete = exports.syncProgressOnDeviceSwitch = exports.getSyncedLessonProgress = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const zod_1 = require("zod");
const firestore = admin.firestore();
// Schema for getSyncedLessonProgress
const GetSyncedProgressSchema = zod_1.z.object({
    lessonId: zod_1.z.string(),
    courseId: zod_1.z.string().optional(),
});
// Schema for syncProgressOnDeviceSwitch
const DeviceSyncSchema = zod_1.z.object({
    deviceId: zod_1.z.string(),
    courseId: zod_1.z.string().optional(),
});
// Schema for markLessonComplete
const MarkCompleteSchema = zod_1.z.object({
    lessonId: zod_1.z.string(),
    courseId: zod_1.z.string(),
    timeSpent: zod_1.z.number().min(0),
    analytics: zod_1.z.object({
        sessionId: zod_1.z.string().optional(),
        engagementEvents: zod_1.z.array(zod_1.z.any()).optional(),
    }).optional(),
});
/**
 * Get synchronized lesson progress across devices
 */
exports.getSyncedLessonProgress = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Check authentication
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const userId = request.auth.uid;
        // Validate input
        const { lessonId, courseId } = GetSyncedProgressSchema.parse(request.data);
        v2_1.logger.info('Getting synced lesson progress', {
            userId,
            lessonId,
            courseId
        });
        // Query lesson progress from Firestore
        const progressQuery = await firestore
            .collection('lessonProgress')
            .where('userId', '==', userId)
            .where('lessonId', '==', lessonId)
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get();
        if (progressQuery.empty) {
            return {
                success: true,
                progress: null,
                message: 'No progress found for this lesson'
            };
        }
        const progressDoc = progressQuery.docs[0];
        const progressData = progressDoc.data();
        return {
            success: true,
            progress: {
                id: progressDoc.id,
                lessonId: progressData.lessonId,
                courseId: progressData.courseId || courseId,
                watchPercentage: progressData.watchPercentage || 0,
                timeSpent: progressData.timeSpent || 0,
                resumePosition: progressData.resumePosition || 0,
                completed: progressData.completed || false,
                lastWatchedAt: progressData.updatedAt?.toDate?.() || new Date(),
                deviceId: progressData.deviceId,
                sessionId: progressData.sessionId,
                syncVersion: progressData.syncVersion || Date.now(),
            }
        };
    }
    catch (error) {
        v2_1.logger.error('Error getting synced lesson progress:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validation error',
                details: error.errors
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get lesson progress'
        };
    }
});
/**
 * Sync progress when switching devices
 */
exports.syncProgressOnDeviceSwitch = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Check authentication
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const userId = request.auth.uid;
        // Validate input
        const { deviceId, courseId } = DeviceSyncSchema.parse(request.data);
        v2_1.logger.info('Syncing progress on device switch', {
            userId,
            deviceId,
            courseId
        });
        // Build query
        let query = firestore
            .collection('lessonProgress')
            .where('userId', '==', userId);
        if (courseId) {
            query = query.where('courseId', '==', courseId);
        }
        const progressSnapshot = await query.get();
        const syncedLessons = [];
        const batch = firestore.batch();
        // Update device ID for all progress records
        progressSnapshot.docs.forEach(doc => {
            const progressRef = firestore.collection('lessonProgress').doc(doc.id);
            batch.update(progressRef, {
                deviceId,
                syncVersion: Date.now(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            syncedLessons.push({
                lessonId: doc.data().lessonId,
                courseId: doc.data().courseId,
                progress: doc.data().watchPercentage || 0,
            });
        });
        await batch.commit();
        return {
            success: true,
            deviceId,
            syncedLessons,
            syncTime: new Date().toISOString(),
            message: `Successfully synced ${syncedLessons.length} lessons to device ${deviceId}`
        };
    }
    catch (error) {
        v2_1.logger.error('Error syncing progress on device switch:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validation error',
                details: error.errors
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sync progress'
        };
    }
});
/**
 * Mark a lesson as complete (100%)
 * Updates progress, checks course completion, awards badges/certificates
 */
exports.markLessonComplete = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Check authentication
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const userId = request.auth.uid;
        // Validate input
        const { lessonId, courseId, timeSpent, analytics } = MarkCompleteSchema.parse(request.data);
        v2_1.logger.info('Marking lesson as complete', {
            userId,
            lessonId,
            courseId,
            timeSpent
        });
        // Get user data
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        const userData = userDoc.data();
        // Update lesson progress
        const progressId = `${userId}_${lessonId}`;
        const progressRef = firestore.collection('lessonProgress').doc(progressId);
        await progressRef.set({
            userId,
            lessonId,
            courseId,
            watchPercentage: 100,
            timeSpent,
            completed: true,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastWatchedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(analytics && {
                sessionId: analytics.sessionId,
                engagementEvents: analytics.engagementEvents
            })
        }, { merge: true });
        // Check if all lessons in the course are completed
        const courseRef = firestore.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new Error('Course not found');
        }
        const courseData = courseDoc.data();
        // Get all lessons for this course
        const lessonsSnapshot = await courseRef.collection('lessons').get();
        const totalLessons = lessonsSnapshot.size;
        // Get all completed lessons for this user in this course
        const completedLessonsSnapshot = await firestore
            .collection('lessonProgress')
            .where('userId', '==', userId)
            .where('courseId', '==', courseId)
            .where('completed', '==', true)
            .get();
        const completedLessons = completedLessonsSnapshot.size;
        const courseCompleted = completedLessons >= totalLessons;
        v2_1.logger.info('Course progress check', {
            userId,
            courseId,
            completedLessons,
            totalLessons,
            courseCompleted
        });
        // Update enrollment if course is completed
        if (courseCompleted) {
            const enrollmentRef = firestore.collection('enrollments').doc(`${userId}_${courseId}`);
            await enrollmentRef.update({
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                progress: 100,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            v2_1.logger.info('Course completed - enrollment updated', {
                userId,
                courseId
            });
            // TODO: Award certificate
            // TODO: Send completion email
            // TODO: Award badges based on course completion
        }
        return {
            success: true,
            data: {
                lessonId,
                courseId,
                completed: true,
                completedAt: new Date().toISOString(),
                courseProgress: {
                    completedLessons,
                    totalLessons,
                    percentage: Math.round((completedLessons / totalLessons) * 100),
                    courseCompleted
                }
            },
            message: courseCompleted
                ? 'Gratulálunk! Teljesítetted a kurzust!'
                : 'Lecke sikeresen befejezve!'
        };
    }
    catch (error) {
        v2_1.logger.error('Error marking lesson complete:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validation error',
                details: error.errors
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to mark lesson complete'
        };
    }
});
//# sourceMappingURL=lessonProgress.js.map