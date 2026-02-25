// Standardized response helpers
// Enforces consistent { success, message, data } shape across all endpoints
export const sendSuccess = (res, { message = 'Success', data = null, statusCode = 200 } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, { message = 'An error occurred', statusCode = 500, errors = null } = {}) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
