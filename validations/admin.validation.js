import { body, query, param } from 'express-validator';

export const getUsersValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100').toInt(),
  query('search').optional().trim().isLength({ max: 100 }),
  query('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be true or false'),
];

export const userHistoryValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('toolMode').optional().isIn(['cursor', 'v0', 'generic']),
  query('tone').optional().isIn(['formal', 'casual', 'technical', 'creative', 'concise']),
  query('search').optional().trim().isLength({ max: 100 }),
];

export const toggleStatusValidation = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

export const mongoIdParam = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
];
