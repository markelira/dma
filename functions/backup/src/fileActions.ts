import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { storage } from './config';

// Input validation schema
const getSignedUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'Fájlnév megadása kötelező'),
  fileType: z.string().min(1, 'Fájltípus megadása kötelező'),
  folder: z.string().optional().default('uploads')
});

export const getSignedUploadUrl = onCall(async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Felhasználónak be kell jelentkeznie');
    }

    // Check user permissions
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('permission-denied', 'Felhasználó nem található');
    }

    const userData = userDoc.data();
    const allowedRoles = ['ADMIN', 'INSTRUCTOR'];
    
    if (!userData?.role || !allowedRoles.includes(userData.role)) {
      throw new HttpsError('permission-denied', 'Nincs jogosultság fájl feltöltéséhez');
    }

    // Validate input
    const { fileName, fileType, folder } = getSignedUploadUrlSchema.parse(request.data);

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
    const isEmulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    
    if (isEmulator) {
      // For emulator, use simple HTTP endpoint
      const emulatorUrl = `http://127.0.0.1:9188/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?uploadType=media`;
      const publicUrl = `http://127.0.0.1:9188/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
      
      console.log(`✅ Emulator upload URL generated for user ${request.auth.uid}: ${filePath}`);
      
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

      console.log(`✅ Signed URL generated for user ${request.auth.uid}: ${filePath}`);

      return {
        success: true,
        signedUrl: signedUrl,
        publicUrl: publicUrl,
        filePath: filePath,
        fileName: uniqueFileName,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    }

  } catch (error) {
    console.error('❌ Error in getSignedUploadUrl:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Hiba történt a feltöltési URL generálása során');
  }
}); 