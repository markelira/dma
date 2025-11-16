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
exports.getResourceDownloadUrls = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const zod_1 = require("zod");
const firestore = admin.firestore();
const storage = admin.storage();
// Schema for getResourceDownloadUrls
const GetResourcesSchema = zod_1.z.object({
    lessonId: zod_1.z.string(),
    courseId: zod_1.z.string(),
});
/**
 * Get download URLs for all lesson resources
 * Generates signed URLs for Firebase Storage files
 */
exports.getResourceDownloadUrls = (0, https_1.onCall)({
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
        v2_1.logger.info('Getting resource download URLs', {
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
        const downloadableResources = await Promise.all(resources.map(async (resource) => {
            try {
                // If it's a Firebase Storage path
                if (resource.url && resource.url.startsWith('gs://')) {
                    const filePath = resource.url.replace(/^gs:\/\/[^\/]+\//, '');
                    const file = bucket.file(filePath);
                    // Check if file exists
                    const [exists] = await file.exists();
                    if (!exists) {
                        v2_1.logger.warn('Resource file not found', { filePath });
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
            }
            catch (error) {
                v2_1.logger.error('Error generating signed URL for resource', {
                    resource: resource.title,
                    error
                });
                return {
                    ...resource,
                    available: false,
                    error: 'Failed to generate download URL'
                };
            }
        }));
        // Filter out unavailable resources
        const availableResources = downloadableResources.filter(r => r.available);
        v2_1.logger.info('Generated download URLs', {
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
    }
    catch (error) {
        v2_1.logger.error('Error getting resource download URLs:', error);
        if (error instanceof zod_1.z.ZodError) {
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
//# sourceMappingURL=courseResources.js.map