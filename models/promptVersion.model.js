import mongoose from 'mongoose';

const promptVersionSchema = new mongoose.Schema(
  {
    promptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    rawPrompt: {
      type: String,
      required: true,
    },
    refinedPrompt: {
      type: String,
      required: true,
    },
    refinementSettings: {
      toolMode: { type: String, enum: ['cursor', 'v0', 'generic'], default: 'generic' },
      techStack: { type: [String], default: [] },
      tone: { type: String, default: 'technical' },
      model: { type: String },
    },
    score: {
      clarity: { type: Number, min: 0, max: 10, default: null },
      specificity: { type: Number, min: 0, max: 10, default: null },
      overall: { type: Number, min: 0, max: 10, default: null },
    },
    feedbackStatus: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: 'success',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index ensures version numbers are unique per prompt
promptVersionSchema.index({ promptId: 1, versionNumber: 1 }, { unique: true });

const PromptVersion = mongoose.model('PromptVersion', promptVersionSchema);
export default PromptVersion;
