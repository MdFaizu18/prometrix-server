import * as analyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.util.js';
import asyncWrapper from '../utils/asyncWrapper.util.js';

export const getUserAnalytics = asyncWrapper(async (req, res) => {
  const analytics = await analyticsService.getUserAnalytics(req.user._id);
  sendSuccess(res, { data: analytics });
});

export const getPromptAnalytics = asyncWrapper(async (req, res) => {
  const analytics = await analyticsService.getPromptAnalytics(req.params.promptId, req.user._id);
  sendSuccess(res, { data: analytics });
});
