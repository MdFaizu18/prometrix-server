import { body, query, param } from 'express-validator';

const TOOL_MODES = ['cursor', 'v0', 'generic'];
const TONES = ['formal', 'casual', 'technical', 'creative', 'concise'];

export const createPromptValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
  body('rawPrompt').trim().notEmpty().withMessage('Raw prompt is required'),
  body('toolMode').optional().isIn(TOOL_MODES).withMessage(`toolMode must be one of: ${TOOL_MODES.join(', ')}`),
  body('tone').optional().isIn(TONES).withMessage(`tone must be one of: ${TONES.join(', ')}`),
  body('techStack').optional().isArray().withMessage('techStack must be an array'),
  body('techStack.*').optional().isString().trim(),
  body('description').optional().trim().isLength({ max: 1000 }),
];

export const updatePromptValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('rawPrompt').optional().trim().notEmpty(),
  body('toolMode').optional().isIn(TOOL_MODES),
  body('tone').optional().isIn(TONES),
  body('techStack').optional().isArray(),
  body('description').optional().trim().isLength({ max: 1000 }),
];

export const historyValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100').toInt(),
  query('toolMode').optional().isIn(TOOL_MODES),
  query('tone').optional().isIn(TONES),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100').toInt(),
  query('toolMode').optional().isIn(TOOL_MODES),
];

export const compareValidation = [
  query('versionA').notEmpty().isInt({ min: 1 }).withMessage('versionA must be a positive integer').toInt(),
  query('versionB').notEmpty().isInt({ min: 1 }).withMessage('versionB must be a positive integer').toInt(),
];

export const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
];