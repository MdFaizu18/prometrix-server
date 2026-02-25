import mongoose from 'mongoose';

const usageAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    promptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt',
      required: true,
    },
    // Aggregate counts updated via $inc for atomic updates
    refinementCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    partialCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    // Computed rates stored for fast reads
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    failureRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastRefinedAt: {
      type: Date,
      default: null,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One analytics document per user-prompt pair
usageAnalyticsSchema.index({ userId: 1, promptId: 1 }, { unique: true });

const UsageAnalytics = mongoose.model('UsageAnalytics', usageAnalyticsSchema);
export default UsageAnalytics;
