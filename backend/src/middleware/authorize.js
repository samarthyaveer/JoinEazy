const { ForbiddenError } = require('../utils/errors');

/**
 * Higher-order middleware: checks if user's role is in the allowed list.
 * Must be used AFTER authenticate middleware.
 *
 * Usage: authorize('admin') or authorize('student', 'admin')
 */
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('No user context'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

module.exports = { authorize };
