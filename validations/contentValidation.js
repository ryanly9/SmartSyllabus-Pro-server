const Joi = require('joi');

const generateContentSchema = Joi.object({
  contentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'contentId must be a valid MongoDB ObjectId',
      'any.required': 'contentId is required',
    }),
});

module.exports = { generateContentSchema };
