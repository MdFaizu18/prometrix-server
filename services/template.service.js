import Template from '../models/template.model.js';
import AppError from '../utils/AppError.util.js';

export const createTemplate = async (userId, data) => {
  const template = await Template.create({ ...data, createdBy: userId });
  return template;
};

export const getMyTemplates = async (userId) => {
  return Template.find({ createdBy: userId }).sort({ createdAt: -1 });
};

export const getPublicTemplates = async ({ category } = {}) => {
  const query = { isPublic: true };
  if (category) query.category = category;
  return Template.find(query).sort({ createdAt: -1 }).populate('createdBy', 'name');
};

export const updateTemplate = async (templateId, userId, data) => {
  const template = await Template.findOneAndUpdate(
    { _id: templateId, createdBy: userId },
    data,
    { new: true, runValidators: true }
  );
  if (!template) throw new AppError('Template not found', 404);
  return template;
};

export const deleteTemplate = async (templateId, userId) => {
  const template = await Template.findOneAndDelete({ _id: templateId, createdBy: userId });
  if (!template) throw new AppError('Template not found', 404);
};
