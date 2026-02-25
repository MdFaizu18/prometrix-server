import Prompt from '../models/prompt.model.js';
import PromptVersion from '../models/promptVersion.model.js';
import UsageAnalytics from '../models/usageAnalytics.model.js';
import { refinePrompt as groqRefine } from './groq.service.js';
import AppError from '../utils/AppError.util.js';

// ─── Create ──────────────────────────────────────────────────────────────────

export const createPrompt = async (userId, data) => {
  const prompt = await Prompt.create({ ...data, createdBy: userId });
  return prompt;
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getAllPrompts = async (userId, { page = 1, limit = 10, toolMode } = {}) => {
  const query = { createdBy: userId, isDeleted: false };
  if (toolMode) query.toolMode = toolMode;

  const skip = (page - 1) * limit;

  const [prompts, total] = await Promise.all([
    Prompt.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('currentVersion', 'versionNumber refinedPrompt'),
    Prompt.countDocuments(query),
  ]);

  return {
    prompts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPromptById = async (promptId, userId) => {
  const prompt = await Prompt.findOne({ _id: promptId, createdBy: userId, isDeleted: false }).populate('currentVersion');
  if (!prompt) throw new AppError('Prompt not found', 404);
  return prompt;
};

export const getPromptVersions = async (promptId, userId) => {
  // Verify ownership first
  const prompt = await Prompt.findOne({ _id: promptId, createdBy: userId, isDeleted: false });
  if (!prompt) throw new AppError('Prompt not found', 404);

  const versions = await PromptVersion.find({ promptId }).sort({ versionNumber: -1 });
  return { prompt, versions };
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updatePrompt = async (promptId, userId, data) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: promptId, createdBy: userId, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!prompt) throw new AppError('Prompt not found', 404);
  return prompt;
};

// ─── Delete (soft) ────────────────────────────────────────────────────────────

export const deletePrompt = async (promptId, userId) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: promptId, createdBy: userId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!prompt) throw new AppError('Prompt not found', 404);
  return prompt;
};

// ─── Refinement ───────────────────────────────────────────────────────────────

export const refinePromptVersion = async (promptId, userId) => {
  const prompt = await Prompt.findOne({ _id: promptId, createdBy: userId, isDeleted: false });
  if (!prompt) throw new AppError('Prompt not found', 404);

  // Determine next version number atomically
  const lastVersion = await PromptVersion.findOne({ promptId }).sort({ versionNumber: -1 }).select('versionNumber');
  const nextVersion = (lastVersion?.versionNumber || 0) + 1;

  let feedbackStatus = 'success';
  let refinementResult;

  try {
    refinementResult = await groqRefine(prompt.rawPrompt, prompt.toolMode, prompt.techStack, prompt.tone);
  } catch (error) {
    feedbackStatus = 'failed';
    throw error;
  }

  const version = await PromptVersion.create({
    promptId,
    versionNumber: nextVersion,
    rawPrompt: prompt.rawPrompt,
    refinedPrompt: refinementResult.refinedPrompt,
    refinementSettings: {
      toolMode: prompt.toolMode,
      techStack: prompt.techStack,
      tone: prompt.tone,
      model: refinementResult.model,
    },
    feedbackStatus,
    createdBy: userId,
  });

  // Update prompt's current version reference
  await Prompt.findByIdAndUpdate(promptId, { currentVersion: version._id });

  // Upsert analytics atomically using $inc
  await UsageAnalytics.findOneAndUpdate(
    { userId, promptId },
    {
      $inc: {
        refinementCount: 1,
        successCount: feedbackStatus === 'success' ? 1 : 0,
        failureCount: feedbackStatus === 'failed' ? 1 : 0,
        totalTokensUsed: refinementResult.tokensUsed,
      },
      $set: { lastRefinedAt: new Date() },
    },
    { upsert: true, new: true }
  ).then(async (analytics) => {
    // Recompute rates after increment
    const successRate = analytics.refinementCount > 0 ? (analytics.successCount / analytics.refinementCount) * 100 : 0;
    const failureRate = analytics.refinementCount > 0 ? (analytics.failureCount / analytics.refinementCount) * 100 : 0;
    await UsageAnalytics.findByIdAndUpdate(analytics._id, { $set: { successRate, failureRate } });
  });

  return version;
};

// ─── My Prompt History ────────────────────────────────────────────────────────

/**
 * Returns the authenticated user's full prompt history, each prompt enriched
 * with its total version count and the latest refined prompt for quick preview.
 * Supports pagination, toolMode filter, tone filter, and keyword search on title/description.
 */
export const getMyPromptHistory = async (
  userId,
  { page = 1, limit = 10, toolMode, tone, search } = {}
) => {
  const query = { createdBy: userId, isDeleted: false };
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
      .sort({ updatedAt: -1 })           // most recently touched first
      .skip(skip)
      .limit(limit)
      .populate('currentVersion', 'versionNumber refinedPrompt createdAt feedbackStatus')
      .lean(),                            // lean() for plain objects — faster for read-only responses
    Prompt.countDocuments(query),
  ]);

  // Attach versionCount to each prompt in one batched query instead of N queries
  const promptIds = prompts.map((p) => p._id);
  const versionCounts = await PromptVersion.aggregate([
    { $match: { promptId: { $in: promptIds } } },
    { $group: { _id: '$promptId', count: { $sum: 1 } } },
  ]);

  const countMap = versionCounts.reduce((acc, { _id, count }) => {
    acc[_id.toString()] = count;
    return acc;
  }, {});

  const history = prompts.map((p) => ({
    ...p,
    versionCount: countMap[p._id.toString()] || 0,
  }));

  return {
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

// ─── Compare ──────────────────────────────────────────────────────────────────

export const compareVersions = async (promptId, userId, versionA, versionB) => {
  const prompt = await Prompt.findOne({ _id: promptId, createdBy: userId, isDeleted: false });
  if (!prompt) throw new AppError('Prompt not found', 404);

  const [vA, vB] = await Promise.all([
    PromptVersion.findOne({ promptId, versionNumber: versionA }),
    PromptVersion.findOne({ promptId, versionNumber: versionB }),
  ]);

  if (!vA || !vB) throw new AppError('One or both versions not found', 404);

  return { prompt, versionA: vA, versionB: vB };
};