import express from 'express';
import { handleMuxWebhook, signPlayback } from '../controllers/muxController';

const router = express.Router();

router.post('/mux', handleMuxWebhook);
router.post('/mux/:playbackId/sign', signPlayback);

export default router; 