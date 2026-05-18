const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes – verifies the JWT token from the Authorization header,
 * attaches the authenticated user to `req.user`.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    next();
  } catch (error) {
    return next(new AppError('Not authorized, token is invalid', 401));
  }
});

/**
 * Restrict access to specific roles.
 * Usage: authorize('admin', 'teacher')
 *
 * @param  {...string} roles - Allowed role names.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized to access this resource`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
