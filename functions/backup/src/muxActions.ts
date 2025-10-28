import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import Mux from '@mux/mux-node';

// Initialize Firebase Admin (already initialized in courseActions.ts)
const firestore = getFirestore();
const auth = getAuth();

// Initialize Mux
import * as functions from 'firebase-functions';

// Mux configuration (expects runtime config set via firebase functions:config:set mux.token_id=... mux.token_secret=...)
const muxConfig = functions.config().mux;
const MUX_TOKEN_ID = muxConfig?.token_id;
const MUX_TOKEN_SECRET = muxConfig?.token_secret;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.warn('⚠️ Mux tokens are not set – getMuxUploadUrl will return a placeholder URL');
}

const muxClient = MUX_TOKEN_ID && MUX_TOKEN_SECRET ? new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
}) : null;

const muxVideo = muxClient ? muxClient.video : null;

// Zod schema for Mux upload URL creation
const getMuxUploadUrlSchema = z.object({
  // No parameters needed for this function
});

// Zod schema for Mux asset status
const getMuxAssetStatusSchema = z.object({
  assetId: z.string().min(1, 'Asset ID szükséges')
});

/**
 * Update lesson document with mock playback ID (development mode only)
 */
async function updateLessonWithMockPlaybackId(assetId: string, playbackId: string): Promise<void> {
  console.log(`🔍 [updateLessonWithMockPlaybackId] Searching for lessons with muxAssetId: ${assetId}`);
  
  // Query all courses to find lessons with matching muxAssetId
  const coursesSnapshot = await firestore.collection('courses').get();
  
  for (const courseDoc of coursesSnapshot.docs) {
    const courseId = courseDoc.id;
    
    // Query modules within this course
    const modulesSnapshot = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .get();
    
    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleId = moduleDoc.id;
      
      // Query lessons within this module
      const lessonsSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleId)
        .collection('lessons')
        .where('muxAssetId', '==', assetId)
        .get();
      
      // Update all matching lessons
      for (const lessonDoc of lessonsSnapshot.docs) {
        const lessonId = lessonDoc.id;
        const lessonPath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
        
        console.log(`✅ [updateLessonWithMockPlaybackId] Updating lesson ${lessonId} with mock playbackId: ${playbackId}`);
        
        await firestore.doc(lessonPath).update({
          muxPlaybackId: playbackId,
          videoUrl: `https://stream.mux.com/${playbackId}`,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`🎉 [updateLessonWithMockPlaybackId] Successfully updated lesson ${lessonId}`);
      }
    }
  }
}

/**
 * Create a Mux upload URL for video uploads (Callable Cloud Function)
 */
export const getMuxUploadUrl = onCall(async (request) => {
  try {
    console.log('🔄 getMuxUploadUrl called');
    
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    console.log('👤 User ID:', userId);

    // For development/emulator, skip user role check to allow testing
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
    
    if (!isEmulator) {
      // Get user data to check role (only in production)
      const userDoc = await firestore.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('Felhasználó nem található.');
      }

      const userData = userDoc.data();
      const userRole = userData?.role;

      // Check if user has appropriate permissions (INSTRUCTOR or ADMIN)
      if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
        throw new Error('Nincs jogosultság videó feltöltéshez. Csak oktatók és adminisztrátorok tölthetnek fel videókat.');
      }
    } else {
      console.log('🧪 Running in emulator mode, skipping role check');
    }

    // Validate input data (no parameters needed)
    getMuxUploadUrlSchema.parse(request.data || {});

    // For development, return a working test URL that can actually be used
    if (isEmulator || !muxVideo) {
      console.log('🔧 Development mode: returning test upload URL');
      
      // Generate a unique test asset ID
      const testAssetId = `test_asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        id: testAssetId,
        url: `http://localhost:5001/dma-67ab7/us-central1/testVideoUpload?assetId=${testAssetId}`,
        assetId: testAssetId
      };
    }

    // Create Mux upload URL (production)
    console.log('🎬 Creating real Mux upload URL');
    const upload = await muxVideo.uploads.create({
      new_asset_settings: { 
        playback_policy: ['public'],
        encoding_tier: 'baseline'
      },
      cors_origin: '*',
      test: false
    });

    console.log('✅ Mux upload URL created:', upload.id);

    return {
      success: true,
      id: upload.id,
      url: upload.url,
      assetId: upload.asset_id
    };

  } catch (error: any) {
    console.error('❌ getMuxUploadUrl error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Get Mux asset status (Callable Cloud Function)
 */
export const getMuxAssetStatus = onCall(async (request) => {
  try {
    console.log('🔍 getMuxAssetStatus called');
    
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    // Validate input
    const { assetId } = getMuxAssetStatusSchema.parse(request.data);
    console.log('🎬 Checking asset:', assetId);

    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
    
    // For development/test assets, return mock ready status
    if (isEmulator || assetId.startsWith('test_asset_') || !muxVideo) {
      console.log('🧪 Development mode: returning test asset status');
      
      const mockPlaybackId = `test_playback_${assetId.replace('test_asset_', '')}`;
      
      // In development mode, also update the lesson document with mock playback ID
      try {
        console.log('🔄 [getMuxAssetStatus] Updating lesson with mock playbackId in development mode');
        await updateLessonWithMockPlaybackId(assetId, mockPlaybackId);
      } catch (error) {
        console.warn('⚠️ [getMuxAssetStatus] Failed to update lesson with mock playbackId:', error);
        // Don't fail the whole function, just log the warning
      }
      
      return {
        success: true,
        status: 'ready',
        playbackId: mockPlaybackId,
        duration: 120,
        aspectRatio: '16:9'
      };
    }

    // Get asset from Mux (production)
    console.log('🎬 Getting real Mux asset status');
    const asset = await muxVideo.assets.retrieve(assetId);

    return {
      success: true,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      duration: asset.duration,
      aspectRatio: asset.aspect_ratio,
      errors: asset.errors
    };

  } catch (error: any) {
    console.error('❌ getMuxAssetStatus error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Test video upload endpoint for development (simulates Mux upload)
 */
export const testVideoUpload = onCall(async (request) => {
  try {
    console.log('🧪 Test video upload called');
    
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
    
    if (!isEmulator) {
      throw new Error('Test upload only available in development mode');
    }

    // Simulate successful upload
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    return {
      success: true,
      message: 'Test video upload successful'
    };

  } catch (error: any) {
    console.error('❌ testVideoUpload error:', error);
    return {
      success: false,
      error: error.message || 'Test upload failed'
    };
  }
}); 