import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.util.js';

// Centralized validation result handler
// Applied after express-validator chains to short-circuit invalid requests
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      message: 'Validation failed',
      statusCode: 400,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

export default validate;
