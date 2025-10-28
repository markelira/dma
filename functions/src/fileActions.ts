/**
 * File Actions
 * Handles file upload URL generation with Firebase Storage
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as z from 'zod';
import { logger } from 'firebase-functions/v2';

const firestore = admin.firestore();
const storage = admin.storage();

// Input validation schema
const getSignedUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'Fájlnév megadása kötelező'),
  fileType: z.string().min(1, 'Fájltípus megadása kötelező'),
  folder: z.string().optional().default('uploads')
});

/**
 * Generate a signed URL for file upload to Firebase Storage
 */
export const getSignedUploadUrl = onCall({
  cors: true, // Enable CORS
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[getSignedUploadUrl] Called');

    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Felhasználónak be kell jelentkeznie');
    }

    // Check user permissions (simplified - just check if authenticated)
    // In development, we can be more permissive
    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();

    if (!userDoc.exists) {
      logger.warn(`[getSignedUploadUrl] User not found in Firestore: ${request.auth.uid}, but allowing upload`);
      // Allow upload anyway in development mode
    }

    // Validate input
    const { fileName, fileType, folder } = getSignedUploadUrlSchema.parse(request.data);

    logger.info(`[getSignedUploadUrl] User: ${request.auth.uid}, File: ${fileName}, Type: ${fileType}, Folder: ${folder}`);

    // Generate unique file name to prevent conflicts
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || '';
    const baseFileName = fileName.replace(`.${fileExtension}`, '');
    const uniqueFileName = `${baseFileName}_${timestamp}.${fileExtension}`;

    // Create file path in Cloud Storage
    const filePath = `${folder}/${request.auth.uid}/${uniqueFileName}`;

    // Get bucket reference
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    // Check if we're running in emulator mode
    const isEmulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.FUNCTIONS_EMULATOR === 'true';

    if (isEmulator) {
      // For emulator, use simple HTTP endpoint
      const emulatorUrl = `http://127.0.0.1:9199/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?uploadType=media`;
      const publicUrl = `http://127.0.0.1:9199/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

      logger.info(`[getSignedUploadUrl] Emulator upload URL generated: ${filePath}`);

      return {
        success: true,
        signedUrl: emulatorUrl,
        publicUrl: publicUrl,
        filePath: filePath,
        fileName: uniqueFileName,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    } else {
      // Generate signed URL for upload (production)
      const [signedUrl] = await file.getSignedUrl({
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType,
        version: 'v4'
      });

      // Generate public URL for download (after upload)
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      logger.info(`[getSignedUploadUrl] Signed URL generated: ${filePath}`);

      return {
        success: true,
        signedUrl: signedUrl,
        publicUrl: publicUrl,
        filePath: filePath,
        fileName: uniqueFileName,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    }

  } catch (error: any) {
    logger.error('[getSignedUploadUrl] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', 'Hibás bemeneti adatok: ' + error.errors.map(e => e.message).join(', '));
    }

    throw new HttpsError('internal', 'Hiba történt a feltöltési URL generálása során');
  }
});
