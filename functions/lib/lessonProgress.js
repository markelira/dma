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
exports.syncProgressOnDeviceSwitch = exports.getSyncedLessonProgress = void 0;
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
//# sourceMappingURL=lessonProgress.js.map