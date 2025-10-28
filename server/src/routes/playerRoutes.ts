import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getPlayerData } from '../controllers/playerController';

const router = Router();

router.get('/courses/:courseId/player-data', authenticateToken, getPlayerData);

export default router; 