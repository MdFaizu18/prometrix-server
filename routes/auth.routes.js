import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { registerValidation, loginValidation } from '../validations/auth.validation.js';
import validate from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post('/register', registerValidation, validate, register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', loginValidation, validate, login);

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 * Blacklists the current token — any further requests with it return 401.
 */
router.post('/logout', protect, logout);

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get('/me', protect, getMe);

export default router;
