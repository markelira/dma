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
exports.muxWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const crypto = __importStar(require("crypto"));
// Firebase Admin is already initialized in index.ts
const firestore = (0, firestore_1.getFirestore)();
// Mux webhook secret from environment variables (loaded at runtime)
const getMuxWebhookSecret = () => process.env.MUX_WEBHOOK_SECRET_V2;
/**
 * Verify Mux webhook signature
 */
function verifyMuxSignature(body, signature, secret, timestamp) {
    try {
        // Mux signature format: t=timestamp,v1=signature
        const elements = signature.split(',');
        const signatureMap = {};
        elements.forEach(element => {
            const [key, value] = element.split('=');
            signatureMap[key] = value;
        });
        const timestampFromHeader = signatureMap.t;
        const v1Signature = signatureMap.v1;
        if (!timestampFromHeader || !v1Signature) {
            console.error('❌ [muxWebhook] Invalid signature format');
            return false;
        }
        // Check timestamp (prevent replay attacks - within 5 minutes)
        const currentTime = Math.floor(Date.now() / 1000);
        const headerTime = parseInt(timestampFromHeader);
        if (Math.abs(currentTime - headerTime) > 300) {
            console.error('❌ [muxWebhook] Timestamp too old or too new');
            return false;
        }
        // Compute expected signature
        const payload = `${timestampFromHeader}.${body}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        // Compare signatures
        const isValid = crypto.timingSafeEqual(Buffer.from(v1Signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        if (!isValid) {
            console.error('❌ [muxWebhook] Signature verification failed');
        }
        return isValid;
    }
    catch (error) {
        console.error('❌ [muxWebhook] Signature verification error:', error);
        return false;
    }
}
/**
 * Find lessons by muxAssetId and update with playback ID
 * Searches both flat lessons (PODCAST/WEBINAR/MASTERCLASS) and module lessons (ACADEMIA)
 */
async function updateLessonWithPlaybackId(assetId, playbackId) {
    try {
        console.log(`🔍 [muxWebhook] Searching for lessons with muxAssetId: ${assetId}`);
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
                console.log(`✅ [muxWebhook] Updating FLAT lesson ${lessonId} with playbackId: ${playbackId}`);
                await firestore.doc(lessonPath).update({
                    muxPlaybackId: playbackId,
                    videoUrl: `https://stream.mux.com/${playbackId}`,
                    updatedAt: new Date().toISOString()
                });
                console.log(`🎉 [muxWebhook] Successfully updated flat lesson ${lessonId}`);
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
                    console.log(`✅ [muxWebhook] Updating MODULE lesson ${lessonId} with playbackId: ${playbackId}`);
                    await firestore.doc(lessonPath).update({
                        muxPlaybackId: playbackId,
                        videoUrl: `https://stream.mux.com/${playbackId}`,
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`🎉 [muxWebhook] Successfully updated module lesson ${lessonId}`);
                    foundLesson = true;
                }
            }
        }
        if (!foundLesson) {
            console.warn(`⚠️ [muxWebhook] No lessons found with muxAssetId: ${assetId}`);
        }
    }
    catch (error) {
        console.error('❌ [muxWebhook] Error updating lesson:', error);
        throw error;
    }
}
/**
 * Process Mux webhook events
 */
async function processMuxEvent(event) {
    const { type, data } = event;
    const assetId = data.id;
    console.log(`📨 [muxWebhook] Processing event: ${type} for asset: ${assetId}`);
    switch (type) {
        case 'video.asset.ready':
            try {
                if (!data.playback_ids || data.playback_ids.length === 0) {
                    console.error('❌ [muxWebhook] No playback IDs found in asset.ready event');
                    return;
                }
                const playbackId = data.playback_ids[0].id;
                console.log(`🎯 [muxWebhook] Asset ready - PlaybackId: ${playbackId}`);
                await updateLessonWithPlaybackId(assetId, playbackId);
                console.log(`✅ [muxWebhook] Successfully processed video.asset.ready for ${assetId}`);
            }
            catch (error) {
                console.error(`❌ [muxWebhook] Error processing video.asset.ready:`, error);
                throw error;
            }
            break;
        case 'video.asset.created':
            console.log(`ℹ️ [muxWebhook] Asset created: ${assetId} - No action needed`);
            break;
        case 'video.asset.errored':
            console.error(`❌ [muxWebhook] Asset error for ${assetId}:`, data);
            // Could implement error handling/notification here
            break;
        default:
            console.log(`ℹ️ [muxWebhook] Unhandled event type: ${type}`);
            break;
    }
}
/**
 * Mux Webhook Handler - Firebase Function
 */
exports.muxWebhook = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
    secrets: ['MUX_WEBHOOK_SECRET_V2']
}, async (req, res) => {
    console.log(`🚀 [muxWebhook] Received webhook: ${req.method} ${req.url}`);
    // Only accept POST requests
    if (req.method !== 'POST') {
        console.error('❌ [muxWebhook] Invalid method - only POST allowed');
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        // Get webhook secret from environment
        const MUX_WEBHOOK_SECRET = getMuxWebhookSecret();
        // Verify webhook secret is configured
        if (!MUX_WEBHOOK_SECRET) {
            console.error('❌ [muxWebhook] MUX_WEBHOOK_SECRET not configured');
            res.status(500).json({
                success: false,
                error: 'Webhook secret not configured'
            });
            return;
        }
        // Get signature and timestamp from headers
        const signature = req.get('mux-signature');
        const timestamp = req.get('mux-timestamp') || String(Math.floor(Date.now() / 1000));
        if (!signature) {
            console.error('❌ [muxWebhook] Missing mux-signature header');
            res.status(400).json({
                success: false,
                error: 'Missing signature'
            });
            return;
        }
        // Get raw body
        const rawBody = JSON.stringify(req.body);
        // Verify signature
        const isValidSignature = verifyMuxSignature(rawBody, signature, MUX_WEBHOOK_SECRET, timestamp);
        if (!isValidSignature) {
            console.error('❌ [muxWebhook] Invalid signature');
            res.status(401).json({
                success: false,
                error: 'Invalid signature'
            });
            return;
        }
        console.log('✅ [muxWebhook] Signature verified successfully');
        // Parse and process webhook event
        const webhookEvent = req.body;
        await processMuxEvent(webhookEvent);
        console.log('🎉 [muxWebhook] Webhook processed successfully');
        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });
    }
    catch (error) {
        console.error('❌ [muxWebhook] Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=muxWebhook.js.map