import { body, query } from 'express-validator';

export const createTemplateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ max: 200 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('basePrompt').trim().notEmpty().withMessage('Base prompt is required'),
  body('toolMode').optional().isIn(['cursor', 'v0', 'generic']),
  body('techStack').optional().isArray(),
  body('isPublic').optional().isBoolean(),
];

export const updateTemplateValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('category').optional().trim().notEmpty(),
  body('basePrompt').optional().trim().notEmpty(),
  body('toolMode').optional().isIn(['cursor', 'v0', 'generic']),
  body('techStack').optional().isArray(),
  body('isPublic').optional().isBoolean(),
];

export const publicTemplatesValidation = [
  query('category').optional().trim(),
];
