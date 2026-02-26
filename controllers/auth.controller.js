import { registerUser, loginUser, logoutUser, forgotPassword, resetPassword } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.util.js';
import asyncWrapper from '../utils/asyncWrapper.util.js';

export const register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await registerUser({ name, email, password });
  sendSuccess(res, { message: 'Registration successful', data: result, statusCode: 201 });
});

export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });
  sendSuccess(res, { message: 'Login successful', data: result });
});

export const logout = asyncWrapper(async (req, res) => {
  logoutUser(req.token, req.tokenDecoded);
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const getMe = asyncWrapper(async (req, res) => {
  sendSuccess(res, { data: req.user });
});

export const forgotPasswordHandler = asyncWrapper(async (req, res) => {
  await forgotPassword(req.body.email);
  // Always return the same message — prevents email enumeration
  sendSuccess(res, {
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

export const resetPasswordHandler = asyncWrapper(async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;
  const result = await resetPassword(token, password);
  sendSuccess(res, { message: 'Password reset successful. You are now logged in.', data: result });
});