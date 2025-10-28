import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '@prisma/client';
import { trackLessonProgress, getLessonCompletionStatus, markLessonComplete } from '../controllers/lessonProgressController';

const router = Router();

// Track progress during lesson (Student only)
router.post('/:id/progress', authenticateToken, authorizeRoles(UserRole.STUDENT), trackLessonProgress);

// Get completion status (Student only)
router.get('/:id/completion-status', authenticateToken, authorizeRoles(UserRole.STUDENT), getLessonCompletionStatus);

// Manually mark lesson as complete (Student only)
router.patch('/:id/complete', authenticateToken, authorizeRoles(UserRole.STUDENT), markLessonComplete);

export default router; 