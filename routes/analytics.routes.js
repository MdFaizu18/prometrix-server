import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { mongoIdParam } from '../validations/prompt.validation.js';
import validate from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

/**
 * GET /api/analytics
 * Returns aggregate usage stats for the authenticated user
 */
router.get('/', analyticsController.getUserAnalytics);

/**
 * GET /api/analytics/:promptId
 * Returns analytics for a specific prompt
 */
router.get('/:promptId', mongoIdParam('promptId'), validate, analyticsController.getPromptAnalytics);

export default router;
