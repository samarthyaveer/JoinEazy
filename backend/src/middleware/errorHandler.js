/**
 * Centralized error handler.
 * Catches all errors passed via next(err).
 */
function errorHandler(err, _req, res, _next) {
  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err.message);
    if (err.stack && !err.isOperational) {
      console.error(err.stack);
    }
  }

  // Operational (known) errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'A record with this data already exists',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced record does not exist',
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Data validation failed',
    });
  }

  // Unknown errors
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}

module.exports = { errorHandler };
