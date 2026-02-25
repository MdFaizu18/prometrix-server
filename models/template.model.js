import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    basePrompt: {
      type: String,
      required: [true, 'Base prompt is required'],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

templateSchema.index({ createdBy: 1, createdAt: -1 });
templateSchema.index({ isPublic: 1, category: 1 });

const Template = mongoose.model('Template', templateSchema);
export default Template;
