import * as promptService from '../services/prompt.service.js';
import { sendSuccess } from '../utils/response.util.js';
import asyncWrapper from '../utils/asyncWrapper.util.js';

export const getMyHistory = asyncWrapper(async (req, res) => {
  const { page, limit, toolMode, tone, search } = req.query;
  const result = await promptService.getMyPromptHistory(req.user._id, {
    page,
    limit,
    toolMode,
    tone,
    search,
  });
  sendSuccess(res, { message: 'Prompt history retrieved', data: result });
});

export const createPrompt = asyncWrapper(async (req, res) => {
  const prompt = await promptService.createPrompt(req.user._id, req.body);
  sendSuccess(res, { message: 'Prompt created', data: prompt, statusCode: 201 });
});

export const getAllPrompts = asyncWrapper(async (req, res) => {
  const { page, limit, toolMode } = req.query;
  const result = await promptService.getAllPrompts(req.user._id, { page, limit, toolMode });
  sendSuccess(res, { data: result });
});

export const getPromptById = asyncWrapper(async (req, res) => {
  const prompt = await promptService.getPromptById(req.params.id, req.user._id);
  sendSuccess(res, { data: prompt });
});

export const getPromptVersions = asyncWrapper(async (req, res) => {
  const result = await promptService.getPromptVersions(req.params.id, req.user._id);
  sendSuccess(res, { data: result });
});

export const refinePrompt = asyncWrapper(async (req, res) => {
  const version = await promptService.refinePromptVersion(req.params.id, req.user._id);
  sendSuccess(res, { message: 'Prompt refined successfully', data: version, statusCode: 201 });
});

export const compareVersions = asyncWrapper(async (req, res) => {
  const { versionA, versionB } = req.query;
  const result = await promptService.compareVersions(req.params.id, req.user._id, versionA, versionB);
  sendSuccess(res, { data: result });
});

export const updatePrompt = asyncWrapper(async (req, res) => {
  const prompt = await promptService.updatePrompt(req.params.id, req.user._id, req.body);
  sendSuccess(res, { message: 'Prompt updated', data: prompt });
});

export const deletePrompt = asyncWrapper(async (req, res) => {
  await promptService.deletePrompt(req.params.id, req.user._id);
  sendSuccess(res, { message: 'Prompt deleted' });
});