import * as templateService from '../services/template.service.js';
import { sendSuccess } from '../utils/response.util.js';
import asyncWrapper from '../utils/asyncWrapper.util.js';

export const createTemplate = asyncWrapper(async (req, res) => {
  const template = await templateService.createTemplate(req.user._id, req.body);
  sendSuccess(res, { message: 'Template created', data: template, statusCode: 201 });
});

export const getMyTemplates = asyncWrapper(async (req, res) => {
  const templates = await templateService.getMyTemplates(req.user._id);
  sendSuccess(res, { data: templates });
});

export const getTemplateById = asyncWrapper(async (req, res) => {
  const template = await templateService.getTemplateById(req.params.id, req.user._id);
  sendSuccess(res, { data: template });
});

export const getPublicTemplates = asyncWrapper(async (req, res) => {
  const { category } = req.query;
  const templates = await templateService.getPublicTemplates({ category });
  sendSuccess(res, { data: templates });
});

export const updateTemplate = asyncWrapper(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.user._id, req.body);
  sendSuccess(res, { message: 'Template updated', data: template });
});

export const deleteTemplate = asyncWrapper(async (req, res) => {
  await templateService.deleteTemplate(req.params.id, req.user._id);
  sendSuccess(res, { message: 'Template deleted' });
});
