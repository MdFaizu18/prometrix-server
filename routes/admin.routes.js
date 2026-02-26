import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import {
  getUsersValidation,
  userHistoryValidation,
  toggleStatusValidation,
  mongoIdParam,
} from '../validations/admin.validation.js';
import validate from '../middlewares/validate.middleware.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// All admin routes require a valid JWT AND admin role
// restrictTo('admin') runs after protect so req.user is already available
router.use(protect, restrictTo('admin'));

// ─── User Management ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * List all users with pagination, search, role filter, and active status filter.
 * ?page=1&limit=10&search=john&role=user&isActive=true
 */
router.get('/users', getUsersValidation, validate, adminController.getAllUsers);

/**
 * GET /api/admin/users/:userId
 * Get a single user's profile.
 */
router.get(
  '/users/:userId',
  mongoIdParam('userId'),
  validate,
  adminController.getUserById
);

/**
 * PATCH /api/admin/users/:userId/status
 * Activate or deactivate a user account.
 * Body: { isActive: true | false }
 */
router.patch(
  '/users/:userId/status',
  mongoIdParam('userId'),
  toggleStatusValidation,
  validate,
  adminController.toggleUserStatus
);

// ─── User Prompt History (Admin view) ─────────────────────────────────────────

/**
 * GET /api/admin/users/:userId/prompts
 * View the full prompt history for any user.
 * Same filters as the user's own /api/prompts/my endpoint.
 * ?page=1&limit=10&toolMode=cursor&tone=technical&search=api
 */
router.get(
  '/users/:userId/prompts',
  mongoIdParam('userId'),
  userHistoryValidation,
  validate,
  adminController.getUserPromptHistory
);

/**
 * GET /api/admin/prompts/:promptId/versions
 * View all versions of any prompt, regardless of owner.
 */
router.get(
  '/prompts/:promptId/versions',
  mongoIdParam('promptId'),
  validate,
  adminController.getUserPromptVersions
);

/**
 * GET /api/admin/users/:userId/analytics
 * View usage analytics for any user.
 */
router.get(
  '/users/:userId/analytics',
  mongoIdParam('userId'),
  validate,
  adminController.getUserAnalytics
);

export default router;
