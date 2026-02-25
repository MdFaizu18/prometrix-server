import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    rawPrompt: {
      type: String,
      required: [true, 'Raw prompt is required'],
    },
    currentVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromptVersion',
      default: null,
    },
    toolMode: {
      type: String,
      enum: ['cursor', 'v0', 'generic'],
      default: 'generic',
    },
    techStack: {
      type: [String],
      default: [],
    },
    tone: {
      type: String,
      enum: ['formal', 'casual', 'technical', 'creative', 'concise'],
      default: 'technical',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for user-scoped queries with soft-delete awareness
promptSchema.index({ createdBy: 1, isDeleted: 1, createdAt: -1 });

const Prompt = mongoose.model('Prompt', promptSchema);
export default Prompt;
