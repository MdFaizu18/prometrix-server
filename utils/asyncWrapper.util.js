// Async wrapper eliminates try/catch boilerplate in every controller
// Catches rejected promises and forwards to Express error middleware
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncWrapper;
