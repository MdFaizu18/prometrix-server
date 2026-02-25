import { Router } from 'express';
import * as templateController from '../controllers/template.controller.js';
import {
  createTemplateValidation,
  updateTemplateValidation,
  publicTemplatesValidation,
} from '../validations/template.validation.js';
import { mongoIdParam } from '../validations/prompt.validation.js';
import validate from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * GET /api/templates/public?category=backend
 * Public route - no auth required
 */
router.get('/public', publicTemplatesValidation, validate, templateController.getPublicTemplates);

// All routes below require authentication
router.use(protect);

/**
 * POST /api/templates
 * Body: { name, category, basePrompt, toolMode, techStack, isPublic }
 */
router.post('/', createTemplateValidation, validate, templateController.createTemplate);

/**
 * GET /api/templates/my
 */
router.get('/my', templateController.getMyTemplates);

/**
 * PATCH /api/templates/:id
 */
router.patch('/:id', mongoIdParam('id'), ...updateTemplateValidation, validate, templateController.updateTemplate);

/**
 * DELETE /api/templates/:id
 */
router.delete('/:id', mongoIdParam('id'), validate, templateController.deleteTemplate);

export default router;
