"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateVideoToMux = exports.testVideoUpload = exports.getMuxAssetStatus = exports.getMuxUploadUrl = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const zod_1 = require("zod");
const mux_node_1 = __importDefault(require("@mux/mux-node"));
// Initialize Firebase Admin (already initialized in index.ts)
const firestore = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
// Lazy initialization of Mux client (load credentials at runtime)
let muxClientInstance = null;
let muxVideoInstance = null;
function getMuxClient() {
    if (!muxClientInstance) {
        try {
            // Load credentials at runtime, not at module level
            const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID_V2;
            const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET_V2;
            if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
                console.warn('⚠️ Mux tokens are not set in environment variables');
                return null;
            }
            muxClientInstance = new mux_node_1.default({
                tokenId: MUX_TOKEN_ID,
                tokenSecret: MUX_TOKEN_SECRET,
            });
            muxVideoInstance = muxClientInstance.video;
            console.log('✅ Mux client initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Mux client:', error);
            return null;
        }
    }
    return muxClientInstance;
}
function getMuxVideo() {
    getMuxClient(); // Ensure client is initialized
    return muxVideoInstance;
}
// Zod schema for Mux upload URL creation
const getMuxUploadUrlSchema = zod_1.z.object({
// No parameters needed for this function
});
// Zod schema for Mux asset status
const getMuxAssetStatusSchema = zod_1.z.object({
    assetId: zod_1.z.string().min(1, 'Asset ID szükséges')
});
// Zod schema for video migration
const migrateVideoToMuxSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, 'Course ID szükséges'),
    moduleId: zod_1.z.string().optional(),
    lessonId: zod_1.z.string().min(1, 'Lesson ID szükséges')
});
/**
 * Update lesson document with mock playback ID (development mode only)
 * Searches both flat lessons (PODCAST/WEBINAR/MASTERCLASS) and module lessons (ACADEMIA)
 */
async function updateLessonWithMockPlaybackId(assetId, playbackId) {
    console.log(`🔍 [updateLessonWithMockPlaybackId] Searching for lessons with muxAssetId: ${assetId}`);
    let foundLesson = false;
    // Query all courses to find lessons with matching muxAssetId
    const coursesSnapshot = await firestore.collection('courses').get();
    for (const courseDoc of coursesSnapshot.docs) {
        const courseId = courseDoc.id;
        // 1) Check FLAT lessons (courses/{courseId}/lessons/{lessonId})
        // Used by PODCAST, WEBINAR, MASTERCLASS course types
        const flatLessonsSnapshot = await firestore
            .collection('courses')
            .doc(courseId)
            .collection('lessons')
            .where('muxAssetId', '==', assetId)
            .get();
        for (const lessonDoc of flatLessonsSnapshot.docs) {
            const lessonId = lessonDoc.id;
            const lessonPath = `courses/${courseId}/lessons/${lessonId}`;
            console.log(`✅ [updateLessonWithMockPlaybackId] Updating FLAT lesson ${lessonId} with mock playbackId: ${playbackId}`);
            await firestore.doc(lessonPath).update({
                muxPlaybackId: playbackId,
                videoUrl: `https://stream.mux.com/${playbackId}`,
                updatedAt: new Date().toISOString()
            });
            console.log(`🎉 [updateLessonWithMockPlaybackId] Successfully updated flat lesson ${lessonId}`);
            foundLesson = true;
        }
        // 2) Check MODULE lessons (courses/{courseId}/modules/{moduleId}/lessons/{lessonId})
        // Used by ACADEMIA course type
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
                console.log(`✅ [updateLessonWithMockPlaybackId] Updating MODULE lesson ${lessonId} with mock playbackId: ${playbackId}`);
                await firestore.doc(lessonPath).update({
                    muxPlaybackId: playbackId,
                    videoUrl: `https://stream.mux.com/${playbackId}`,
                    updatedAt: new Date().toISOString()
                });
                console.log(`🎉 [updateLessonWithMockPlaybackId] Successfully updated module lesson ${lessonId}`);
                foundLesson = true;
            }
        }
    }
    if (!foundLesson) {
        console.warn(`⚠️ [updateLessonWithMockPlaybackId] No lessons found with muxAssetId: ${assetId}`);
    }
}
/**
 * Create a Mux upload URL for video uploads (Callable Cloud Function)
 */
exports.getMuxUploadUrl = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 10,
    secrets: ['MUX_TOKEN_ID_V2', 'MUX_TOKEN_SECRET_V2']
}, async (request) => {
    try {
        console.log('🔄 getMuxUploadUrl called');
        // Verify authentication
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges.');
        }
        const userId = request.auth.uid;
        console.log('👤 User ID:', userId);
        // Get user data to check role
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
        // Validate input data (no parameters needed)
        getMuxUploadUrlSchema.parse(request.data || {});
        // Check if Mux is available
        const muxVideo = getMuxVideo();
        if (!muxVideo) {
            console.log('⚠️ Mux client not available, returning test upload URL');
            // Generate a unique test asset ID
            const testAssetId = `test_asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                success: true,
                id: testAssetId,
                url: `http://localhost:5001/DMA-PROJECT-ID/us-central1/testVideoUpload?assetId=${testAssetId}`,
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
    }
    catch (error) {
        console.error('❌ getMuxUploadUrl error:', error);
        if (error instanceof zod_1.z.ZodError) {
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
exports.getMuxAssetStatus = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 10,
    secrets: ['MUX_TOKEN_ID_V2', 'MUX_TOKEN_SECRET_V2']
}, async (request) => {
    try {
        console.log('🔍 getMuxAssetStatus called');
        // Verify authentication
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges.');
        }
        // Validate input
        const { assetId } = getMuxAssetStatusSchema.parse(request.data);
        console.log('🎬 Checking asset:', assetId);
        // For test assets, return mock ready status
        if (assetId.startsWith('test_asset_')) {
            console.log('🧪 Test asset detected: returning mock status');
            const mockPlaybackId = `test_playback_${assetId.replace('test_asset_', '')}`;
            // Update the lesson document with mock playback ID for test assets
            try {
                console.log('🔄 [getMuxAssetStatus] Updating lesson with mock playbackId for test asset');
                await updateLessonWithMockPlaybackId(assetId, mockPlaybackId);
            }
            catch (error) {
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
        const muxVideo = getMuxVideo();
        if (!muxVideo) {
            throw new Error('Mux client not initialized. Please configure Mux credentials.');
        }
        // The assetId parameter might actually be an Upload ID
        // Try to retrieve as upload first to get the actual Asset ID
        let actualAssetId = assetId;
        try {
            console.log('🔍 Attempting to retrieve as Upload ID first:', assetId);
            const upload = await muxVideo.uploads.retrieve(assetId);
            if (upload.asset_id) {
                console.log('✅ Found Asset ID from Upload:', upload.asset_id);
                actualAssetId = upload.asset_id;
            }
            else {
                console.log('⏳ Upload exists but Asset ID not yet available (still processing)');
                return {
                    success: true,
                    status: 'preparing',
                    message: 'Video is being processed by Mux'
                };
            }
        }
        catch (uploadError) {
            // If retrieving as upload fails, assume it's already an Asset ID
            console.log('ℹ️ Not an Upload ID, treating as Asset ID:', assetId);
        }
        // Now retrieve the actual asset
        console.log('🎬 Retrieving asset:', actualAssetId);
        const asset = await muxVideo.assets.retrieve(actualAssetId);
        return {
            success: true,
            status: asset.status,
            playbackId: asset.playback_ids?.[0]?.id,
            duration: asset.duration,
            aspectRatio: asset.aspect_ratio,
            errors: asset.errors
        };
    }
    catch (error) {
        console.error('❌ getMuxAssetStatus error:', error);
        if (error instanceof zod_1.z.ZodError) {
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
exports.testVideoUpload = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 10
}, async (request) => {
    try {
        console.log('🧪 Test video upload called');
        // This is a test endpoint - always simulate successful upload
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        return {
            success: true,
            message: 'Test video upload successful'
        };
    }
    catch (error) {
        console.error('❌ testVideoUpload error:', error);
        return {
            success: false,
            error: error.message || 'Test upload failed'
        };
    }
});
/**
 * Migrate existing Firebase Storage video to Mux (Callable Cloud Function)
 * This function creates a Mux asset from an existing video URL
 */
exports.migrateVideoToMux = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540, // 9 minutes (max for callable functions)
    maxInstances: 5,
    secrets: ['MUX_TOKEN_ID_V2', 'MUX_TOKEN_SECRET_V2']
}, async (request) => {
    try {
        console.log('🔄 migrateVideoToMux called');
        // Verify authentication
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges.');
        }
        const userId = request.auth.uid;
        // Get user data to check role
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Felhasználó nem található.');
        }
        const userData = userDoc.data();
        const userRole = userData?.role;
        // Only ADMIN can migrate videos
        if (userRole !== 'ADMIN') {
            throw new Error('Nincs jogosultság videó migráláshoz. Csak adminisztrátorok migrálhatnak videókat.');
        }
        // Validate input
        const { courseId, moduleId, lessonId } = migrateVideoToMuxSchema.parse(request.data);
        console.log(`📹 Migrating video for lesson ${lessonId} in course ${courseId}`);
        // Get lesson document
        let lessonRef;
        let lessonDoc;
        if (moduleId) {
            lessonRef = firestore
                .collection('courses')
                .doc(courseId)
                .collection('modules')
                .doc(moduleId)
                .collection('lessons')
                .doc(lessonId);
        }
        else {
            lessonRef = firestore
                .collection('courses')
                .doc(courseId)
                .collection('lessons')
                .doc(lessonId);
        }
        lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            throw new Error('Lecke nem található.');
        }
        const lessonData = lessonDoc.data();
        // Check if lesson has a video URL
        if (!lessonData?.videoUrl) {
            throw new Error('A leckéhez nincs videó URL hozzárendelve.');
        }
        // Check if already migrated
        if (lessonData.muxPlaybackId) {
            console.log('⚠️ Video already migrated to Mux');
            return {
                success: true,
                message: 'A videó már migrálva van Mux-ra',
                playbackId: lessonData.muxPlaybackId,
                alreadyMigrated: true
            };
        }
        // Initialize Mux client
        const muxVideo = getMuxVideo();
        if (!muxVideo) {
            throw new Error('Mux client nincs inicializálva. Konfigurálja a Mux hitelesítő adatokat.');
        }
        console.log(`📤 Creating Mux asset from URL: ${lessonData.videoUrl.substring(0, 50)}...`);
        // Create Mux asset from URL
        const asset = await muxVideo.assets.create({
            input: [{
                    url: lessonData.videoUrl
                }],
            playback_policy: ['public'],
            encoding_tier: 'baseline',
            mp4_support: 'standard'
        });
        console.log(`✅ Mux asset created: ${asset.id}`);
        // Update lesson with Mux asset ID and status
        await lessonRef.update({
            muxAssetId: asset.id,
            muxStatus: 'processing',
            muxMigrationStarted: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        console.log('⏳ Asset is processing. Playback ID will be available when ready.');
        // Return asset info (playback ID will be available after processing)
        return {
            success: true,
            message: 'Videó migráció elindítva. A feldolgozás néhány percet vehet igénybe.',
            assetId: asset.id,
            status: asset.status,
            playbackId: asset.playback_ids?.[0]?.id || null,
            processing: true
        };
    }
    catch (error) {
        console.error('❌ migrateVideoToMux error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validációs hiba',
                details: error.errors
            };
        }
        return {
            success: false,
            error: error.message || 'Ismeretlen hiba történt a migrálás során'
        };
    }
});
//# sourceMappingURL=muxActions.js.map