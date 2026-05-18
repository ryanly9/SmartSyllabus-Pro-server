const express = require('express');
const { submitQuiz, getQuizById } = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { submitQuizSchema } = require('../validations/quizValidation');

const router = express.Router();

// Submit a quiz – students only
router.post(
  '/submit',
  protect,
  authorize('student'),
  validate(submitQuizSchema),
  submitQuiz
);

// Get quiz result by ID
router.get('/:id', protect, getQuizById);

module.exports = router;
