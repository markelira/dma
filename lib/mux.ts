import Mux from '@mux/mux-node';

const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env as Record<string, string | undefined>;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  throw new Error('Mux Access Token ID and Secret Key must be set in environment variables.');
}

// Új SDK (v8+) inicializálása objektummal – ajánlott forma
const muxClient = new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
});

// Csak a video API-t exportáljuk – lásd docs: client.video.uploads.create()
export const muxVideo = muxClient.video; 