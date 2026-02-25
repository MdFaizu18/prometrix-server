import config from '../config/env.config.js';

// Mongoose-specific error transformers
const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  return { message: `${field} already exists`, statusCode: 409 };
};

const handleMongooseValidation = (err) => {
  const message = Object.values(err.errors)
    .map((e) => e.message)
    .join(', ');
  return { message, statusCode: 400 };
};

const handleMongooseCastError = (err) => ({
  message: `Invalid ${err.path}: ${err.value}`,
  statusCode: 400,
});

// Global error handler - must be registered last in Express
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Transform known Mongoose errors into clean user-facing messages
  if (err.code === 11000) ({ message, statusCode } = handleMongooseDuplicateKey(err));
  if (err.name === 'ValidationError') ({ message, statusCode } = handleMongooseValidation(err));
  if (err.name === 'CastError') ({ message, statusCode } = handleMongooseCastError(err));

  const response = { success: false, message };

  // Include stack trace only in development
  if (config.env === 'development') {
    response.stack = err.stack;
  }

  console.error(`[Error] ${statusCode} - ${message}`, config.env === 'development' ? err.stack : '');

  return res.status(statusCode).json(response);
};

export default errorMiddleware;
