import UsageAnalytics from '../models/usageAnalytics.model.js';

export const getUserAnalytics = async (userId) => {
  const analytics = await UsageAnalytics.find({ userId })
    .populate('promptId', 'title toolMode')
    .sort({ refinementCount: -1 });

  // Aggregate totals across all prompts
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
    summary.totalRefinements > 0 ? ((summary.totalSuccess / summary.totalRefinements) * 100).toFixed(2) : 0;

  return { summary: { ...summary, overallSuccessRate }, perPrompt: analytics };
};

export const getPromptAnalytics = async (promptId, userId) => {
  const analytics = await UsageAnalytics.findOne({ promptId, userId });
  if (!analytics) return null;
  return analytics;
};
