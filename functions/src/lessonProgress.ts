import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';

const firestore = admin.firestore();

// Schema for getSyncedLessonProgress
const GetSyncedProgressSchema = z.object({
  lessonId: z.string(),
  courseId: z.string().optional(),
});

// Schema for syncProgressOnDeviceSwitch
const DeviceSyncSchema = z.object({
  deviceId: z.string(),
  courseId: z.string().optional(),
});

/**
 * Get synchronized lesson progress across devices
 */
export const getSyncedLessonProgress = onCall({
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

    logger.info('Getting synced lesson progress', {
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
  } catch (error: any) {
    logger.error('Error getting synced lesson progress:', error);

    if (error instanceof z.ZodError) {
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
export const syncProgressOnDeviceSwitch = onCall({
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

    logger.info('Syncing progress on device switch', {
      userId,
      deviceId,
      courseId
    });

    // Build query
    let query: admin.firestore.Query = firestore
      .collection('lessonProgress')
      .where('userId', '==', userId);

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    const progressSnapshot = await query.get();

    const syncedLessons: any[] = [];
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
  } catch (error: any) {
    logger.error('Error syncing progress on device switch:', error);

    if (error instanceof z.ZodError) {
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
