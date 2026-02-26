import { Router } from 'express';
import { register, login, logout, getMe, forgotPasswordHandler, resetPasswordHandler } from '../controllers/auth.controller.js';
import {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
} from '../validations/auth.validation.js';
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
 */
router.post('/logout', protect, logout);

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get('/me', protect, getMe);

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Sends a reset link to the email address. Always responds with 200
 * regardless of whether the email exists (prevents enumeration).
 */
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPasswordHandler);

/**
 * POST /api/auth/reset-password?token=<rawToken>
 * Body: { password, confirmPassword }
 * Validates the token, sets the new password, returns a fresh JWT.
 */
router.post('/reset-password', resetPasswordValidation, validate, resetPasswordHandler);

export default router;