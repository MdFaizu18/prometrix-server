import User from '../models/user.model.js';
import Prompt from '../models/prompt.model.js';
import PromptVersion from '../models/promptVersion.model.js';
import UsageAnalytics from '../models/usageAnalytics.model.js';
import AppError from '../utils/AppError.util.js';

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Get all users (excluding passwords) with pagination and optional search.
 * Admin-only.
 */
export const getAllUsers = async ({ page = 1, limit = 10, search, role, isActive } = {}) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;
  if (typeof isActive !== 'undefined') query.isActive = isActive;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Attach promptCount to each user in one batched aggregation
  const userIds = users.map((u) => u._id);
  const promptCounts = await Prompt.aggregate([
    { $match: { createdBy: { $in: userIds }, isDeleted: false } },
    { $group: { _id: '$createdBy', count: { $sum: 1 } } },
  ]);

  const countMap = promptCounts.reduce((acc, { _id, count }) => {
    acc[_id.toString()] = count;
    return acc;
  }, {});

  const enriched = users.map((u) => ({
    ...u,
    promptCount: countMap[u._id.toString()] || 0,
  }));

  return {
    users: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get a single user's profile by ID.
 * Admin-only.
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * Activate or deactivate a user account.
 * Admin-only.
 */
export const toggleUserStatus = async (userId, isActive) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

// ─── User Prompt History (Admin view) ─────────────────────────────────────────

/**
 * Get full prompt history for any user, as seen by an admin.
 * Identical shape to the user's own /my endpoint so the frontend
 * can reuse the same component.
 */
export const getUserPromptHistory = async (
  targetUserId,
  { page = 1, limit = 10, toolMode, tone, search } = {}
) => {
  // Confirm user exists before querying prompts
  const user = await User.findById(targetUserId).select('-password').lean();
  if (!user) throw new AppError('User not found', 404);

  const query = { createdBy: targetUserId, isDeleted: false };
  if (toolMode) query.toolMode = toolMode;
  if (tone) query.tone = tone;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [prompts, total] = await Promise.all([
    Prompt.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('currentVersion', 'versionNumber refinedPrompt createdAt feedbackStatus')
      .lean(),
    Prompt.countDocuments(query),
  ]);

  // Batch version counts
  const promptIds = prompts.map((p) => p._id);
  const versionCounts = await PromptVersion.aggregate([
    { $match: { promptId: { $in: promptIds } } },
    { $group: { _id: '$promptId', count: { $sum: 1 } } },
  ]);

  const vcMap = versionCounts.reduce((acc, { _id, count }) => {
    acc[_id.toString()] = count;
    return acc;
  }, {});

  const history = prompts.map((p) => ({
    ...p,
    versionCount: vcMap[p._id.toString()] || 0,
  }));

  return {
    user,
    history,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get all versions of a specific prompt, admin view (no ownership check).
 */
export const getUserPromptVersions = async (promptId) => {
  const prompt = await Prompt.findOne({ _id: promptId, isDeleted: false })
    .populate('createdBy', 'name email')
    .lean();
  if (!prompt) throw new AppError('Prompt not found', 404);

  const versions = await PromptVersion.find({ promptId })
    .sort({ versionNumber: -1 })
    .lean();

  return { prompt, versions };
};

/**
 * Get analytics for a specific user.
 * Admin-only.
 */
export const getUserAnalyticsByAdmin = async (targetUserId) => {
  const user = await User.findById(targetUserId).select('-password').lean();
  if (!user) throw new AppError('User not found', 404);

  const analytics = await UsageAnalytics.find({ userId: targetUserId })
    .populate('promptId', 'title toolMode tone')
    .lean();

  const summary = analytics.reduce(
    (acc, a) => {
      acc.totalRefinements += a.refinementCount;
      acc.totalSuccess += a.successCount;
      acc.totalFailures += a.failureCount;
      acc.totalTokens += a.totalTokensUsed;
      return acc;
    },
    { totalRefinements: 0, totalSuccess: 0, totalFailures: 0, totalTokens: 0 }
  );

  const overallSuccessRate =
    summary.totalRefinements > 0
      ? ((summary.totalSuccess / summary.totalRefinements) * 100).toFixed(2)
      : 0;

  return { user, summary: { ...summary, overallSuccessRate }, perPrompt: analytics };
};
