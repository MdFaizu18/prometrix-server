import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import config from '../config/env.config.js';
import AppError from '../utils/AppError.util.js';
import { blacklistToken } from '../utils/tokenBlacklist.util.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from './email.service.js';

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

/**
 * Forgot Password — Step 1
 * Generates a secure random token, hashes it, saves the hash + expiry to the user,
 * then emails the raw token inside a reset link.
 *
 * Security note: We always respond with the same success message whether or not
 * the email exists — this prevents user enumeration attacks.
 */
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  // Silent return for unknown emails — don't reveal if the account exists
  if (!user || !user.isActive) return;

  // Generate cryptographically secure random token (32 bytes = 64 hex chars)
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store only the SHA-256 hash — if DB is ever breached, hashed tokens are useless
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiresAt = new Date(Date.now() + config.resetPassword.expiresInMs);
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, user.name, rawToken);
  } catch (err) {
    // If email fails, clear the token so the user can try again
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send reset email. Please try again later.', 502);
  }
};

/**
 * Reset Password — Step 2
 * Validates the raw token from the link against the stored hash,
 * checks expiry, sets the new password, and clears the reset fields.
 *
 * @param {string} rawToken   - Token from the URL query param
 * @param {string} newPassword - New password to set
 */
export const resetPassword = async (rawToken, newPassword) => {
  // Hash the incoming token to compare against what's stored in DB
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Find user with matching hash that hasn't expired yet
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpiresAt');

  if (!user) throw new AppError('Reset link is invalid or has expired', 400);

  // Set the new password — pre-save hook will hash it automatically
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Send confirmation email (non-blocking — failure doesn't affect the reset)
  sendPasswordChangedEmail(user.email, user.name).catch((err) => {
    console.warn(`[Email] Confirmation email failed for ${user.email}: ${err.message}`);
  });

  // Return a fresh login token so the user is immediately authenticated
  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};