import { Router } from 'express';
import * as promptController from '../controllers/prompt.controller.js';
import {
  createPromptValidation,
  updatePromptValidation,
  paginationValidation,
  compareValidation,
  historyValidation,
  mongoIdParam,
} from '../validations/prompt.validation.js';
import validate from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// All prompt routes are protected
router.use(protect);

/**
 * GET /api/prompts/my
 * Returns the current user's full prompt history with version counts.
 * Supports: ?page=1&limit=10&toolMode=cursor&tone=technical&search=api
 *
 * IMPORTANT: This route MUST be declared before /:id — otherwise Express
 * will try to cast the string "my" as a MongoDB ObjectId and throw a CastError.
 */
router.get('/my', historyValidation, validate, promptController.getMyHistory);

/**
 * POST /api/prompts
 * Body: { title, rawPrompt, toolMode, techStack, tone, description }
 */
router.post('/', createPromptValidation, validate, promptController.createPrompt);

/**
 * GET /api/prompts?page=1&limit=10&toolMode=cursor
 */
router.get('/', paginationValidation, validate, promptController.getAllPrompts);

/**
 * GET /api/prompts/:id
 */
router.get('/:id', mongoIdParam('id'), validate, promptController.getPromptById);

/**
 * GET /api/prompts/:id/versions
 */
router.get('/:id/versions', mongoIdParam('id'), validate, promptController.getPromptVersions);

/**
 * POST /api/prompts/:id/refine
 * Calls Groq API and saves a new version
 */
router.post('/:id/refine', mongoIdParam('id'), validate, promptController.refinePrompt);

/**
 * GET /api/prompts/:id/compare?versionA=1&versionB=2
 */
router.get('/:id/compare', mongoIdParam('id'), ...compareValidation, validate, promptController.compareVersions);

/**
 * PATCH /api/prompts/:id
 * Body: { title?, rawPrompt?, toolMode?, tone?, techStack?, description? }
 */
router.patch('/:id', mongoIdParam('id'), ...updatePromptValidation, validate, promptController.updatePrompt);

/**
 * DELETE /api/prompts/:id  (soft delete)
 */
router.delete('/:id', mongoIdParam('id'), validate, promptController.deletePrompt);

export default router;