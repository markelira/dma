import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// --- Mux webhook hitelesítés segédfüggvény ---
function verifyMuxSignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;

  // A header formátuma: t=TIMESTAMP,v1=SIGNATURE[,v1=SIG2...]
  const parts = signatureHeader.split(',');
  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp) return false;

  // Időbélyeg-ellenőrzés (±5 perc)
  const FIVE_MINUTES = 60 * 5;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > FIVE_MINUTES) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  return signatures.some((sig) => sig === expectedSig);
}

const prisma = new PrismaClient();

export const handleMuxWebhook = async (req: Request, res: Response) => {
  try {
    const signatureHeader = req.headers['mux-signature'] as string | undefined;
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ MUX_WEBHOOK_SECRET nincs beállítva a környezeti változók között');
      return res.status(500).send('Server misconfiguration');
    }

    // A body ebben a pontban Buffer, mert express.raw middleware-t használunk
    const rawBody = req.body as Buffer;

    // Hitelesítés
    const isValid = verifyMuxSignature(rawBody, signatureHeader, webhookSecret);

    if (!isValid) {
      console.warn('⚠️  Érvénytelen Mux aláírás – kérés elutasítva');
      return res.status(400).send('Invalid signature');
    }

    const webhookData = JSON.parse(rawBody.toString('utf8'));
    console.log('Mux webhook received:', {
      type: webhookData?.type,
      data: webhookData?.data,
      headers: {
        'mux-signature': req.headers['mux-signature'] ? 'present' : 'missing',
        'content-type': req.headers['content-type']
      }
    });

    // Process different webhook event types
    switch (webhookData?.type) {
      case 'video.asset.created':
        console.log('Asset created:', webhookData.data?.id);
        break;

      case 'video.asset.ready':
        console.log('Asset ready:', webhookData.data?.id);
        // Update lesson with playback ID when asset is ready
        if (webhookData.data?.playback_ids?.[0]?.id) {
          const assetId = webhookData.data.id;
          const playbackId = webhookData.data.playback_ids[0].id;
          
          console.log('Updating lesson with playback ID:', playbackId);
          
          // Find and update the lesson that has this asset ID
          try {
            // @ts-ignore - custom fields not yet in generated types
            const updatedLesson = await prisma.lesson.updateMany({
              where: {
                muxAssetId: assetId,
              } as any,
              data: {
                muxPlaybackId: playbackId,
                videoUrl: `https://player.mux.com/${playbackId}`,
              } as any,
            });
            
            console.log('Lesson updated successfully:', updatedLesson);
          } catch (dbError) {
            console.error('Failed to update lesson in database:', dbError);
          }
        }
        break;

      case 'video.asset.errored':
        console.log('Asset errored:', webhookData.data?.id);
        break;

      default:
        console.log('Unknown webhook type:', webhookData?.type);
    }
    
    console.log('Webhook processed successfully');
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook processing failed:', err);
    res.status(400).send('Invalid webhook');
  }
}; 

// -------------------------
// Generate short-lived signed playback (placeholder)
// POST /api/mux/:playbackId/sign -> {url}
export const signPlayback = async (req: Request, res: Response) => {
  const { playbackId } = req.params;
  if (!playbackId) return res.status(400).json({ message: 'playbackId szükséges' });
  try {
    // Delegate to service (currently returns unsigned URL)
    const { generateSignedPlayback } = await import('../services/muxService');
    const url = await generateSignedPlayback(playbackId);
    res.status(200).json({ url });
  } catch (err) {
    console.error('signPlayback error:', err);
    res.status(500).json({ message: 'Nem sikerült lejátszási URL-t generálni.' });
  }
}; 