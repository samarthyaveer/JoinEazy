const { BadRequestError } = require('../utils/errors');

/**
 * Middleware factory: validates req.body against a Joi schema.
 *
 * Usage: validate(schema) where schema is a Joi object.
 */
function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      return next(new BadRequestError(messages));
    }

    req.body = value;
    next();
  };
}

module.exports = { validate };
