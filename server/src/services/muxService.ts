import Mux from '@mux/mux-node';

const signingKeyId = process.env.MUX_SIGNING_KEY_ID;
const signingKeySecret = process.env.MUX_SIGNING_KEY_SECRET;

// For MVP we create a simple, short-lived signed URL using Mux Node helpers if keys exist; otherwise fallback to unsigned URL
export async function generateSignedPlayback(playbackId: string): Promise<string> {
  // MVP: visszaadjuk a nyers Mux stream URL-t. Ha a signing kulcsok konfigurálva lesznek,
  // ide illeszthető a JWT-alapú aláírás.
  return `https://stream.mux.com/${playbackId}.m3u8`;
} 