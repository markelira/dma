import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';

const firestore = admin.firestore();
const storage = admin.storage();

// Schema for getResourceDownloadUrls
const GetResourcesSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
});

/**
 * Get download URLs for all lesson resources
 * Generates signed URLs for Firebase Storage files
 */
export const getResourceDownloadUrls = onCall({
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
    const { lessonId, courseId } = GetResourcesSchema.parse(request.data);

    logger.info('Getting resource download URLs', {
      userId,
      lessonId,
      courseId
    });

    // Check if user has access to this course
    const enrollmentDoc = await firestore
      .collection('enrollments')
      .doc(`${userId}_${courseId}`)
      .get();

    if (!enrollmentDoc.exists) {
      throw new Error('You must be enrolled in this course to download resources');
    }

    // Get lesson data
    const lessonDoc = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('lessons')
      .doc(lessonId)
      .get();

    if (!lessonDoc.exists) {
      throw new Error('Lesson not found');
    }

    const lessonData = lessonDoc.data();
    const resources = lessonData?.resources || [];

    if (resources.length === 0) {
      return {
        success: true,
        resources: [],
        message: 'No resources available for this lesson'
      };
    }

    // Generate signed URLs for each resource
    const bucket = storage.bucket();
    const downloadableResources = await Promise.all(
      resources.map(async (resource: any) => {
        try {
          // If it's a Firebase Storage path
          if (resource.url && resource.url.startsWith('gs://')) {
            const filePath = resource.url.replace(/^gs:\/\/[^\/]+\//, '');
            const file = bucket.file(filePath);

            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
              logger.warn('Resource file not found', { filePath });
              return {
                ...resource,
                available: false,
                error: 'File not found'
              };
            }

            // Generate signed URL (valid for 1 hour)
            const [signedUrl] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 60 * 60 * 1000, // 1 hour
            });

            return {
              title: resource.title,
              type: resource.type,
              downloadUrl: signedUrl,
              size: resource.size,
              available: true
            };
          }

          // If it's already a public URL, return as is
          return {
            title: resource.title,
            type: resource.type,
            downloadUrl: resource.url,
            size: resource.size,
            available: true
          };
        } catch (error) {
          logger.error('Error generating signed URL for resource', {
            resource: resource.title,
            error
          });

          return {
            ...resource,
            available: false,
            error: 'Failed to generate download URL'
          };
        }
      })
    );

    // Filter out unavailable resources
    const availableResources = downloadableResources.filter(r => r.available);

    logger.info('Generated download URLs', {
      userId,
      lessonId,
      totalResources: resources.length,
      availableResources: availableResources.length
    });

    return {
      success: true,
      resources: downloadableResources,
      summary: {
        total: resources.length,
        available: availableResources.length,
        unavailable: resources.length - availableResources.length
      }
    };
  } catch (error: any) {
    logger.error('Error getting resource download URLs:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get resource download URLs'
    };
  }
});
