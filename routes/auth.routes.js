import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
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
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get('/me', protect, getMe);

export default router;
