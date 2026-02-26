import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../config/env.config.js';
import AppError from '../utils/AppError.util.js';
import asyncWrapper from '../utils/asyncWrapper.util.js';
import { isBlacklisted } from '../utils/tokenBlacklist.util.js';

// Protect routes: verifies JWT, checks blacklist, and attaches user to req
export const protect = asyncWrapper(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authorization token required', 401);
  }

  const token = authHeader.split(' ')[1];

  // Reject tokens that were explicitly invalidated via logout
  if (isBlacklisted(token)) {
    throw new AppError('Token has been invalidated. Please log in again.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    throw new AppError('User not found or deactivated', 401);
  }

  // Attach decoded token to req so logout can read the exp claim without re-decoding
  req.token = token;
  req.tokenDecoded = decoded;
  req.user = user;
  next();
});

// Role-based access control middleware factory
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};
