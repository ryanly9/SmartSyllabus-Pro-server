/**
 * Wraps an async route handler so that rejected promises are
 * forwarded to Express's global error-handling middleware.
 *
 * @param {Function} fn - Async Express route handler (req, res, next).
 * @returns {Function} Express middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
