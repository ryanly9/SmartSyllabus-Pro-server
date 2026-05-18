const AppError = require('../utils/appError');

/**
 * Express middleware factory that validates `req[property]` against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema - Joi validation schema.
 * @param {'body'|'query'|'params'} property - Request property to validate.
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(messages, 400));
    }

    // Replace with sanitized values
    req[property] = value;
    next();
  };
};

module.exports = validate;
