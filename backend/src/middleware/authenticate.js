const { verifyToken } = require('../utils/token');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Middleware: Extract and verify JWT from HttpOnly cookie.
 * Attaches decoded user to req.user.
 */
function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    next(err);
  }
}

module.exports = { authenticate };
