import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../config/env.config.js';
import AppError from '../utils/AppError.util.js';
import { blacklistToken } from '../utils/tokenBlacklist.util.js';

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

export const loginUser = async ({ email, password }) => {
  // select: false on password field means we must explicitly request it
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  if (!user.isActive) throw new AppError('Account has been deactivated', 403);

  const token = generateToken(user._id);

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Logout — blacklists the current token so it can't be reused.
 * The token stays invalid until its original expiry time, then it's
 * automatically pruned from the in-memory store (or Redis TTL expires).
 */
export const logoutUser = (token, decoded) => {
  blacklistToken(token, decoded.exp);
};