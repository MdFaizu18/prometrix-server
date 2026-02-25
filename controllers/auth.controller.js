import { registerUser, loginUser } from '../services/auth.service.js';
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

export const getMe = asyncWrapper(async (req, res) => {
  sendSuccess(res, { data: req.user });
});
