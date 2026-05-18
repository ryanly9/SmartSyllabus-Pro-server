const Joi = require('joi');

const submitQuizSchema = Joi.object({
  contentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'contentId must be a valid MongoDB ObjectId',
      'any.required': 'contentId is required',
    }),
  answers: Joi.array()
    .items(
      Joi.object({
        questionIndex: Joi.number().integer().min(0).required(),
        selectedOption: Joi.string().required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one answer is required',
      'any.required': 'Answers are required',
    }),
});

module.exports = { submitQuizSchema };
