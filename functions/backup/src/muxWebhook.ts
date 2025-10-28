import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as crypto from 'crypto'
import { Request, Response } from 'express'

// Initialize Firebase Admin if not already initialized
try {
  initializeApp()
} catch (error) {
  // App already initialized
}

const firestore = getFirestore()

interface MuxWebhookEvent {
  type: string
  data: {
    id: string
    status?: string
    playback_ids?: Array<{
      id: string
      policy: string
    }>
  }
  created_at: string
}

interface MuxWebhookPayload {
  type: string
  data: MuxWebhookEvent['data']
  created_at: string
}

/**
 * Verify Mux webhook signature
 */
function verifyMuxSignature(
  body: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  try {
    // Mux signature format: t=timestamp,v1=signature
    const elements = signature.split(',')
    const signatureMap: Record<string, string> = {}
    
    elements.forEach(element => {
      const [key, value] = element.split('=')
      signatureMap[key] = value
    })
    
    const timestampFromHeader = signatureMap.t
    const v1Signature = signatureMap.v1
    
    if (!timestampFromHeader || !v1Signature) {
      console.error('❌ [muxWebhook] Invalid signature format')
      return false
    }
    
    // Check timestamp (prevent replay attacks - within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)
    const headerTime = parseInt(timestampFromHeader)
    
    if (Math.abs(currentTime - headerTime) > 300) {
      console.error('❌ [muxWebhook] Timestamp too old or too new')
      return false
    }
    
    // Compute expected signature
    const payload = `${timestampFromHeader}.${body}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    // Compare signatures
    const isValid = crypto.timingSafeEqual(
      Buffer.from(v1Signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
    
    if (!isValid) {
      console.error('❌ [muxWebhook] Signature verification failed')
    }
    
    return isValid
  } catch (error) {
    console.error('❌ [muxWebhook] Signature verification error:', error)
    return false
  }
}

/**
 * Find lessons by muxAssetId and update with playback ID
 */
async function updateLessonWithPlaybackId(
  assetId: string,
  playbackId: string
): Promise<void> {
  try {
    console.log(`🔍 [muxWebhook] Searching for lessons with muxAssetId: ${assetId}`)
    
    // Query all courses to find lessons with matching muxAssetId
    const coursesSnapshot = await firestore.collection('courses').get()
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id
      
      // Query modules within this course
      const modulesSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .get()
      
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleId = moduleDoc.id
        
        // Query lessons within this module
        const lessonsSnapshot = await firestore
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .where('muxAssetId', '==', assetId)
          .get()
        
        // Update all matching lessons
        for (const lessonDoc of lessonsSnapshot.docs) {
          const lessonId = lessonDoc.id
          const lessonPath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
          
          console.log(`✅ [muxWebhook] Updating lesson ${lessonId} with playbackId: ${playbackId}`)
          
          await firestore.doc(lessonPath).update({
            muxPlaybackId: playbackId,
            videoUrl: `https://stream.mux.com/${playbackId}`,
            updatedAt: new Date().toISOString()
          })
          
          console.log(`🎉 [muxWebhook] Successfully updated lesson ${lessonId}`)
        }
      }
    }
  } catch (error) {
    console.error('❌ [muxWebhook] Error updating lesson:', error)
    throw error
  }
}

/**
 * Process Mux webhook events
 */
async function processMuxEvent(event: MuxWebhookPayload): Promise<void> {
  const { type, data } = event
  const assetId = data.id
  
  console.log(`📨 [muxWebhook] Processing event: ${type} for asset: ${assetId}`)
  
  switch (type) {
    case 'video.asset.ready':
      try {
        if (!data.playback_ids || data.playback_ids.length === 0) {
          console.error('❌ [muxWebhook] No playback IDs found in asset.ready event')
          return
        }
        
        const playbackId = data.playback_ids[0].id
        console.log(`🎯 [muxWebhook] Asset ready - PlaybackId: ${playbackId}`)
        
        await updateLessonWithPlaybackId(assetId, playbackId)
        
        console.log(`✅ [muxWebhook] Successfully processed video.asset.ready for ${assetId}`)
      } catch (error) {
        console.error(`❌ [muxWebhook] Error processing video.asset.ready:`, error)
        throw error
      }
      break
    
    case 'video.asset.created':
      console.log(`ℹ️ [muxWebhook] Asset created: ${assetId} - No action needed`)
      break
    
    case 'video.asset.errored':
      console.error(`❌ [muxWebhook] Asset error for ${assetId}:`, data)
      // Could implement error handling/notification here
      break
    
    default:
      console.log(`ℹ️ [muxWebhook] Unhandled event type: ${type}`)
      break
  }
}

/**
 * Mux Webhook Handler - Firebase Function
 */
export const muxWebhook = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10
  },
  async (req: Request, res: Response) => {
    console.log(`🚀 [muxWebhook] Received webhook: ${req.method} ${req.url}`)
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.error('❌ [muxWebhook] Invalid method - only POST allowed')
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      })
      return
    }
    
    try {
      // Get webhook secret from environment
      const webhookSecret = process.env.MUX_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error('❌ [muxWebhook] MUX_WEBHOOK_SECRET not configured')
        res.status(500).json({
          success: false,
          error: 'Webhook secret not configured'
        })
        return
      }
      
      // Get signature and timestamp from headers
      const signature = req.get('mux-signature')
      const timestamp = req.get('mux-timestamp') || String(Math.floor(Date.now() / 1000))
      
      if (!signature) {
        console.error('❌ [muxWebhook] Missing mux-signature header')
        res.status(400).json({
          success: false,
          error: 'Missing signature'
        })
        return
      }
      
      // Get raw body
      const rawBody = JSON.stringify(req.body)
      
      // Verify signature
      const isValidSignature = verifyMuxSignature(
        rawBody,
        signature,
        webhookSecret,
        timestamp
      )
      
      if (!isValidSignature) {
        console.error('❌ [muxWebhook] Invalid signature')
        res.status(401).json({
          success: false,
          error: 'Invalid signature'
        })
        return
      }
      
      console.log('✅ [muxWebhook] Signature verified successfully')
      
      // Parse and process webhook event
      const webhookEvent: MuxWebhookPayload = req.body
      
      await processMuxEvent(webhookEvent)
      
      console.log('🎉 [muxWebhook] Webhook processed successfully')
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      })
      
    } catch (error) {
      console.error('❌ [muxWebhook] Webhook processing error:', error)
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)