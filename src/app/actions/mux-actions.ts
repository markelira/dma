"use server";

import { muxVideo } from '../../../lib/mux';

export async function createUploadUrl() {
  try {
    const upload = await muxVideo.uploads.create({
      new_asset_settings: { playback_policies: ['public'] },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
    });
    return { id: upload.id, url: upload.url };
  } catch (error) {
    console.error('Error creating Mux upload URL:', error);
    throw new Error('Failed to create upload URL');
  }
}

export async function getAssetDetails(assetId: string) {
  try {
    const asset = await muxVideo.assets.retrieve(assetId);
    return {
      id: asset.id,
      status: asset.status,
      playback_ids: asset.playback_ids,
      created_at: asset.created_at,
    };
  } catch (error) {
    console.error('Error fetching asset details:', error);
    throw new Error('Failed to fetch asset details');
  }
}

// A lecke frissítése jelenleg Firestore-ban történik a LessonContentEditorModal mentésekor,
// így itt nem használunk Prisma klienst. A későbbi integráció során ez visszaállítható
// egy dedikált backend mikro-szolgáltatásra. 